import { test, expect } from '@playwright/test';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

test.describe('EP02-US01 - User Registration API', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC-EP02-US01-01 — register with valid data returns 200', async ({ request }) => {
    const uniqueEmail = `newuser+${Date.now()}@example.com`;

    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: uniqueEmail,
        password: 'Passw0rd!',
        confirmPassword: 'Passw0rd!',
      },
    });

    expect(response.status()).toBe(200);

    const json = await response.json();

    expect(json.success).toBe(true);
  });
});
