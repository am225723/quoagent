import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /api/run handles its own authentication via Bearer token
  if (pathname.startsWith('/api/run')) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');

  if (basicAuth && basicAuth.startsWith('Basic ')) {
    const authValue = basicAuth.split(' ')[1];
    try {
      const decoded = atob(authValue);
      const separatorIndex = decoded.indexOf(':');
      const pwd = decoded.slice(separatorIndex + 1);
      const validPassword = process.env.ADMIN_PASSWORD;

      if (validPassword && secureCompare(pwd, validPassword)) {
        return NextResponse.next();
      }
    } catch (e) {
      console.error('Middleware auth error:', e);
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

function secureCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; ++i) {
    mismatch |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  }
  return mismatch === 0;
}

export const config = {
  matcher: ['/review/:path*', '/history/:path*', '/api/:path*'],
};
