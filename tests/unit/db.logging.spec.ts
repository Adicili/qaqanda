import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const executeQueryMock = vi.fn();

type UsersModule = typeof import('@/lib/db.users');
type KBModule = typeof import('@/lib/db.kb');
type QueriesModule = typeof import('@/lib/db.queries');

describe('EP03-US03-TC10 — Repositories do not log sensitive data or raw SQL', () => {
  let users: UsersModule;
  let kb: KBModule;
  let queries: QueriesModule;

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    executeQueryMock.mockReset();
    vi.resetModules();

    // ENV mora da prođe zod validaciju
    process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'x'.repeat(32);

    // ✅ forsiraj Databricks branch
    vi.doMock('@/lib/dbMode', () => ({
      isDatabricksEnabled: () => true,
      isDatabricksMockEnabled: () => false,
    }));

    // ✅ mock executeQuery da baci grešku
    vi.doMock('@/lib/databricksClient', () => ({
      executeQuery: (...args: unknown[]) => executeQueryMock(...args),
    }));

    vi.doMock('@/lib/env', () => ({
      ENV: {
        NODE_ENV: 'test',
        SESSION_SECRET: 'x'.repeat(32),
        DATABRICKS_HOST: 'https://dummy-databricks.example.com',
        DATABRICKS_TOKEN: 'test-token',
        DATABRICKS_WAREHOUSE_ID: 'wh-123',
        DB_MODE: 'databricks',
        USE_DATABRICKS_MOCK: false,
        LLM_MODE: 'mock',
        MOCK_LLM_BAD: false,
      },
    }));

    // ⬇️ import TEK POSLE mockova
    users = await import('@/lib/db.users');
    kb = await import('@/lib/db.kb');
    queries = await import('@/lib/db.queries');

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('does not log sensitive data when Users.create fails', async () => {
    executeQueryMock.mockRejectedValueOnce(new Error('Simulated DB failure'));

    await expect(
      users.create({
        email: 'sensitive@example.com',
        passwordHash: 'SUPER_SECRET_HASH',
        role: 'ENGINEER',
      }),
    ).rejects.toBeInstanceOf(Error);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('does not log sensitive data when KB.addDoc fails', async () => {
    executeQueryMock.mockRejectedValueOnce(new Error('Simulated DB failure'));

    await expect(
      kb.addDoc('Internal policy', 'Super secret text', ['private', 'internal']),
    ).rejects.toBeInstanceOf(Error);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('does not log sensitive data when Queries.insertQuery fails', async () => {
    executeQueryMock.mockRejectedValueOnce(new Error('Simulated DB failure'));

    await expect(
      queries.insertQuery('user-123', 'How to reset password?', 150),
    ).rejects.toBeInstanceOf(Error);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
