// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

import { ENV } from '@/lib/env';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST() {
  const res = NextResponse.json({ success: true }, { status: 200 });

  // 1) delete (Next helper)
  res.cookies.delete(SESSION_COOKIE_NAME);

  // 2) and hard-expire with same options as login cookie
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: ENV.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  });

  // Prevent any caching weirdness
  res.headers.set('cache-control', 'no-store');

  return res;
}
