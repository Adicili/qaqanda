import { test, expect } from '@playwright/test';

import { ensureEngineerUser, loginAndGetSessionCookie } from '../../tests/support/users';

test.describe('EP04-US02 — /api/ask', () => {
  test('EP04-US02-TC01 — Valid query returns 200 + answer + context + latency', async ({
    request,
  }) => {
    const creds = await ensureEngineerUser(request);
    const sessionCookie = await loginAndGetSessionCookie(request, creds);

    const res = await request.post('/api/ask', {
      headers: { Cookie: sessionCookie },
      data: { question: 'How do I reset my password?' },
    });

    expect(res.status()).toBe(200);

    const json = await res.json();

    expect(typeof json.answer).toBe('string');
    expect(Array.isArray(json.context)).toBe(true);

    expect(typeof json.latency_ms).toBe('number');
    expect(json.latency_ms).toBeGreaterThanOrEqual(0);

    if (json.context.length > 0) {
      const c0 = json.context[0];
      expect(typeof c0.id).toBe('string');
      expect(typeof c0.title).toBe('string');
      expect(typeof c0.text).toBe('string');

      expect(typeof c0.score).toBe('number');
      expect(c0.score).toBeGreaterThanOrEqual(0);
      expect(c0.score).toBeLessThanOrEqual(1);
    }
  });

  test('EP04-US02-TC02 — Empty question returns 400 (validation)', async ({ request }) => {
    const creds = await ensureEngineerUser(request);
    const sessionCookie = await loginAndGetSessionCookie(request, creds);

    const res = await request.post('/api/ask', {
      headers: { Cookie: sessionCookie },
      data: { question: '' },
    });

    expect(res.status()).toBe(400);

    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  test('EP04-US02-TC03 — Unauthorized request returns 401', async ({ request }) => {
    const res = await request.post('/api/ask', {
      data: { question: 'Anything' },
    });

    expect(res.status()).toBe(401);

    const json = await res.json();
    expect(json.error).toBeTruthy();
  });
});
