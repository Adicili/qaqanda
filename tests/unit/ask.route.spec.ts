import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/env', () => ({
  ENV: {
    SESSION_SECRET: process.env.SESSION_SECRET ?? 'unit-test-session-secret',
    // ostalo stavi minimalno da ne smeta importima
    BASE_URL: process.env.BASE_URL ?? 'http://localhost:3000',
    USE_DATABRICKS_MOCK: true,
    DATABRICKS_HOST: undefined,
    DATABRICKS_TOKEN: undefined,
    DATABRICKS_WAREHOUSE_ID: undefined,
  },
}));

vi.mock('@/lib/session', async (orig) => {
  const actual: any = await (orig as any)();
  return {
    ...actual,
    verifySessionToken: () => ({ userId: 'user-123', role: 'ENGINEER' }),
    SESSION_COOKIE_NAME: 'qaqanda_session',
  };
});

const listAllMock = vi.fn();
vi.mock('@/lib/db.kb', () => ({
  listAll: (...args: any[]) => listAllMock(...args),
}));

const insertQueryMock = vi.fn();
vi.mock('@/lib/db.queries', () => ({
  insertQuery: (...args: any[]) => insertQueryMock(...args),
}));

import { POST } from '@/app/api/ask/route';

function makeReq(body: unknown, cookieValue?: string) {
  return {
    json: async () => body,
    cookies: {
      get: (name: string) => {
        // route traži SESSION_COOKIE_NAME (qaqanda_session)
        if (!cookieValue) return undefined;
        return { name, value: cookieValue };
      },
    },
  } as any;
}

describe('EP04-US02 — /api/ask (route-level)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('EP04-US02-TC05 — No KB documents returns empty context but 200', async () => {
    listAllMock.mockResolvedValueOnce([]); // KB empty

    const res = await POST(makeReq({ question: 'Any question' }, 'qaqanda_session=fake'));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(typeof json.answer).toBe('string');
    expect(Array.isArray(json.context)).toBe(true);
    expect(json.context.length).toBe(0);
    expect(typeof json.latency_ms).toBe('number');
    expect(json.latency_ms).toBeGreaterThanOrEqual(0);

    // logging should still happen even when KB is empty (depending on your implementation)
    // if your route logs only on success, this should be >= 1
    expect(insertQueryMock).toHaveBeenCalledTimes(1);
  });

  it('EP04-US02-TC06 — Internal error returns 500 with generic message', async () => {
    listAllMock.mockRejectedValueOnce(new Error('db exploded'));

    const res = await POST(makeReq({ question: 'Any question' }, 'qaqanda_session=fake'));
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBeTruthy();

    // no internal details
    expect(JSON.stringify(json).toLowerCase()).not.toContain('db exploded');
    expect(JSON.stringify(json).toLowerCase()).not.toContain('stack');

    // if error happens before logging, this might be 0 — accept that unless you explicitly want otherwise
  });

  it('EP04-US02-TC07 — Query is logged with user, question, and latency', async () => {
    listAllMock.mockResolvedValueOnce([
      {
        id: 'kb-1',
        title: 'Reset Password',
        text: 'Use the reset password link',
        tags: ['auth'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const question = 'How do I reset my password?';
    const res = await POST(makeReq({ question }, 'qaqanda_session=fake'));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(typeof json.latency_ms).toBe('number');

    // insertQuery(userId, question, latencyMs)
    expect(insertQueryMock).toHaveBeenCalledTimes(1);
    const [userIdArg, questionArg, latencyArg] = insertQueryMock.mock.calls[0];

    expect(userIdArg).toBe('user-123');
    expect(questionArg).toBe(question);
    expect(typeof latencyArg).toBe('number');
    expect(latencyArg).toBeGreaterThanOrEqual(0);
  });
});
