import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/env', () => ({
  ENV: {
    NODE_ENV: 'test',
    SESSION_SECRET: 'test-secret',
    DATABRICKS_HOST: 'https://dummy-databricks.example.com',
    DATABRICKS_TOKEN: 'test-token',
  },
}));

const executeQueryMock = vi.fn();

vi.mock('@/lib/databricksClient', () => ({
  executeQuery: (...args: unknown[]) => executeQueryMock(...args),
}));

import { insertQuery, getRecentByUser } from '@/lib/db.queries';

describe('EP03-US03 — QueryLog repository', () => {
  beforeEach(() => {
    executeQueryMock.mockReset();
  });

  it('EP03-US03-TC08 — insertQuery uses parameterized INSERT', async () => {
    executeQueryMock.mockResolvedValueOnce([{ id: 'q-001' }]);

    const id = await insertQuery('user-123', 'How to reset password?', 150);

    expect(id).toBe('q-001');
    expect(executeQueryMock).toHaveBeenCalledTimes(1);

    const [sql, params] = executeQueryMock.mock.calls[0];

    expect(String(sql)).toContain('INSERT INTO');
    expect(String(sql)).toContain('queries');
    expect(String(sql)).toContain(':userId');
    expect(String(sql)).toContain(':question');
    expect(String(sql)).toContain(':latencyMs');

    expect(params.userId).toBe('user-123');
    expect(params.question).toBe('How to reset password?');
    expect(params.latencyMs).toBe(150);
  });

  it('EP03-US03-TC09 — getRecentByUser returns recent queries in correct order', async () => {
    executeQueryMock.mockResolvedValueOnce([
      {
        id: 'q-1',
        user_id: 'user-123',
        question: 'Q1',
        latency_ms: '100',
        created_at: '2025-01-02T00:00:00Z',
      },
      {
        id: 'q-2',
        user_id: 'user-123',
        question: 'Q2',
        latency_ms: 200,
        created_at: '2025-01-01T00:00:00Z',
      },
    ]);

    const logs = await getRecentByUser('user-123', 5);

    expect(executeQueryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = executeQueryMock.mock.calls[0];

    expect(String(sql)).toContain('SELECT');
    expect(String(sql)).toContain('FROM');
    expect(String(sql)).toContain('queries');
    expect(String(sql)).toContain('WHERE user_id = :userId');
    expect(String(sql)).toContain('ORDER BY');
    expect(String(sql)).toContain('created_at');
    expect(String(sql)).toContain('DESC');
    expect(String(sql)).toContain('LIMIT :limit');

    expect(params).toEqual({ userId: 'user-123', limit: 5 });

    expect(logs).toHaveLength(2);
    expect(logs[0].id).toBe('q-1');
    expect(logs[0].latencyMs).toBe(100); // string "100" -> number 100
    expect(logs[0].createdAt).toBeInstanceOf(Date);
    expect(logs[1].id).toBe('q-2');
    expect(logs[1].latencyMs).toBe(200);
  });
});
