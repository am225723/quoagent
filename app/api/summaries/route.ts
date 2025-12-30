export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');

  const sb = supabaseServer();
  let q = sb
    .from('summaries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (runId) q = q.eq('run_id', runId);

  const { data, error } = await q;
  const res = NextResponse.json(error ? { error: error.message } : { data }, { status: error ? 500 : 200 });
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}
