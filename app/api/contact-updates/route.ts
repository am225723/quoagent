export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('contact_update_suggestions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(200);

  const res = NextResponse.json(error ? { error: error.message } : { data }, { status: error ? 500 : 200 });
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}
