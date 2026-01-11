import { expect, test } from '../support/test-fixtures';

import { KbPage } from './pages/KbPage';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

test.describe('EP05-US01 — Add Knowledge Base Entry via AI (UI)', () => {
  test('EP05-US01-TC13 — lead add KB entry via UI', async ({ authedLeadPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP05-US01-TC13' },
        { type: 'doc', description: 'docs/TESTING/EP05/Test_Cases_EP05.md' },
        { type: 'us', description: 'EP05-US01' },
      );

    const kbPage = new KbPage(authedLeadPage);

    await kbPage.goto(`${BASE_URL}/kb`);

    await kbPage.addNewEntry('Test entry added');

    await expect(kbPage.kbAddId).toHaveText(/^kb_[0-9a-f-]{36}$/);
  });

  test('EP05-US01-TC14 — kb add error surfaced in UI', async ({ authedLeadPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP05-US01-TC14' },
        { type: 'doc', description: 'docs/TESTING/EP05/Test_Cases_EP05.md' },
        { type: 'us', description: 'EP05-US01' },
      );

    const kbPage = new KbPage(authedLeadPage);

    await authedLeadPage.route('**/api/kb/add', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await kbPage.goto(`${BASE_URL}/kb`);

    await kbPage.addNewEntry('Test entry added');

    await expect(kbPage.kbAddError).toHaveText('Internal server error');
  });
});
