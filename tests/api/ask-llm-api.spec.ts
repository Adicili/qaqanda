// tests/api/ask-llm.spec.ts
import crypto from 'node:crypto';

import { test, expect, type APIRequestContext } from '@playwright/test';

import { loginAndGetSessionCookie, ensureUser } from '../support/auth-api';
import { kbAdd, llmMockHeader } from '../support/kb-api';
import { promoteUserRole } from '../support/admin-api';

function uniqueMarker(prefix: string) {
  return `${prefix}__${crypto.randomUUID()}`;
}

async function getLeadCookie(request: APIRequestContext) {
  const leadUser = await ensureUser(request, 'LEAD');
  await promoteUserRole(request, { email: leadUser.email, role: 'LEAD' });
  return loginAndGetSessionCookie(request, 'LEAD');
}

async function seedKb3(request: APIRequestContext) {
  const leadCookie = await getLeadCookie(request);

  const m1 = uniqueMarker('ASK_DOC1');
  const m2 = uniqueMarker('ASK_DOC2');
  const m3 = uniqueMarker('ASK_DOC3');

  const results = await Promise.all([
    kbAdd(request, leadCookie, { prompt: `Doc about auth ${m1}` }),
    kbAdd(request, leadCookie, { prompt: `Doc about retries ${m2}` }),
    kbAdd(request, leadCookie, { prompt: `Doc about playwright ${m3}` }),
  ]);

  for (const r of results) expect(r.status(), 'kb seed must succeed').toBe(200);

  return { leadCookie, markers: [m1, m2, m3] };
}

test.describe('EP09-US02 — /api/ask LLM integration', () => {
  test('EP09-US02-TC01 — llm answer returned with context', async ({ request }) => {
    const engineerCookie = await loginAndGetSessionCookie(request, 'ENGINEER');
    await seedKb3(request);

    const res = await request.post('/api/ask', {
      headers: {
        Cookie: engineerCookie,
        'x-use-llm': '1',
        ...llmMockHeader('ok'),
      },
      data: { question: 'What is playwright?' },
    });

    expect(res.status()).toBe(200);
    const json = await res.json();

    // ✅ deterministic mock answer
    expect(json.answer).toBe('MOCK_OK_ANSWER');

    expect(Array.isArray(json.context)).toBe(true);
    expect(json.context.length).toBe(3);

    expect(typeof json.latency_ms).toBe('number');
    expect(json.latency_ms).toBeGreaterThanOrEqual(0);

    expect(json.used_llm).toBe(true);
  });

  test('EP09-US02-TC02 — fallback used when llm fails', async ({ request }) => {
    const engineerCookie = await loginAndGetSessionCookie(request, 'ENGINEER');
    await seedKb3(request);

    const res = await request.post('/api/ask', {
      headers: {
        Cookie: engineerCookie,
        'x-use-llm': '1',
        ...llmMockHeader('malformed'), // LLM fail
      },
      data: { question: 'What is auth?' },
    });

    expect(res.status()).toBe(200);
    const json = await res.json();

    expect(typeof json.answer).toBe('string');
    expect(json.answer.length).toBeGreaterThan(0);

    expect(Array.isArray(json.context)).toBe(true);
    expect(json.context.length).toBe(3);

    expect(typeof json.latency_ms).toBe('number');
    expect(json.latency_ms).toBeGreaterThanOrEqual(0);

    expect(json.used_llm).toBe(false);
  });

  test('EP09-US02-TC03 — llm prompt includes top 3 docs', async ({ request }) => {
    const engineerCookie = await loginAndGetSessionCookie(request, 'ENGINEER');
    const { markers } = await seedKb3(request);

    const res = await request.post('/api/ask', {
      headers: {
        Cookie: engineerCookie,
        'x-use-llm': '1',
        ...llmMockHeader('ok'),
        'x-test-spy-llm': '1',
      },
      data: { question: 'Explain retries' },
    });

    expect(res.status()).toBe(200);

    const hdr = res.headers()['x-test-llm-prompt-b64'];
    expect(hdr, 'x-test-llm-prompt-b64 must be present').toBeTruthy();

    const prompt = Buffer.from(String(hdr), 'base64').toString('utf8');

    // ✅ includes question
    expect(prompt).toContain('QUESTION:\nExplain retries');

    // ✅ JSON-only instruction
    expect(prompt).toMatch(/Return ONLY JSON/i);
    expect(prompt).toMatch(/\{\s*"answer":\s*"string"\s*\}/i);

    // ✅ EXACTLY 3 docs in prompt
    const docCount = (prompt.match(/--- DOC \d ---/g) ?? []).length;
    expect(docCount).toBe(3);

    // ✅ at least some seed markers should be in the context
    // (if your KB mock generates text with marker inside, which it does)
    const hits = markers.filter((m) => prompt.includes(m));
    expect(hits.length).toBeGreaterThan(0);
  });

  test('EP09-US02-TC04 — latency recorded', async ({ request }) => {
    const engineerCookie = await loginAndGetSessionCookie(request, 'ENGINEER');
    await seedKb3(request);

    const res = await request.post('/api/ask', {
      headers: {
        Cookie: engineerCookie,
        'x-use-llm': '1',
        ...llmMockHeader('ok'),
      },
      data: { question: 'Any question' },
    });

    expect(res.status()).toBe(200);
    const json = await res.json();

    expect(typeof json.latency_ms).toBe('number');
    expect(json.latency_ms).toBeGreaterThanOrEqual(0);
  });
});
