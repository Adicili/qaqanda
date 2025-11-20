import { expect } from '@playwright/test';

import { us, tc } from '../support/tags-playwright';

import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

us('EP02-US01', 'User Registration Flow (UI)', () => {
  /**
   * @testcase EP02-US01-TC10
   * @doc docs/TESTING/EP02/Test_Cases_EP02.md
   *
   * Covers:
   * - Home page renders correctly
   * - Register CTA is visible and functional
   * - Navigation to Register page loads the registration form
   */
  tc(
    'EP02-US01-TC10',
    'Home shows Register CTA and navigates to register page',
    async ({ page }) => {
      const homePage = new HomePage(page);
      const registerPage = new RegisterPage(page);

      await homePage.open(BASE_URL);

      await expect(homePage.title).toBeVisible();
      await expect(homePage.registerLink).toBeVisible();

      await homePage.clickRegisterLink();

      await expect(registerPage.title).toBeVisible();
    },
  );
});
