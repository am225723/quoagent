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

function secureCompare(a: string, b: string) {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  if (bufA.byteLength !== bufB.byteLength) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < bufA.byteLength; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Allow /api/run with Bearer token
  if (url.pathname === '/api/run') {
    const authHeader = req.headers.get('authorization');
    if (authHeader && process.env.CRON_SECRET) {
      if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
         return NextResponse.next();
      }
    }
  }

  // Basic Auth for everything else (or if Bearer failed for /api/run)
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    if (authValue) {
      try {
        const decoded = atob(authValue);
        const index = decoded.indexOf(':');
        if (index !== -1) {
          const user = decoded.slice(0, index);
          const pwd = decoded.slice(index + 1);

          if (user === 'admin' && process.env.ADMIN_PASSWORD && secureCompare(pwd, process.env.ADMIN_PASSWORD)) {
            return NextResponse.next();
          }
        }
      } catch (e) {
        // invalid base64
      }
    }
  }

  return new NextResponse('Auth Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
