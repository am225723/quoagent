export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from('suppressions').select('*').order('created_at', { ascending: false }).limit(500);
  const res = NextResponse.json(error ? { error: error.message } : { data }, { status: error ? 500 : 200 });
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    const res = NextResponse.json({ error: 'id required' }, { status: 400 });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }
  const sb = supabaseServer();
  const { error } = await sb.from('suppressions').delete().eq('id', id);
  const res = NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 500 : 200 });
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}
