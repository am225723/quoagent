export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const { id } = await req.json();
  const sb = supabaseServer();
  const { data, error } = await sb.from('draft_replies').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

  const prompt = `Rewrite this SMS reply to be clearer and still professional. Do not add new commitments. Keep it under 480 characters. Return only the rewritten message.\n\n${data.draft_text}`;

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'sonar', temperature: 0.2, messages: [{ role: 'system', content: 'Rewrite only.' }, { role: 'user', content: prompt }] })
  });
  const json = await res.json() as any;
  const out = String(json?.choices?.[0]?.message?.content ?? '').trim() || data.draft_text;

  const upd = await sb.from('draft_replies').update({ draft_text: out, updated_at: new Date().toISOString(), status: 'pending' }).eq('id', id);
  if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
