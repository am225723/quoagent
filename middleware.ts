import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Check for /api/run exception (Bearer Token pass-through)
  if (pathname.startsWith('/api/run')) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return NextResponse.next();
    }
  }

  // 2. Enforce Basic Auth for everything else
  const basicAuth = req.headers.get('authorization');
  const pwd = process.env.ADMIN_PASSWORD;

  if (!pwd) {
    console.error('ADMIN_PASSWORD not set');
    return new NextResponse('Configuration Error', { status: 500 });
  }

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    if (authValue) {
      try {
        const decoded = atob(authValue);
        const colonIndex = decoded.indexOf(':');

        if (colonIndex !== -1) {
          const password = decoded.slice(colonIndex + 1);
          // We ignore the username, just check the password
          if (secureCompare(password, pwd)) {
            return NextResponse.next();
          }
        }
      } catch (e) {
        // Invalid base64 or format
      }
    }
  }

  // Request Basic Auth
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Access"',
    },
  });
}
