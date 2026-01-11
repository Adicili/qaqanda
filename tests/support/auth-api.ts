// tests/support/auth-api.ts
import { expect, type APIRequestContext } from '@playwright/test';

import { TEST_USERS, type TestUserRole } from '../fixtures/test-users';

import { extractCookieFromSetCookie } from './cookies';

const REGISTER_ENDPOINT = '/api/auth/register';
const LOGIN_ENDPOINT = '/api/auth/login';
const PROMOTE_ENDPOINT = '/api/admin/users/promote';

export async function promoteUser(
  request: APIRequestContext,
  email: string,
  role: 'LEAD' | 'ENGINEER',
) {
  const res = await request.post(PROMOTE_ENDPOINT, {
    data: { email, role },
    headers: { 'x-admin-secret': process.env.ADMIN_SECRET ?? '' },
  });

  expect(res.status(), 'promote must succeed').toBe(200);
}

/**
 * Ensures a test user exists.
 * - /api/auth/register creates ENGINEER by default.
 */
export async function ensureUser(request: APIRequestContext, role: TestUserRole) {
  const user = TEST_USERS[role];

  const res = await request.post(REGISTER_ENDPOINT, {
    data: {
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
    },
  });

  expect([200, 409]).toContain(res.status());
  if (role === 'LEAD') {
    await promoteUser(request, user.email, 'LEAD');
  }
  return user;
}

export async function loginAndGetSessionCookie(request: APIRequestContext, role: TestUserRole) {
  const user = await ensureUser(request, role);

  const res = await request.post(LOGIN_ENDPOINT, {
    data: { email: user.email, password: user.password },
  });

  expect(res.status()).toBe(200);

  const setCookieHeader = res.headers()['set-cookie'];
  expect(setCookieHeader, 'login must return Set-Cookie header').toBeTruthy();

  const sessionCookie = extractCookieFromSetCookie(setCookieHeader, 'qaqanda_session');
  expect(sessionCookie, 'qaqanda_session cookie must be present').toBeTruthy();

  return sessionCookie as string;
}

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function decodeSessionCookie(sessionCookie: string): { userId: string; role: string } {
  const raw = sessionCookie.split('=')[1] ?? '';
  const body = raw.split('.')[0] ?? '';
  const json = base64UrlDecode(body);
  return JSON.parse(json);
}
