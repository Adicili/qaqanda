import { expect, test } from '../support/test-fixtures';

import { KbPage } from './pages/KbPage';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

test.describe('EP02-US03 - Middleware & Role-Based Route Protection (UI)', () => {
  /**
   * Covers:
   * - Current behavior of `/reports` for anonymous users
   * - No unexpected redirect to `/login`
   * - No crash / 500 on initial load
   */
  test('EP02-US03-TC03 - Anonymous access to /reports does not redirect unexpectedly', async ({
    page,
  }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US03-TC03' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US03' },
      );
    await page.goto(`${BASE_URL}/reports`);

    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  /**
   * Covers:
   * - UI behavior when ENGINEER tries to access `/kb`
   * - Redirect or error state for non-LEAD users on KB management UI
   *
   */
  test('EP02-US03-TC05 — ENGINEER accessing /kb is blocked', async ({ authedEngineerPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US02-TC05' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US02' },
      );

    const kbPage = new KbPage(authedEngineerPage);

    await kbPage.open(`${BASE_URL}/kb`);

    await expect(kbPage.kbForbidden).toHaveText('Forbidden: LEAD role required.');
  });

  test('EP02-US03-TC07 — LEAD accessing /kb is allowed', async ({ authedLeadPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP02-US03-TC07' },
        { type: 'doc', description: 'docs/TESTING/EP02/Test_Cases_EP02.md' },
        { type: 'us', description: 'EP02-US03' },
      );

    const kbPage = new KbPage(authedLeadPage);

    await kbPage.open(`${BASE_URL}/kb`);

    await expect(kbPage.kbTitle).toBeVisible();
    await expect(kbPage.kbAddInput).toBeVisible();
    await expect(kbPage.kbIdInput).toBeVisible();
    await expect(kbPage.kbUpdateInput).toBeVisible();
  });
});
