// tests/support/auth-api.ts
import { expect } from '@playwright/test';

import { TEST_USERS, type TestUserRole } from '../fixtures/test-users';

import { extractCookieFromSetCookie } from './cookies';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

const REGISTER_ENDPOINT = `${BASE_URL}/api/auth/register`;
const LOGIN_ENDPOINT = `${BASE_URL}/api/auth/login`;

export async function ensureUser(request: any, role: TestUserRole) {
  const user = TEST_USERS[role];

  const res = await request.post(REGISTER_ENDPOINT, {
    data: {
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
      // IMPORTANT:
      // This assumes your backend supports role assignment on register.
      // If it DOES NOT, you must add a test-only seed mechanism later.
      role: user.role,
    },
  });

  // 200 = created, 409 = already exists (idempotent setup)
  expect([200, 409]).toContain(res.status());

  return user;
}

export async function loginAndGetSessionCookie(request: any, role: TestUserRole) {
  const user = await ensureUser(request, role);

  const res = await request.post(LOGIN_ENDPOINT, {
    data: { email: user.email, password: user.password },
  });

  expect(res.status()).toBe(200);

  const setCookieHeader = res.headers()['set-cookie'];
  expect(setCookieHeader, 'login must return Set-Cookie header').toBeTruthy();

  const sessionCookie = extractCookieFromSetCookie(setCookieHeader, 'qaqanda_session');
  expect(sessionCookie, 'qaqanda_session cookie must be present').toBeTruthy();

  return sessionCookie as string; // "qaqanda_session=..."
}
