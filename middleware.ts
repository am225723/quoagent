import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Exclude /api/run from Basic Auth (it has its own bearer token check)
  if (path === '/api/run') {
    return NextResponse.next();
  }

  // Protected paths are covered by the matcher config, but we double check here logic if needed.
  // Actually, since matcher handles scope, we just need to apply auth.
  // But wait, /api/run matches /api/:path*. So we must skip it explicitly (done above).

  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = atob(encoded);
        const splitIndex = decoded.indexOf(':');
        if (splitIndex !== -1) {
           const password = decoded.slice(splitIndex + 1);
           if (password === process.env.ADMIN_PASSWORD) {
             return NextResponse.next();
           }
        }
      } catch (e) {
        // ignore error
      }
    }
  }

  return new NextResponse('Auth Required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: ['/api/:path*', '/review/:path*', '/history/:path*'],
};
