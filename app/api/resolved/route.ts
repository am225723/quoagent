export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from('resolved_contacts').select('*');
  const res = NextResponse.json(error ? { error: error.message } : { data }, { status: error ? 500 : 200 });
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  const { phone, note } = await req.json();
  if (!phone) return NextResponse.json({ ok: false, error: 'phone required' }, { status: 400 });

  const { error } = await sb.from('resolved_contacts').upsert({
    phone,
    note: note ?? null,
    resolved_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const sb = supabaseServer();
  const { phone } = await req.json();
  if (!phone) return NextResponse.json({ ok: false, error: 'phone required' }, { status: 400 });

  const { error } = await sb.from('resolved_contacts').delete().eq('phone', phone);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
