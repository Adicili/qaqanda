import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  executeQuery,
  buildSqlWithParams,
  DatabricksClientError,
  DatabricksTimeoutError,
} from '@/lib/databricksClient';

vi.mock('@/lib/env', () => ({
  ENV: {
    DATABRICKS_HOST: 'https://dummy-databricks.example.com',
    DATABRICKS_TOKEN: 'test-token',
  },
}));

const globalAny: any = global;

describe('EP03-US01 — DatabricksClient — buildSqlWithParams', () => {
  it('EP03-US01-TC02 — replaces named params with escaped SQL values', () => {
    const sql = 'SELECT * FROM users WHERE email = :email AND active = :active';
    const result = buildSqlWithParams(sql, {
      email: "o'connor@example.com",
      active: true,
    });

    expect(result).toBe(
      "SELECT * FROM users WHERE email = 'o''connor@example.com' AND active = TRUE",
    );
  });

  it('EP03-US01-TC03 — throws if a param in SQL has no value provided', () => {
    const sql = 'SELECT * FROM users WHERE id = :id';

    expect(() => buildSqlWithParams(sql, {})).toThrow(DatabricksClientError);
  });

  it('EP03-US01-TC04 — throws if there are unused params', () => {
    const sql = 'SELECT * FROM users WHERE id = :id';

    expect(() =>
      buildSqlWithParams(sql, {
        id: 1,
        email: 'unused@example.com',
      }),
    ).toThrow(/Unused SQL parameters/);
  });
});

describe('EP03-US01 — DatabricksClient — executeQuery', () => {
  beforeEach(() => {
    globalAny.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('EP03-US01-TC01 — sends authenticated POST request and maps rows for SELECT', async () => {
    const mockResponse = {
      status: { state: 'FINISHED' },
      result: {
        schema: {
          columns: [
            { name: 'id', type_text: 'STRING' },
            { name: 'email', type_text: 'STRING' },
          ],
        },
        data_array: [
          ['1', 'user1@example.com'],
          ['2', 'user2@example.com'],
        ],
      },
    };

    globalAny.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const rows = await executeQuery<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE active = :active',
      { active: true },
      { timeoutMs: 5_000, maxRetries: 0 },
    );

    expect(globalAny.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = globalAny.fetch.mock.calls[0];

    expect(url).toBe('https://dummy-databricks.example.com/api/2.0/sql/statements');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-token');

    const body = JSON.parse(options.body);
    expect(body.statement).toContain('FROM users');
    expect(rows).toEqual([
      { id: '1', email: 'user1@example.com' },
      { id: '2', email: 'user2@example.com' },
    ]);
  });

  it('EP03-US01-TC05 — retries on 5xx and eventually succeeds', async () => {
    const mock500 = {
      ok: false,
      status: 500,
      text: async () => 'Internal error',
    };

    const mockOk = {
      ok: true,
      status: 200,
      json: async () => ({
        status: { state: 'FINISHED' },
        result: {
          schema: { columns: [{ name: 'count', type_text: 'INT' }] },
          data_array: [[42]],
        },
      }),
    };

    globalAny.fetch.mockResolvedValueOnce(mock500).mockResolvedValueOnce(mockOk);

    const rows = await executeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM users',
      {},
      { maxRetries: 2 },
    );

    expect(globalAny.fetch).toHaveBeenCalledTimes(2);
    expect(rows).toEqual([{ count: 42 }]);
  });

  it('EP03-US01-TC06 — throws DatabricksTimeoutError on timeout and respects retries', async () => {
    const abortError = new Error('Aborted');
    (abortError as any).name = 'AbortError';

    globalAny.fetch.mockRejectedValue(abortError);

    await expect(
      executeQuery('SELECT 1', {}, { maxRetries: 1, timeoutMs: 10 }),
    ).rejects.toBeInstanceOf(DatabricksTimeoutError);

    expect(globalAny.fetch).toHaveBeenCalledTimes(2);
  });

  it('EP03-US01-TC07 — throws DatabricksClientError on non-5xx failure', async () => {
    globalAny.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad request',
    });

    await expect(executeQuery('SELECT 1')).rejects.toBeInstanceOf(DatabricksClientError);
  });

  it('EP03-US01-TC08 — returns empty array for statements without result set (e.g. INSERT)', async () => {
    globalAny.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: { state: 'FINISHED' },
        result: {
          schema: { columns: [] },
          data_array: [],
        },
      }),
    });

    const rows = await executeQuery('INSERT INTO users VALUES (1)');
    expect(rows).toEqual([]);
  });

  it('EP03-US01-TC09 — fails fast when ENV is missing Databricks config', async () => {
    // Override ENV mock to simulate missing config
    vi.doMock('@/lib/env', () => ({
      ENV: {
        DATABRICKS_HOST: undefined,
        DATABRICKS_TOKEN: undefined,
      },
    }));

    // Re-import module so it picks up the new mock
    const { executeQuery } = await import('@/lib/databricksClient');

    await expect(executeQuery('SELECT 1')).rejects.toBeInstanceOf(DatabricksClientError);

    // fetch must NEVER be called
    expect(globalAny.fetch).not.toHaveBeenCalled();
  });
});
