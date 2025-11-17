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

  test('TC-EP02-US01-02 — register with existing email returns 409', async ({ request }) => {
    const existingEmail = `dupe+${Date.now()}@example.com`;

    const first = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: existingEmail,
        password: 'Passw0rd!',
        confirmPassword: 'Passw0rd!',
      },
    });

    expect(first.status()).toBe(200);

    const second = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: existingEmail,
        password: 'Passw0rd!',
        confirmPassword: 'Passw0rd!',
      },
    });

    expect(second.status()).toBe(409);

    const json = await second.json();

    expect(json.error).toBe('Email already in use');
  });

  test('TC-EP02-US01-03 — invalid email format returns 400', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: 'invalid email',
        password: 'Passw0rd!',
        confirmPassword: 'Passw0rd!',
      },
    });
    expect(response.status()).toBe(400);

    const json = await response.json();

    expect(json.error).toBe('Invalid request body');
  });
});
