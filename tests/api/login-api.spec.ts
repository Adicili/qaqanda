import { expect, test } from '@playwright/test';

import { ensureEngineerUser } from '../support/users';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';
const LOGIN_ENDPOINT = `${BASE_URL}/api/auth/login`;

test.describe('EP02-US02 - Login & Session Cookie (API)', () => {
  /**
   * Covers:
   * - Happy-path login with existing ENGINEER user
   * - 200 OK + { success: true } body
   * - Session cookie issued with HttpOnly + SameSite=Lax flags
   */
  test('EP02-US02-TC01 - Login with valid credentials', async ({ request }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US02-TC01' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US02' },
      );
    const { email, password } = await ensureEngineerUser(request);

    const response = await request.post(LOGIN_ENDPOINT, {
      data: {
        email,
        password,
      },
    });

    expect(response.status()).toBe(200);

    const json = await response.json();

    expect(json).toEqual({ success: true });

    const setCookieHeader = response.headers()['set-cookie'];
    expect(setCookieHeader).toBeTruthy();
    expect(setCookieHeader).toContain('qaqanda_session=');
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('SameSite=lax');
  });

  /**
   * Covers:
   * - Login with correct email but wrong password
   * - 401 Unauthorized
   * - No session cookie issued on failure
   */
  test('EP02-US02-TC02 - Login with incorrect password', async ({ request }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US02-TC02' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US02' },
      );
    const { email } = await ensureEngineerUser(request);

    const response = await request.post(LOGIN_ENDPOINT, {
      data: {
        email,
        password: 'WrongPass123!',
      },
    });

    expect(response.status()).toBe(401);

    const json = await response.json();
    expect(json.error).toBe('Invalid email or password');

    const setCookieHeader = response.headers()['set-cookie'];
    expect(setCookieHeader).toBeFalsy();
  });

  /**
   * Covers:
   * - Login attempt with non-existing email
   * - 401 Unauthorized with generic message (no user enumeration)
   * - No session cookie issued
   */
  test('EP02-US02-TC03 - Login with non-existing email', async ({ request }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US02-TC03' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US02' },
      );
    const response = await request.post(LOGIN_ENDPOINT, {
      data: {
        email: 'not-exists@example.com',
        password: 'Passw0rd!',
      },
    });

    expect(response.status()).toBe(401);

    const json = await response.json();
    expect(json.error).toBe('Invalid email or password');

    const setCookieHeader = response.headers()['set-cookie'];
    expect(setCookieHeader).toBeFalsy();
  });

  /**
   * Covers:
   * - Invalid login payloads (empty body)
   * - 400 Bad Request + validation error
   */
  test('EP02-US02-TC04 - Invalid login body (empty / missing fields)', async ({ request }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US02-TC04' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US02' },
      );
    const response = await request.post(LOGIN_ENDPOINT, {
      data: {},
    });

    expect(response.status()).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('Invalid login data');

    expect(json.details).toBeTruthy();
  });
});
