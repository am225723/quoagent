import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { secureCompare } from './lib/security';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/run (handled by its own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/run|_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');

  if (!authHeader) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    });
  }

  const [scheme, credentials] = authHeader.split(' ');
  if (scheme !== 'Basic' || !credentials) {
    return new NextResponse('Invalid authentication scheme', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    });
  }

  let decoded;
  try {
    decoded = atob(credentials);
  } catch {
    return new NextResponse('Invalid credentials encoding', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    });
  }

  // Support passwords with colons by splitting only on the first colon
  const colonIndex = decoded.indexOf(':');
  if (colonIndex === -1) {
     return new NextResponse('Invalid credentials format', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    });
  }

  const user = decoded.slice(0, colonIndex);
  const pass = decoded.slice(colonIndex + 1);

  const validUser = 'admin';
  const validPass = process.env.ADMIN_PASSWORD;

  if (!validPass) {
    console.error('ADMIN_PASSWORD is not set in environment variables.');
    return new NextResponse('Server configuration error', { status: 500 });
  }

  if (!secureCompare(user, validUser) || !secureCompare(pass, validPass)) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    });
  }

  return NextResponse.next();
}
