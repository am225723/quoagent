export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/agent';
import { secureCompare } from '@/lib/security';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  let authorized = false;

  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    authorized = true;
  } else if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const credentials = atob(authHeader.split(' ')[1]);
      const colonIndex = credentials.indexOf(':');
      if (colonIndex !== -1) {
        const password = credentials.slice(colonIndex + 1);
        if (process.env.ADMIN_PASSWORD && secureCompare(password, process.env.ADMIN_PASSWORD)) {
          authorized = true;
        }
      }
    } catch (e) {}
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
