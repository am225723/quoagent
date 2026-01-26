import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { secureCompare } from '@/lib/security';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CRON_SECRET bypass for /api/run
  if (pathname === '/api/run') {
     const authHeader = req.headers.get('authorization');
     const cronSecret = process.env.CRON_SECRET;
     if (authHeader && cronSecret && secureCompare(authHeader, `Bearer ${cronSecret}`)) {
       return NextResponse.next();
     }
  }

  // Basic Auth enforcement
  const basicAuth = req.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (basicAuth && adminPassword) {
    try {
        const authValue = basicAuth.split(' ')[1];
        const [user, pwd] = atob(authValue).split(':');

        if (secureCompare(pwd, adminPassword)) {
             return NextResponse.next();
        }
    } catch (e) {
        // Malformed header, fall through to 401
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
