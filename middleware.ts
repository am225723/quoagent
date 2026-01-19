import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/review/:path*',
    '/history/:path*',
    '/transit/:path*',
    '/summaries/:path*',
    '/settings/:path*',
    '/api/:path*',
  ],
};

export function middleware(req: NextRequest) {
  // Allow /api/run to bypass Basic Auth (it uses Bearer token auth)
  if (req.nextUrl.pathname === '/api/run') {
    return NextResponse.next();
  }

  // Fail closed if no password configured
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return new NextResponse('Server Error: ADMIN_PASSWORD not configured', { status: 500 });
  }

  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // Decode base64
    try {
      const decoded = atob(authValue);
      const colonIndex = decoded.indexOf(':');

      if (colonIndex !== -1) {
        const user = decoded.slice(0, colonIndex);
        const pwd = decoded.slice(colonIndex + 1);

        // Check credentials (user 'admin')
        if (user === 'admin' && pwd === adminPassword) {
          return NextResponse.next();
        }
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
