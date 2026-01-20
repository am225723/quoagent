import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/run (Protected by CRON_SECRET separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/run|_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(req: NextRequest) {
  // Check for Basic Auth
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    // Parse Basic Auth credentials
    const authValue = basicAuth.split(' ')[1];

    // Use atob for decoding Base64 (supported in Edge Runtime)
    try {
      const decoded = atob(authValue);
      // Handle passwords that might contain colons by splitting only on the first colon
      const colonIndex = decoded.indexOf(':');

      if (colonIndex !== -1) {
        const user = decoded.slice(0, colonIndex);
        const pwd = decoded.slice(colonIndex + 1);

        // Verify credentials
        // Note: In a real app, use a constant time comparison to prevent timing attacks
        // But for this simple admin guard, direct comparison is acceptable given the scope.
        if (user === 'admin' && pwd === process.env.ADMIN_PASSWORD) {
          return NextResponse.next();
        }
      }
    } catch (e) {
      // Malformed auth header
      console.error('Middleware auth parsing error:', e);
    }
  }

  // If no auth or invalid auth, return 401
  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
