import { test, expect } from '@playwright/test';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

test.describe('EP02-US01 - User Registration API', () => {
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

    expect(json.errors).toBeDefined();
    expect(json.errors.email).toBeDefined();
    expect(json.errors.email[0]).toBe('Email already in use');
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

    expect(json.errors).toBeDefined();
    expect(json.errors.email).toBeDefined();
    expect(json.errors.email[0]).toBe('Invalid email format');
  });

  test('TC-EP02-US01-04 — password must contain special char returns 400', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: `weakpass+${Date.now()}@example.com`,
        password: 'weakpass1',
        confirmPassword: 'weakpass1',
      },
    });

    expect(response.status()).toBe(400);

    const json = await response.json();

    expect(json.errors).toBeDefined();
    expect(json.errors.password).toBeDefined();
    expect(json.errors.password[0]).toBe('Password must contain at least one special character');
  });

  test('TC-EP02-US01-05 — password must contain a number returns 400', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: `weakpass+${Date.now()}@example.com`,
        password: 'weakpass!',
        confirmPassword: 'weakpass!',
      },
    });

    expect(response.status()).toBe(400);

    const json = await response.json();

    expect(json.errors).toBeDefined();
    expect(json.errors.password).toBeDefined();
    expect(json.errors.password[0]).toBe('Password must contain at least one number');
  });

  test('TC-EP02-US01-06 — password must be at least 8 chars long returns 400', async ({
    request,
  }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: `weakpass+${Date.now()}@example.com`,
        password: 'weak!1',
        confirmPassword: 'weak!1',
      },
    });

    expect(response.status()).toBe(400);

    const json = await response.json();

    expect(json.errors).toBeDefined();
    expect(json.errors.password).toBeDefined();
    expect(json.errors.password[0]).toBe('Password must be at least 8 characters');
  });

  test('TC-EP02-US01-07 — password mismatch returns 400', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: `mismatch+${Date.now()}@example.com`,
        password: 'Passw0rd!',
        confirmPassword: 'Passw0rd!1',
      },
    });

    expect(response.status()).toBe(400);

    const json = await response.json();

    expect(json.errors).toBeDefined();
    expect(json.errors.confirmPassword).toBeDefined();
    expect(json.errors.confirmPassword[0]).toBe('Passwords do not match');
  });

  test('TC-EP02-US01-08 — empty body returns 400', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {},
    });

    expect(response.status()).toBe(400);
  });
});
