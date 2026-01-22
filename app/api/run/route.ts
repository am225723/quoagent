export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/agent';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  let authorized = false;

  // 1. Check Bearer Token (Cron)
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    authorized = true;
  }

  // 2. Check Basic Auth (Admin/UI)
  if (!authorized && process.env.ADMIN_PASSWORD && authHeader?.startsWith('Basic ')) {
    const authValue = authHeader.split(' ')[1];
    if (authValue) {
      try {
        const decoded = atob(authValue);
        const colonIndex = decoded.indexOf(':');

        if (colonIndex !== -1) {
          const password = decoded.slice(colonIndex + 1);
          const expected = process.env.ADMIN_PASSWORD;

          // Constant-time comparison
          if (password.length === expected.length) {
            let result = 0;
            for (let i = 0; i < password.length; i++) {
              result |= password.charCodeAt(i) ^ expected.charCodeAt(i);
            }
            if (result === 0) {
              authorized = true;
            }
          }
        }
      } catch (e) {
        // Invalid format
      }
    }
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
