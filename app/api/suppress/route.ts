export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const { kind, value, reason } = await req.json();

  if (!kind || !value) {
    const res = NextResponse.json({ ok: false, error: 'kind and value required' }, { status: 400 });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }

  const sb = supabaseServer();
  const { error } = await sb.from('suppressions').insert({
    kind,
    value,
    reason: reason ?? null
  });

  if (error) {
    const res = NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }

  // Best-effort: mark summaries as suppressed and mark any pending drafts as rejected
  try {
    if (kind === 'conversation') {
      await sb.from('summaries').update({ suppress_response: true, needs_response: false, needs_response_reason: 'Suppressed manually' }).eq('conversation_id', value);
      await sb.from('draft_replies').update({ status: 'rejected', suppressed: true, updated_at: new Date().toISOString() }).eq('conversation_id', value).eq('status','pending');
    } else if (kind === 'phone') {
      await sb.from('summaries').update({ suppress_response: true, needs_response: false, needs_response_reason: 'Suppressed manually' }).eq('phone', value);
      await sb.from('draft_replies').update({ status: 'rejected', suppressed: true, updated_at: new Date().toISOString() }).eq('phone', value).eq('status','pending');
    }
  } catch {}

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}
