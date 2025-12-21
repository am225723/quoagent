
import { NextResponse } from 'next/server'
import { runAgent } from '@/lib/agent'

export async function POST(req: Request) {
  const { startDate, endDate } = await req.json()
  await runAgent({ startDate, endDate })
  return NextResponse.json({ ok: true })
}
