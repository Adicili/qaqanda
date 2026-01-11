import { loginAndGetSessionCookie } from '../support/auth-api';
import { kbAdd } from '../support/kb-api';
import { expect, test } from '../support/test-fixtures';

import { AskPage } from './pages/AskPage';
import { KbPage } from './pages/KbPage';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

test.describe('EP05-US02 — Update Knowledge Base Entry via AI (UI)', () => {
  test('EP05-US02-TC08 — lead update KB entry via UI', async ({ authedLeadPage, request }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP05-US02-TC08' },
        { type: 'doc', description: 'docs/TESTING/EP05/Test_Cases_EP05.md' },
        { type: 'us', description: 'EP05-US02' },
      );

    const sessionCookie = await loginAndGetSessionCookie(request, 'LEAD');

    const res = await kbAdd(request, sessionCookie, {
      prompt: 'Original Text',
    });
    expect(res.status()).toBe(200);

    const addJson = (await res.json()) as { success: true; id: string };
    expect(addJson.id).toMatch(/^kb_/);

    const kbPage = new KbPage(authedLeadPage);
    await kbPage.open(`${BASE_URL}/kb`);

    await kbPage.updateEntry(addJson.id, 'This text is updated');

    await expect(kbPage.kbUpdateId).toHaveText(addJson.id);

    await kbPage.goBackToHomePage();

    const askPage = new AskPage(authedLeadPage);

    await askPage.enterQuestion('is this text updated?');
    await askPage.submit();
    await expect(askPage.askAnswer).toBeVisible();

    const askAnswerText = await askPage.askAnswerText();
    expect(askAnswerText).toMatch(/Update instruction:\s*\nThis text is updated/i);
    expect(askAnswerText).toContain('Original Text');
  });

  test('EP05-US02-TC09 — kb update error surfaced in UI', async ({ authedLeadPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP05-US02-TC09' },
        { type: 'doc', description: 'docs/TESTING/EP05/Test_Cases_EP05.md' },
        { type: 'us', description: 'EP05-US02' },
      );

    const kbPage = new KbPage(authedLeadPage);
    await kbPage.open(`${BASE_URL}/kb`);

    await kbPage.updateEntry('', 'This text is updated');

    await expect(kbPage.kbUpdateError).toHaveText('KB id is required.');

    await kbPage.updateEntry('kb_001', '');

    await expect(kbPage.kbUpdateError).toHaveText('Prompt is required.');

    await kbPage.updateEntry('kb_001', 'This text is updated');

    await expect(kbPage.kbUpdateError).toHaveText('KB doc not found');
  });
});
