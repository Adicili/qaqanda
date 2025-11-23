import { expect } from '@playwright/test';

import { us, tc } from '../support/tags-playwright';
import { ensureEngineerUser } from '../support/users';

import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

us('EP02-US02', 'Login & Session Cookie (API)', () => {
  /**
   * @testcase EP02-US02-TC05
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - UI validation on /login
   * - Inline errors for empty fields
   * - Blocking obviously invalid submission (no API call)
   */
  tc('EP02-US02-TC05', 'Login form UI field validations', async ({ page }) => {
    const loginPage = new LoginPage(page);

    const loginRequests: string[] = [];

    page.on('request', (request: { url: () => any }) => {
      const url = request.url();

      if (url.includes('/api/auth/login')) {
        loginRequests.push(url);
      }
    });

    // Open login page
    await loginPage.open(BASE_URL);

    // Try to submit empty fields
    await loginPage.submit();
    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.passwordError).toBeVisible();

    expect(loginRequests.length).toBe(0);

    // Invalid email format
    await loginPage.fillFields('test@test', 'P@ssw0rd');
    await loginPage.submit();

    await expect(loginPage.pageError).toBeVisible();
    await expect(loginPage.pageError).toHaveText(/Please check your input and try again/i);

    // API requests sent for invalid states

    expect(loginRequests.length).toBe(1);

    // Invalid email format
    await loginPage.fillFields('test@test.com', 'P@ssw0rd12345');
    await loginPage.submit();

    await expect(loginPage.pageError).toBeVisible();
    await expect(loginPage.pageError).toHaveText(/Invalid email or password/i);

    // API requests sent for invalid states

    expect(loginRequests.length).toBe(2);
  });

  /**
   * @testcase EP02-US02-TC06
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - Successful login via UI for existing ENGINEER user
   * - Redirect to home page (/)
   * - Home title visible after login
   */
  tc(
    'EP02-US02-TC06',
    'Successful login redirects to home and unlocks protected routes',
    async ({ page, request }) => {
      const { email, password } = await ensureEngineerUser(request);
      const loginPage = new LoginPage(page);
      const homePage = new HomePage(page);

      // Open login page
      await loginPage.open(BASE_URL);

      // Invalid email format
      await loginPage.fillFields(email, password);
      await loginPage.submit();

      // Redirected on home page (/)
      await expect(page).toHaveURL(`${BASE_URL}/`);

      // Home title is visible
      await expect(homePage.title).toBeVisible();

      // Login error banner is not displayed
      await expect(loginPage.pageError).toBeHidden();
    },
  );
});
