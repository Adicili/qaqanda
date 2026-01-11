import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const globalAny: any = global;

describe('EP03-US01 — DatabricksClient — buildSqlWithParams', () => {
  beforeEach(async () => {
    globalAny.fetch = vi.fn();

    // ✅ UGASI mock branch
    process.env.USE_DATABRICKS_MOCK = '0';

    vi.resetModules();

    // ✅ forsiraj da isDatabricksMockEnabled bude false i isDatabricksEnabled true
    vi.doMock('@/lib/dbMode', () => ({
      isDatabricksEnabled: () => true,
      isDatabricksMockEnabled: () => false,
    }));

    // ✅ env mock da prođe config
    vi.doMock('@/lib/env', () => ({
      ENV: {
        DATABRICKS_HOST: 'https://dummy-databricks.example.com',
        DATABRICKS_TOKEN: 'test-token',
        DATABRICKS_WAREHOUSE_ID: 'test-warehouse-id',
      },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('EP03-US01-TC02 — replaces named params with escaped SQL values', async () => {
    vi.resetModules();
    const mod = await import('@/lib/databricksClient');

    const sql = 'SELECT * FROM users WHERE email = :email AND active = :active';
    const result = mod.buildSqlWithParams(sql, {
      email: "o'connor@example.com",
      active: true,
    });

    expect(result).toBe(
      "SELECT * FROM users WHERE email = 'o''connor@example.com' AND active = TRUE",
    );
  });

  it('EP03-US01-TC03 — throws if a param in SQL has no value provided', async () => {
    vi.resetModules();
    const mod = await import('@/lib/databricksClient');

    const sql = 'SELECT * FROM users WHERE id = :id';
    expect(() => mod.buildSqlWithParams(sql, {} as any)).toThrow(mod.DatabricksClientError);
  });

  it('EP03-US01-TC04 — throws if there are unused params', async () => {
    vi.resetModules();
    const mod = await import('@/lib/databricksClient');

    const sql = 'SELECT * FROM users WHERE id = :id';
    expect(() =>
      mod.buildSqlWithParams(sql, {
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
    vi.resetModules();
    const { executeQuery } = await import('@/lib/databricksClient');

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
    vi.resetModules();
    const { executeQuery } = await import('@/lib/databricksClient');

    const mock500 = { ok: false, status: 500, text: async () => 'Internal error' };
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
    vi.resetModules();
    const { executeQuery, DatabricksTimeoutError } = await import('@/lib/databricksClient');

    const abortError = new Error('Aborted');
    (abortError as any).name = 'AbortError';

    globalAny.fetch.mockRejectedValue(abortError);

    await expect(
      executeQuery('SELECT 1', {}, { maxRetries: 1, timeoutMs: 10 }),
    ).rejects.toBeInstanceOf(DatabricksTimeoutError);

    expect(globalAny.fetch).toHaveBeenCalledTimes(2);
  });

  it('EP03-US01-TC07 — throws DatabricksClientError on non-5xx failure', async () => {
    vi.resetModules();
    const { executeQuery, DatabricksClientError } = await import('@/lib/databricksClient');

    globalAny.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad request',
    });

    await expect(executeQuery('SELECT 1')).rejects.toBeInstanceOf(DatabricksClientError);
  });

  it('EP03-US01-TC08 — returns empty array for statements without result set (e.g. INSERT)', async () => {
    vi.resetModules();
    const { executeQuery } = await import('@/lib/databricksClient');

    globalAny.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: { state: 'FINISHED' },
        result: { schema: { columns: [] }, data_array: [] },
      }),
    });

    const rows = await executeQuery('INSERT INTO users VALUES (1)');
    expect(rows).toEqual([]);
  });

  it('EP03-US01-TC09 — fails fast when ENV is missing Databricks config', async () => {
    vi.resetModules();

    // Force real Databricks branch (not mock)
    vi.doMock('@/lib/dbMode', () => ({
      isDatabricksEnabled: () => true,
      isDatabricksMockEnabled: () => false,
    }));

    // Missing config on purpose (but keep SESSION_SECRET valid)
    vi.doMock('@/lib/env', () => ({
      ENV: {
        NODE_ENV: 'test',
        SESSION_SECRET: 'x'.repeat(32),

        // ✅ intentionally missing
        DATABRICKS_HOST: undefined,
        DATABRICKS_TOKEN: undefined,
        DATABRICKS_WAREHOUSE_ID: undefined,

        // whatever else might be referenced elsewhere
        DB_MODE: 'databricks',
        USE_DATABRICKS_MOCK: false,
        LLM_MODE: 'mock',
        MOCK_LLM_BAD: false,
        BASE_URL: 'http://localhost:3000',
      },
    }));

    const { executeQuery, DatabricksClientError } = await import('@/lib/databricksClient');

    await expect(executeQuery('SELECT 1')).rejects.toBeInstanceOf(DatabricksClientError);

    // ensure no HTTP call was made
    expect(globalAny.fetch).not.toHaveBeenCalled();
  });
});
