import { expect, test } from '@playwright/test';

import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

test.describe('EP02-US01 - User Registration Flow (UI)', () => {
  /**
   * Covers:
   * - Home page renders correctly
   * - Register CTA is visible and functional
   * - Navigation to Register page loads the registration form
   */
  test('EP02-US01-TC10 - Home shows Register CTA and navigates to register page', async ({
    page,
  }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US01-TC10' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US01' },
      );
    const homePage = new HomePage(page);
    const registerPage = new RegisterPage(page);

    await homePage.open(BASE_URL);

    await expect(homePage.title).toBeVisible();
    await expect(homePage.registerLink).toBeVisible();

    await homePage.clickRegisterLink();

    await expect(registerPage.title).toBeVisible();
  });
});
