// tests/support/users.ts
import { expect } from '@playwright/test';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

export async function ensureEngineerUser(request: any) {
  const email = 'engineer@example.com';
  const password = 'Passw0rd!';

  const r = await request.post(`${BASE_URL}/api/auth/register`, {
    data: { email, password, confirmPassword: password },
  });

  expect([200, 409]).toContain(r.status());
  return { email, password };
}

export async function getLeadCredentials() {
  return {
    email: 'lead@example.com',
    password: 'Passw0rd!',
  };
}

function extractCookieFromSetCookie(setCookieHeader: unknown, cookieName: string): string | null {
  const raw = String(setCookieHeader ?? '');
  const idx = raw.indexOf(`${cookieName}=`);
  if (idx === -1) return null;

  const slice = raw.slice(idx);
  const firstPart = slice.split(';')[0]?.trim(); // "name=value"
  return firstPart || null;
}

export async function loginAndGetSessionCookie(
  request: any,
  creds: { email: string; password: string },
) {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: creds.email, password: creds.password },
  });

  expect(res.status(), 'login must succeed before calling protected APIs').toBe(200);

  const setCookie = res.headers()['set-cookie'];
  expect(setCookie, 'login response must include Set-Cookie header').toBeTruthy();

  // Session cookie name is defined in src/lib/session.ts
  const sessionCookie = extractCookieFromSetCookie(setCookie, 'qaqanda_session');
  expect(sessionCookie, 'qaqanda_session cookie must be present in Set-Cookie').toBeTruthy();

  return sessionCookie as string; // "qaqanda_session=...."
}
