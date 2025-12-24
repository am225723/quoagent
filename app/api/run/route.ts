export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/agent';

export async function POST(req: Request) {
  const { startDate, endDate, resumeRunId } = await req.json();
  if (!startDate || !endDate) return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 });
  const result = await runAgent({ startDate, endDate, resumeRunId });
  return NextResponse.json({ ok: true, ...result });
}
