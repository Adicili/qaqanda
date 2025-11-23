// src/lib/roles.ts
import { headers, cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type SessionPayload,
  type SessionRole,
} from '@/lib/session';

export type AuthenticatedUser = {
  userId: string;
  role: SessionRole;
};

const USER_ID_HEADER = 'x-user-id';
const USER_ROLE_HEADER = 'x-user-role';

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  // 1) Prvo probamo iz header-a (ako je middleware radio svoj deo)
  const h = await headers();
  const headerUserId = h.get(USER_ID_HEADER);
  const headerRole = h.get(USER_ROLE_HEADER) as SessionRole | null;

  if (headerUserId && headerRole) {
    return { userId: headerUserId, role: headerRole };
  }

  // 2) Ako nema u headeru, fallback: čitamo session cookie i verifikujemo ga u Node runtime-u
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  const session: SessionPayload | null = verifySessionToken(sessionCookie);
  if (!session) {
    return null;
  }

  return {
    userId: session.userId,
    role: session.role,
  };
}

export async function requireLead() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'LEAD') {
    return NextResponse.json({ error: 'Forbidden: LEAD role required' }, { status: 403 });
  }

  return user;
}
