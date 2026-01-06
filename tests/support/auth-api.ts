// tests/support/auth-api.ts
import { expect } from '@playwright/test';

import { TEST_USERS, type TestUserRole } from '../fixtures/test-users';

import { extractCookieFromSetCookie } from './cookies';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

const REGISTER_ENDPOINT = `${BASE_URL}/api/auth/register`;
const LOGIN_ENDPOINT = `${BASE_URL}/api/auth/login`;

/**
 * Ensures a test user exists.
 * IMPORTANT:
 * - /api/auth/register creates ENGINEER by default (no role assignment here).
 * - LEAD role is provisioned separately via admin promotion endpoint in tests.
 */
export async function ensureUser(request: any, role: TestUserRole) {
  const user = TEST_USERS[role];

  const res = await request.post(REGISTER_ENDPOINT, {
    data: {
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
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
