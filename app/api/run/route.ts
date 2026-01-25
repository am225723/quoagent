export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/agent';
import crypto from 'crypto';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expectedAuth = `Bearer ${cronSecret}`;
  const authBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expectedAuth);
  let authorized = false;

  try {
    authorized = authBuf.length === expectedBuf.length && crypto.timingSafeEqual(authBuf, expectedBuf);
  } catch (e) {
    authorized = false;
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
