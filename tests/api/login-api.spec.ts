import { expect } from '@playwright/test';

import { us, tc } from '../support/tags-playwright';
import { ensureEngineerUser } from '../support/users';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';
const LOGIN_ENDPOINT = `${BASE_URL}/api/auth/login`;

us('EP02-US02', 'Login & Session Cookie (API)', () => {
  /**
   * @testcase EP02-US02-TC01
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - Happy-path login with existing ENGINEER user
   * - 200 OK + { success: true } body
   * - Session cookie issued with HttpOnly + SameSite=Lax flags
   */
  tc('EP02-US02-TC01', 'Login with valid credentials', async ({ request }) => {
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
   * @testcase EP02-US02-TC02
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - Login with correct email but wrong password
   * - 401 Unauthorized
   * - No session cookie issued on failure
   */
  tc('EP02-US02-TC02', 'Login with incorrect password', async ({ request }) => {
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
   * @testcase EP02-US02-TC03
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - Login attempt with non-existing email
   * - 401 Unauthorized with generic message (no user enumeration)
   * - No session cookie issued
   */
  tc('EP02-US02-TC03', 'Login with non-existing email', async ({ request }) => {
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
   * @testcase EP02-US02-TC04
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - Invalid login payloads (empty body)
   * - 400 Bad Request + validation error
   */
  tc('EP02-US02-TC04', 'Invalid login body (empty / missing fields)', async ({ request }) => {
    const response = await request.post(LOGIN_ENDPOINT, {
      data: {},
    });

    expect(response.status()).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('Invalid login data');

    expect(json.details).toBeTruthy();
  });
});
