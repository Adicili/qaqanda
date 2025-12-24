import { expect, test } from '@playwright/test';

import { ensureEngineerUser, loginAndGetSessionCookie } from '../support/auth-api';
import { injectSessionCookie } from '../support/auth-ui';

import { AskPage } from './pages/AskPage';

const BASE_URL = 'http://localhost:3000';

test.describe('EP04-US03 - Ask UI Page (UI)', () => {
  test('EP04-US03-TC01 - Ask flow happy path', async ({ page, request }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP04-US03-TC01' },
        { type: 'doc', description: 'docs/TESTING/EP04/Test_Cases_EP04.md' },
        { type: 'us', description: 'EP04-US03' },
      );

    const askPage = new AskPage(page);

    const creds = await ensureEngineerUser(request);
    const sessionCookie = await loginAndGetSessionCookie(request, creds);
    await injectSessionCookie(page, sessionCookie, BASE_URL);

    await askPage.open(BASE_URL);

    await askPage.enterQuestion('What is our DoD?');

    await askPage.submit();

    const askAnswer = await askPage.askAnswerText();

    expect(askAnswer).toContain('No relevant knowledge');
  });

  test('EP04-US03-TC02 -  empty input validation', async ({ page, request }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP04-US03-TC02' },
        { type: 'doc', description: 'docs/TESTING/EP04/Test_Cases_EP04.md' },
        { type: 'us', description: 'EP04-US03' },
      );

    const askPage = new AskPage(page);

    const creds = await ensureEngineerUser(request);
    const sessionCookie = await loginAndGetSessionCookie(request, creds);
    await injectSessionCookie(page, sessionCookie, BASE_URL);

    await askPage.open(BASE_URL);

    await askPage.submit();

    const askError = await askPage.askErrorText();

    expect(askError).toMatch('Question is required');
  });
});
