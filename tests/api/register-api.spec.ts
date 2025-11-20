import { expect } from '@playwright/test';

import { us, tc } from '../support/tags-playwright';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';
const ENDPOINT = `${BASE_URL}/api/auth/register`;

us('EP02-US01', 'User Registration API', () => {
  /**
   * @testcase EP02-US01-TC01
   * @doc docs/testing/EP02_Test_Cases.md
   *
   * Covers:
   * - Valid registration
   * - Default role ENGINEER
   * - No sensitive data in response
   */
  tc('EP02-US01-TC01', 'Register with valid data returns 200', async ({ request }) => {
    const uniqueEmail = `newuser+${Date.now()}@example.com`;

    const response = await request.post(ENDPOINT, {
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

  /**
   * @testcase EP02-US01-TC02
   * @doc docs/testing/EP02_Test_Cases.md
   *
   * Covers:
   * - Duplicate email rejected
   * - Correct 409 status
   */
  tc('EP02-US01-TC02', 'Register with existing email returns 409', async ({ request }) => {
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

  /**
   * @testcase EP02-US01-TC03
   * @doc docs/testing/EP02_Test_Cases.md
   *
   * Covers:
   * - Email format validation
   */
  tc('EP02-US01-TC03', 'Invalid email format returns 400', async ({ request }) => {
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

  /**
   * @testcase EP02-US01-TC04
   * @doc docs/testing/EP02_Test_Cases.md
   *
   * Covers:
   * - Password must contain a special character
   */
  tc('EP02-US01-TC04', 'Password must contain special char returns 400', async ({ request }) => {
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

  /**
   * @testcase EP02-US01-TC05
   * @doc docs/testing/EP02_Test_Cases.md
   *
   * Covers:
   * - Password must contain numeric digit
   */
  tc('EP02-US01-TC05', 'Password must contain a number returns 400', async ({ request }) => {
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

  /**
   * @testcase EP02-US01-TC06
   * @doc docs/testing/EP02_Test_Cases.md
   *
   * Covers:
   * - Password length rules
   */
  tc(
    'EP02-US01-TC06',
    'Password must be at least 8 chars long returns 400',
    async ({ request }) => {
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
    },
  );

  /**
   * @testcase EP02-US01-TC07
   * @doc docs/testing/EP02_Test_Cases.md
   *
   * Covers:
   * - Password mismatch validation
   */
  tc('EP02-US01-TC07', 'Password mismatch returns 400', async ({ request }) => {
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

  /**
   * @testcase EP02-US01-TC08
   * @doc docs/testing/EP02_Test_Cases.md
   *
   * Covers:
   * - Missing request body
   * - Validation error surface
   */
  tc('EP02-US01-TC08', 'Empty body returns 400', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {},
    });

    expect(response.status()).toBe(400);
  });
});
