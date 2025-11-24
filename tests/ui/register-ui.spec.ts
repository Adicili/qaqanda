import { expect, test } from '@playwright/test';

import { RegisterPage } from './pages/RegisterPage';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

test.describe('EP02-US01 - User Registration Flow (UI)', () => {
  /**
   * @testcase EP02-US01-TC09
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - Inline validation messages on /register
   * - Blocking submit on obviously invalid input
   * - No API calls triggered when form is invalid
   */
  test('EP02-US01-TC09 - Register form UI validations', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    const registerRequests: string[] = [];

    page.on('request', (request: { url: () => any }) => {
      const url = request.url();

      if (url.includes('/api/auth/register')) {
        registerRequests.push(url);
      }
    });

    // Open register page

    await registerPage.open(BASE_URL);

    // Try to submit empty form

    await registerPage.submit();

    await expect(registerPage.emailErrors).toBeVisible();
    await expect(registerPage.passwordErrors).toBeVisible();
    await expect(registerPage.confirmPasswordErrors).toBeVisible();

    // Invalid email format

    await registerPage.fillForm('user@invalid', 'Passw0rd!', 'Passw0rd!');
    await registerPage.submit();

    const emailError = await registerPage.emailErrorText();
    expect(emailError).toMatch(/invalid email/i);

    // Password mismatch

    await registerPage.fillForm('user2@example.com', 'Passw0rd!', 'Passw0rd!1');
    await registerPage.submit();

    const confirmPassError = await registerPage.confirmPasswordErrorText();
    expect(confirmPassError).toMatch(/match/i);

    // Password must contain number

    await registerPage.fillForm('weakpass@example.com', 'Password!', 'Password!');
    await registerPage.submit();

    const passwordError = await registerPage.passwordErrorText();
    expect(passwordError).toMatch(/contain at least one number/i);

    // No API requests sent for invalid states

    expect(registerRequests.length).toBe(0);
  });
});
