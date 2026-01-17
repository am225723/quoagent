export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/agent';

export async function POST(req: Request) {
<<<<<<< HEAD
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
=======
  const authHeader = req.headers.get('Authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
>>>>>>> origin/sentinel-fix-run-auth-13580378670000090596
  }

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
