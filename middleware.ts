// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const USER_ID_HEADER = 'x-user-id';
const USER_ROLE_HEADER = 'x-user-role';
const SESSION_COOKIE_NAME = 'qaqanda_session';

type SessionRole = 'ENGINEER' | 'LEAD';

type SessionPayload = {
  userId: string;
  role: SessionRole;
};

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  return false;
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

function decodeSessionToken(token: string): SessionPayload | null {
  try {
    const [payloadPart] = token.split('.');
    if (!payloadPart) return null;

    // base64url -> base64
    let base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(padLength);

    // atob postoji u Edge runtime-u
    const json = atob(base64);
    const data = JSON.parse(json);

    if (!data || typeof data.userId !== 'string' || typeof data.role !== 'string') {
      return null;
    }

    return {
      userId: data.userId,
      role: data.role as SessionRole,
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    if (isApiRoute(pathname)) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const session = decodeSessionToken(sessionCookie);

  if (!session) {
    if (isApiRoute(pathname)) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(USER_ID_HEADER, session.userId);
  requestHeaders.set(USER_ROLE_HEADER, session.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
