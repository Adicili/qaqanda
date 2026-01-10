import { test, expect } from '@playwright/test';

import { loginAndGetSessionCookie } from '../support/auth-api';

test.describe('EP04-US02 — /api/ask', () => {
  test('EP04-US02-TC01 — Authenticated request returns answer + context + latency', async ({
    request,
  }) => {
    const sessionCookie = await loginAndGetSessionCookie(request, 'ENGINEER');

    const res = await request.post('/api/ask', {
      headers: { Cookie: sessionCookie },
      data: { question: 'How do I reset my password?' },
    });

    expect(res.status()).toBe(200);

    const json = await res.json();

    expect(typeof json.answer).toBe('string');
    expect(json.answer.length).toBeGreaterThan(0);

    expect(Array.isArray(json.context)).toBe(true);
    expect(typeof json.latency_ms).toBe('number');
    expect(json.latency_ms).toBeGreaterThanOrEqual(0);

    // Context može biti prazan u mock/in-memory modu — ali ako nije prazan, mora imati shape.
    if (json.context.length > 0) {
      const c0 = json.context[0];
      expect(typeof c0.id).toBe('string');
      expect(typeof c0.title).toBe('string');
      expect(typeof c0.text).toBe('string');
      expect(typeof c0.score).toBe('number');
    }
  });

  test('EP04-US02-TC02 — Empty or whitespace-only question returns 400', async ({ request }) => {
    const sessionCookie = await loginAndGetSessionCookie(request, 'ENGINEER');

    // empty
    const res1 = await request.post('/api/ask', {
      headers: { Cookie: sessionCookie },
      data: { question: '' },
    });
    expect(res1.status()).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toBeTruthy();

    // whitespace only
    const res2 = await request.post('/api/ask', {
      headers: { Cookie: sessionCookie },
      data: { question: '   ' },
    });
    expect(res2.status()).toBe(400);
    const json2 = await res2.json();
    expect(json2.error).toBeTruthy();
  });

  test('EP04-US02-TC03 — Invalid request body schema returns 400', async ({ request }) => {
    const sessionCookie = await loginAndGetSessionCookie(request, 'ENGINEER');

    // missing question
    const res1 = await request.post('/api/ask', {
      headers: { Cookie: sessionCookie },
      data: {},
    });
    expect(res1.status()).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toBeTruthy();

    // wrong type
    const res2 = await request.post('/api/ask', {
      headers: { Cookie: sessionCookie },
      data: { question: 123 },
    });
    expect(res2.status()).toBe(400);
    const json2 = await res2.json();
    expect(json2.error).toBeTruthy();
  });

  test('EP04-US02-TC04 — Unauthenticated request returns 401', async ({ request }) => {
    const res = await request.post('/api/ask', { data: { question: 'Anything' } });
    expect(res.status()).toBe(401);

    const json = await res.json();
    expect(json.error).toBeTruthy();
  });
});
