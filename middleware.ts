import { NextRequest, NextResponse } from 'next/server';
import { secureCompare } from './lib/security';

export const config = {
  matcher: [
    '/((?!api/run|_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(req: NextRequest) {
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
          const validPassword = process.env.ADMIN_PASSWORD;

          if (user === 'admin' && validPassword && secureCompare(pwd, validPassword)) {
            return NextResponse.next();
          }
        }
      } catch (e) {
        // Ignore decoding errors
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
