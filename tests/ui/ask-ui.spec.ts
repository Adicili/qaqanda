import { expect, test } from '../support/test-fixtures';

import { AskPage } from './pages/AskPage';
import { HomePage } from './pages/HomePage';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

test.describe('EP04-US03 - Ask UI Page (UI)', () => {
  test('EP04-US03-TC01 - Ask flow happy path', async ({ authedEngineerPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP04-US03-TC01' },
        { type: 'doc', description: 'docs/TESTING/EP04/Test_Cases_EP04.md' },
        { type: 'us', description: 'EP04-US03' },
      );

    const askPage = new AskPage(authedEngineerPage);

    await askPage.open(BASE_URL);

    await askPage.enterQuestion('What is our DoD?');

    await askPage.submit();

    const askAnswer = await askPage.askAnswerText();

    expect(askAnswer).toContain('No relevant knowledge');
  });

  test('EP04-US03-TC02 -  empty input validation', async ({ authedEngineerPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP04-US03-TC02' },
        { type: 'doc', description: 'docs/TESTING/EP04/Test_Cases_EP04.md' },
        { type: 'us', description: 'EP04-US03' },
      );

    const askPage = new AskPage(authedEngineerPage);

    await askPage.open(BASE_URL);

    await askPage.submit();

    const askError = await askPage.askErrorText();

    expect(askError).toMatch('Question is required');
  });

  test('EP04-US03-TC03 - backend 400 surfaced cleanly', async ({ authedEngineerPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP04-US03-TC03' },
        { type: 'doc', description: 'docs/TESTING/EP04/Test_Cases_EP04.md' },
        { type: 'us', description: 'EP04-US03' },
      );

    const askPage = new AskPage(authedEngineerPage);

    await authedEngineerPage.route('**/api/ask', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid question',
        }),
      });
    });

    await askPage.open(BASE_URL);

    await askPage.enterQuestion('trigger backend error');

    await askPage.submit();

    const askError = await askPage.askErrorText();

    expect(askError).toMatch('Invalid question');
  });

  test('EP04-US03-TC04 — backend 500 shows generic error', async ({ authedEngineerPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP04-US03-TC04' },
        { type: 'doc', description: 'docs/TESTING/EP04/Test_Cases_EP04.md' },
        { type: 'us', description: 'EP04-US03' },
      );

    const askPage = new AskPage(authedEngineerPage);

    await authedEngineerPage.route('**/api/ask', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });

    await askPage.open(BASE_URL);

    await askPage.enterQuestion('trigger 500');

    await askPage.submit();

    const askError = await askPage.askErrorText();
    expect(askError).toMatch('Internal server error');
  });

  test('EP04-US03-TC05 — loading indicator behavior', async ({ authedEngineerPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP04-US03-TC05' },
        { type: 'doc', description: 'docs/TESTING/EP04/Test_Cases_EP04.md' },
        { type: 'us', description: 'EP04-US03' },
      );

    const askPage = new AskPage(authedEngineerPage);

    await askPage.open(BASE_URL);

    await authedEngineerPage.route('**/api/ask', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({
        status: 200,
      });
    });

    await askPage.enterQuestion('trigger Loading');

    await askPage.submit();

    const submitButtonDisabled = await askPage.submitButtonText();

    await expect(askPage.askSubmit).toBeDisabled();
    expect(submitButtonDisabled).toContain('Loading');

    await expect(askPage.askSubmit).toBeEnabled();
    const submitButtonEnabled = await askPage.submitButtonText();
    expect(submitButtonEnabled).toMatch('Ask');
  });

  test('EP04-US03-TC06 — unauthenticated user sees landing', async ({ page }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP04-US03-TC06' },
        { type: 'doc', description: 'docs/TESTING/EP04/Test_Cases_EP04.md' },
        { type: 'us', description: 'EP04-US03' },
      );

    const askPage = new AskPage(page);
    const landingPage = new HomePage(page);

    await askPage.open(BASE_URL + '/');

    await expect(landingPage.title).toBeVisible();
    await expect(landingPage.registerLink).toBeVisible();
    await expect(landingPage.loginLink).toBeVisible();

    await expect(askPage.title).toHaveCount(0);
    await expect(askPage.askInput).toHaveCount(0);
    await expect(askPage.askSubmit).toHaveCount(0);
  });

  test('EP04-US03-TC07 — basic a11y on Ask page', async ({ authedEngineerPage }) => {
    test
      .info()
      .annotations.push(
        { type: 'testcase', description: 'EP04-US03-TC07' },
        { type: 'doc', description: 'docs/TESTING/EP04/Test_Cases_EP04.md' },
        { type: 'us', description: 'EP04-US03' },
      );

    const askPage = new AskPage(authedEngineerPage);

    let hit = 0;
    await authedEngineerPage.route('**/api/ask', async (route) => {
      hit++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Hello from mocked backend',
          context: [],
          latency_ms: 10,
        }),
      });
    });

    await askPage.open(BASE_URL);

    await authedEngineerPage.keyboard.press('Tab');
    await expect(askPage.askInput).toBeFocused();

    await askPage.enterQuestion('what is our DoD');

    await askPage.askInput.press('Enter');

    await expect.poll(() => hit).toBeGreaterThan(0);

    const askAnswer = await askPage.askAnswerText();

    expect(askAnswer).toMatch('Hello from mocked backend');
  });
});
