import { expect } from '@playwright/test';

import { us, tc, tcSkip } from '../support/tags-playwright';
import { ensureEngineerUser, getLeadCredentials } from '../support/users';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';
const LOGIN_ENDPOINT = `${BASE_URL}/api/auth/login`;
const KB_ENDPOINT = `${BASE_URL}/api/kb/add`;

us('EP02-US03', 'Middleware & Role-Based Route Protection', () => {
  /**
   * @testcase EP02-US03-TC04
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - /api/ask without session cookie
   * - 401 JSON error instead of redirect
   */
  tc('EP02-US03-TC04', 'Unauthenticated API call to /api/ask returns 401', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/ask`, {
      data: { query: 'hi' },
    });

    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json).toHaveProperty('error');
  });

  /**
   * @testcase EP02-US03-TC06
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - ENGINEER session hitting /api/kb/add
   * - requireLead() → 403 Forbidden
   */
  tc('EP02-US03-TC06', 'ENGINEER accessing /api/kb/* receives 403', async ({ request }) => {
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
   * @testcase EP02-US03-TC08
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - LEAD user hitting /api/kb/add
   * - requireLead() allows access (2xx)
   */
  tcSkip('EP02-US03-TC08', 'LEAD accessing /api/kb/* is allowed', async ({ request }) => {
    // Blocked until persistent DB (EP03 Databricks)
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
});
