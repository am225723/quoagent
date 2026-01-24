import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

function secureCompare(a: string, b: string) {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  if (aBuf.byteLength !== bBuf.byteLength) return false;
  let result = 0;
  for (let i = 0; i < aBuf.byteLength; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const pathname = req.nextUrl.pathname;

  // 1. Allow Bearer token for /api/run (Cron jobs)
  if (pathname.startsWith('/api/run')) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      return NextResponse.next();
    }
  }

  // 2. Enforce Basic Auth for everything else (or fallback for /api/run)
  if (authHeader) {
    const match = authHeader.match(/^Basic (.+)$/);
    if (match) {
      try {
        const credentials = atob(match[1]);
        const colonIndex = credentials.indexOf(':');
        if (colonIndex !== -1) {
          const pwd = credentials.slice(colonIndex + 1);
          const adminPassword = process.env.ADMIN_PASSWORD;
          if (adminPassword && secureCompare(pwd, adminPassword)) {
            return NextResponse.next();
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
  });
}
