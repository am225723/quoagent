import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

function safeCompare(a: string, b: string) {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);

  if (aBuf.byteLength !== bBuf.byteLength) return false;

  let result = 0;
  for (let i = 0; i < aBuf.byteLength; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Bypass for /api/run if Bearer token is present
  // We allow the request to proceed to the route handler which will verify the token.
  if (url.pathname === '/api/run') {
    const auth = req.headers.get('authorization');
    if (auth && auth.startsWith('Bearer ')) {
      return NextResponse.next();
    }
  }

  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } });
  }

  try {
    const base64 = authHeader.split(' ')[1];
    const decoded = atob(base64);
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex === -1) {
       throw new Error('Invalid format');
    }

    const pwd = decoded.slice(separatorIndex + 1);
    const validPwd = process.env.ADMIN_PASSWORD || '';

    // If ADMIN_PASSWORD is not set, we should probably fail safe (deny access)
    // safeCompare('', '') is true, so if env is missing and user sends empty password, they get in.
    // We should ensure validPwd is not empty if possible, or assume that's a config error.
    // For now, standard behavior.
    if (!validPwd) {
       // Log warning? Console.log is visible in logs.
       console.warn('ADMIN_PASSWORD is not set in environment variables.');
       return new NextResponse('Configuration Error', { status: 500 });
    }

    if (!safeCompare(pwd, validPwd)) {
       throw new Error('Invalid password');
    }

    return NextResponse.next();
  } catch (e) {
    return new NextResponse('Authentication required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } });
  }
}
