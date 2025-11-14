import { test, expect } from '@playwright/test';

import { BasePage } from '../pages/BasePage';
import { ENV } from '../../lib/env';

test.describe('Smoke: home page', () => {
  test('loads / and has expected title', async ({ page }) => {
    const home = new BasePage(page);

    await home.goto('/');

    await home.expectTitleContains(ENV.EXPECTED_TITLE ?? 'Next');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
