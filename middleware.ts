import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { secureCompare } from './lib/security';

export const config = {
  matcher: [
    '/api/:path*',
  ],
};

export function middleware(req: NextRequest) {
  // Exclude /api/run from Basic Auth (it has its own Bearer auth)
  if (req.nextUrl.pathname.startsWith('/api/run')) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    if (authValue) {
      try {
        const decoded = atob(authValue);
        const colonIndex = decoded.indexOf(':');

        if (colonIndex > 0) {
          const user = decoded.slice(0, colonIndex);
          const pwd = decoded.slice(colonIndex + 1);

          if (
            secureCompare(user, 'admin') &&
            process.env.ADMIN_PASSWORD &&
            secureCompare(pwd, process.env.ADMIN_PASSWORD)
          ) {
            return NextResponse.next();
          }
        }
      } catch (e) {
        // malformed base64
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
