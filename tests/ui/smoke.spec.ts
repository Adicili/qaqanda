import { test, expect } from '@playwright/test';

import { BasePage } from '../pages/BasePage';

test.describe('Smoke: home page', () => {
  test('loads / and has expected title', async ({ page }) => {
    const home = new BasePage(page);

    await home.goto('/');

    await home.expectTitleContains('Next');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
