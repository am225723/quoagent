import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { secureCompare } from './lib/security';

export const config = {
  matcher: ['/api/:path*'],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // 1. Allow /api/run with Bearer token
  if (pathname.startsWith('/api/run')) {
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      return NextResponse.next();
    }
  }

  // 2. Enforce Basic Auth for everything else (or /api/run if Bearer failed)
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    try {
      const credentials = atob(base64Credentials);
      const colonIndex = credentials.indexOf(':');
      if (colonIndex !== -1) {
        const password = credentials.slice(colonIndex + 1);
        if (adminPassword && secureCompare(password, adminPassword)) {
          return NextResponse.next();
        }
      }
    } catch (e) {
      // Invalid credentials
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
