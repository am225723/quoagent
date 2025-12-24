export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendTextMessage } from '@/lib/openphone';

export async function POST() {
  const sb = supabaseServer();
  const { data: drafts, error } = await sb.from('draft_replies').select('*').eq('status', 'approved').order('created_at', { ascending: true }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!drafts || drafts.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;
  for (const d of drafts) {
    await sendTextMessage({ content: d.draft_text, from: d.from_phone_number_id, to: d.phone, userId: d.user_id, setInboxStatus: 'done' });
    await sb.from('draft_replies').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', d.id);
    sent += 1;
  }
  return NextResponse.json({ ok: true, sent });
}
