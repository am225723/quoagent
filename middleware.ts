import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { secureCompare } from './lib/security';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Skip internal Next.js paths and specific static files
  // Note: config.matcher handles most of this, but we double-check here for safety.
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Skip /api/run as it uses Bearer token auth (CRON_SECRET)
  if (path === '/api/run') {
    return NextResponse.next();
  }

  // 3. Enforce Basic Auth for everything else (UI pages, other API routes)
  const authHeader = req.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('CRITICAL: ADMIN_PASSWORD is not set in environment variables.');
    // Fail closed if no password set to prevent unauthorized access
    return new NextResponse('Internal Server Error: Security Configuration Missing', { status: 500 });
  }

  if (authHeader) {
    const match = authHeader.match(/^Basic (.+)$/);
    if (match) {
      try {
        const credentials = atob(match[1]);
        // Standard Basic Auth is "username:password"
        // We only care about the password matching ADMIN_PASSWORD
        const colonIndex = credentials.indexOf(':');
        if (colonIndex !== -1) {
           const password = credentials.slice(colonIndex + 1);
           if (secureCompare(password, adminPassword)) {
             return NextResponse.next();
           }
        }
      } catch (e) {
        // Invalid base64 or other error, treat as auth failure
      }
    }
  }

  // 4. Request Auth if missing or invalid
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api/run (handled manually above, but we want it to run middleware to check logic)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
