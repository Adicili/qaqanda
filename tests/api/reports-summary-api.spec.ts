/* tests/api/reports-summary.spec.ts */

import { test, expect } from '@playwright/test';

import { loginAndGetSessionCookie } from '../support/auth-api';
import { resetLocalDb, updateLocalDb } from '../../src/lib/localdb';

type LocalQueryRow = {
  id: string;
  userId: string;
  question: string;
  latencyMs: number;
  createdAt: string; // ISO
};

type LocalKbRow = {
  id: string;
  title: string;
  text: string;
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string | null; // ISO | null
};

function annotate(tc: string, us: string) {
  test
    .info()
    .annotations.push(
      { type: 'testcase', description: tc },
      { type: 'doc', description: 'docs/TESTING/EP06/Test_Cases_EP06.md' },
      { type: 'us', description: us },
    );
}

async function seedLocalDb(arg: { queries?: LocalQueryRow[]; kb?: LocalKbRow[] }) {
  await updateLocalDb<void>((db) => {
    if (arg.queries) {
      const q = db.queries as unknown as LocalQueryRow[];
      q.length = 0;
      q.push(...arg.queries);
    }
    if (arg.kb) {
      const k = db.kb as unknown as LocalKbRow[];
      k.length = 0;
      k.push(...arg.kb);
    }
  });
}

test.describe('EP06-US01 — Reports Summary API', () => {
  test.beforeEach(async () => {
    await resetLocalDb();
  });

  test('EP06-US01-TC01 — authorized user gets summary data', async ({ request }) => {
    annotate('EP06-US01-TC01', 'EP06-US01');

    const sessionCookie = await loginAndGetSessionCookie(request, 'ENGINEER');

    await seedLocalDb({
      queries: [
        {
          id: 'local_q1',
          userId: 'u1',
          question: 'What is QA?',
          latencyMs: 120,
          createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        },
        {
          id: 'local_q2',
          userId: 'u1',
          question: 'What is QA?',
          latencyMs: 80,
          createdAt: new Date('2025-01-01T00:00:01.000Z').toISOString(),
        },
        {
          id: 'local_q3',
          userId: 'u2',
          question: 'What is Playwright?',
          latencyMs: 200,
          createdAt: new Date('2025-01-01T00:00:02.000Z').toISOString(),
        },
      ],
      kb: [
        {
          id: 'kb_1',
          title: 'QA Basics',
          text: '...',
          tags: [],
          createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
          updatedAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        },
        {
          id: 'kb_2',
          title: 'Playwright Guide',
          text: '...',
          tags: [],
          createdAt: new Date('2025-01-02T00:00:00.000Z').toISOString(),
          updatedAt: new Date('2025-01-02T00:00:00.000Z').toISOString(),
        },
      ],
    });

    const res = await request.get('/api/reports/summary', {
      headers: { Cookie: sessionCookie },
    });

    expect(res.status()).toBe(200);

    const json = await res.json();

    // Contract
    expect(json).toHaveProperty('total_queries');
    expect(json).toHaveProperty('avg_latency_ms');
    expect(json).toHaveProperty('top_questions');
    expect(json).toHaveProperty('top_docs');

    expect(typeof json.total_queries).toBe('number');
    expect(typeof json.avg_latency_ms).toBe('number');
    expect(Array.isArray(json.top_questions)).toBe(true);
    expect(Array.isArray(json.top_docs)).toBe(true);

    // Values from seed
    expect(json.total_queries).toBe(3);
    expect(json.top_questions).toEqual(['What is QA?', 'What is Playwright?']);
  });

  test('EP06-US01-TC02 — unauthorized access blocked', async ({ request }) => {
    annotate('EP06-US01-TC02', 'EP06-US01');

    const res = await request.get('/api/reports/summary');
    expect([401, 403]).toContain(res.status());
  });

  test('EP06-US01-TC03 — empty dataset handled correctly', async ({ request }) => {
    annotate('EP06-US01-TC03', 'EP06-US01');

    const sessionCookie = await loginAndGetSessionCookie(request, 'LEAD');

    const res = await request.get('/api/reports/summary', {
      headers: { Cookie: sessionCookie },
    });

    expect(res.status()).toBe(200);

    const json = await res.json();

    expect(json.total_queries).toBe(0);
    expect(json.avg_latency_ms).toBe(0);
    expect(json.top_questions).toEqual([]);
    expect(json.top_docs).toEqual([]);
  });
});
