export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getConversation, listMessages } from '@/lib/openphone';
import { summarizeForCleanup } from '@/lib/perplexity';

function shouldSuppressByEnv(phone: string, transcript: string) {
  const phones = (process.env.RESPONSE_BLOCKLIST_PHONES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (phones.includes(phone)) return { suppress: true, reason: 'Phone is blocklisted (env)' };

  const phrases = (process.env.RESPONSE_BLOCKLIST_PHRASES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const ph of phrases) {
    if (ph && transcript.toLowerCase().includes(ph.toLowerCase())) {
      return { suppress: true, reason: `Transcript contains blocked phrase: ${ph}` };
    }
  }
  return { suppress: false as const, reason: '' };
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  const { conversation_id, phone } = (await req.json()) as { conversation_id?: string; phone?: string };

  if (!conversation_id) {
    return NextResponse.json({ ok: false, error: 'conversation_id required' }, { status: 400 });
  }

  // Avoid duplicate drafts for the same conversation (keep it simple)
  const existing = await sb
    .from('draft_replies')
    .select('*')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (existing.data && existing.data.length > 0) {
    return NextResponse.json({ ok: true, alreadyExists: true, draft: existing.data[0] }, { status: 200 });
  }

  // Fetch conversation info (phoneNumberId is required for listing messages / sending)
  let convo: any;
  try {
    convo = await getConversation(conversation_id);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `Failed to fetch conversation from OpenPhone: ${e?.message ?? String(e)}` },
      { status: 502 }
    );
  }

  const phoneNumberId = convo?.data?.phoneNumberId ?? convo?.phoneNumberId;
  const participants: string[] = (convo?.data?.participants ?? convo?.participants ?? []).filter(Boolean);

  const participant = phone || participants.find((p) => typeof p === 'string') || null;
  if (!phoneNumberId || !participant) {
    return NextResponse.json(
      { ok: false, error: 'Missing phoneNumberId or participant phone for this conversation' },
      { status: 400 }
    );
  }

  const now = new Date();
  const createdBefore = now.toISOString();
  const createdAfter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(); // last 90 days
  let pageToken: string | null = null;
  const all: any[] = [];

  try {
    while (true) {
      const page = await listMessages({
        phoneNumberId,
        participants: [participant],
        createdAfter,
        createdBefore,
        pageToken,
      });
      all.push(...(page.data ?? []));
      if (!page.nextPageToken) break;
      pageToken = page.nextPageToken;
      if (all.length > 500) break;
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `Failed to fetch messages from OpenPhone: ${e?.message ?? String(e)}` },
      { status: 502 }
    );
  }

  const transcript = all
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((m) => `[${m.createdAt}] ${m.direction === 'incoming' ? 'IN' : 'OUT'}: ${m.text}`)
    .join('\n');

  // Suppression checks: DB suppressions first, then env
  const dbSup = await sb
    .from('suppressions')
    .select('kind, value, reason')
    .in('kind', ['phone', 'conversation'])
    .or(`value.eq.${participant},value.eq.${conversation_id}`)
    .limit(20);

  let suppressed = false;
  let suppressReason = '';

  if (dbSup.data && dbSup.data.length > 0) {
    suppressed = true;
    suppressReason = dbSup.data[0].reason || `Suppressed by ${dbSup.data[0].kind}`;
  } else {
    const envSup = shouldSuppressByEnv(participant, transcript);
    suppressed = envSup.suppress;
    suppressReason = envSup.reason;
  }

  if (suppressed) {
    return NextResponse.json({ ok: false, suppressed: true, reason: suppressReason }, { status: 403 });
  }

  let s: any;
  try {
    s = await summarizeForCleanup(transcript);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `Failed to summarize for draft: ${e?.message ?? String(e)}` },
      { status: 502 }
    );
  }

  // Fallback draft if model didn't provide one
  const lastInbound = [...all].reverse().find((m) => m.direction === 'incoming' && typeof m.text === 'string' && m.text.trim());
  const fallback = lastInbound?.text
    ? `Thanks for reaching out — I got your message. Can you share a bit more detail (or confirm your preferred time) so I can help?`
    : `Thanks for reaching out — I can help. What’s the best next step on your end?`;

  const draftText =
    typeof s?.draftReply === 'string' && s.draftReply.trim().length > 0 ? s.draftReply.trim() : fallback;

  const ins = await sb.from('draft_replies').insert({
    run_id: null,
    conversation_id,
    phone: participant,
    from_phone_number_id: phoneNumberId,
    user_id: null,
    draft_text: draftText,
    status: 'pending',
    suppressed: false,
  }).select('*').single();

  if (ins.error) {
    return NextResponse.json({ ok: false, error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, draft: ins.data }, { status: 200 });
}
