import { expect, test } from '@playwright/test';

import { ensureEngineerUser, getLeadCredentials } from '../support/users';

import { ENV } from '@/lib/env';
import { SESSION_COOKIE_NAME } from '@/lib/session';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';
const LOGIN_ENDPOINT = `${BASE_URL}/api/auth/login`;
const KB_ENDPOINT = `${BASE_URL}/api/kb/add`;

test.describe('EP02-US03 - Middleware & Role-Based Route Protection', () => {
  /**
   * Covers:
   * - /api/ask without session cookie
   * - 401 JSON error instead of redirect
   */
  test('EP02-US03-TC04 - Unauthenticated API call to /api/ask returns 401', async ({ request }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US03-TC04' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US03' },
      );
    const response = await request.post(`${BASE_URL}/api/ask`, {
      data: { query: 'hi' },
    });

    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json).toHaveProperty('error');
  });

  /**
   * Covers:
   * - ENGINEER session hitting /api/kb/add
   * - requireLead() → 403 Forbidden
   */
  test('EP02-US03-TC06 - ENGINEER accessing /api/kb/* receives 403', async ({ request }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US03-TC06' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US03' },
      );
    const { email, password } = await ensureEngineerUser(request);

    const login = await request.post(LOGIN_ENDPOINT, {
      data: { email, password },
    });

    const cookie = login.headers()['set-cookie'];
    expect(cookie).toBeDefined();

    const r = await request.post(KB_ENDPOINT, {
      data: { title: 'X' },
      headers: { Cookie: cookie },
    });

    expect(r.status()).toBe(403);
  });

  /**
   * Covers:
   * - LEAD user hitting /api/kb/add
   * - requireLead() allows access (2xx)
   */
  test.skip('EP02-US03-TC08 - LEAD accessing /api/kb/* is allowed', async ({ request }) => {
    test.info().annotations.push(
      { type: 'testcase', description: 'EP02-US03-TC08' },
      { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
      { type: 'us', description: 'EP02-US03' },
      {
        type: 'blocked',
        description: 'Requires real /kb UI and persistent ENGINEER/LEAD roles (EP03/EP05)',
      },
    );
    const { email, password } = await getLeadCredentials();

    const login = await request.post(LOGIN_ENDPOINT, {
      data: { email, password },
    });

    const cookie = login.headers()['set-cookie'];
    expect(cookie).toBeDefined();

    const r = await request.post(KB_ENDPOINT, {
      data: { title: 'Valid KB' },
      headers: { Cookie: cookie },
    });

    expect(r.status()).toBeGreaterThanOrEqual(200);
    expect(r.status()).toBeLessThan(300);
  });

  /**
   * EP02-US03-TC09
   * Invalid/expired session treated as unauthenticated
   */
  test('EP02-US03-TC09 — Invalid/expired session treated as unauthenticated (API)', async ({
    request,
  }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US03-TC09' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US03' },
      );

    const fakeToken = 'THIS_IS_COMPLETELY_INVALID';

    const response = await request.post(`${BASE_URL}/api/ask`, {
      data: { query: 'hi' },
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${fakeToken}`,
      },
    });

    expect(response.status()).toBe(401);

    const json = await response.json();
    expect(json).toHaveProperty('error');
  });
});
