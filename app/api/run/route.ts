export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/agent';

export async function POST(req: Request) {
  const { startDate, endDate, resumeRunId } = await req.json();
  if (!startDate || !endDate) {
    const res = NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }

  try {
    const result = await runAgent({ startDate, endDate, resumeRunId });
    const res = NextResponse.json({ ok: true, ...result }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }
}
