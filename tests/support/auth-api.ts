import { expect } from '@playwright/test';

import { extractCookieFromSetCookie } from './cookies';

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
