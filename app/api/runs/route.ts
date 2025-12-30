export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const res = NextResponse.json(error ? { error: error.message } : { data }, { status: error ? 500 : 200 });
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}
