// tests/unit/db.logging.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 1) Mock env PRE nego što povučemo bilo koji modul koji koristi ENV
vi.mock('@/lib/env', () => ({
  ENV: {
    SESSION_SECRET: 'test-secret',
    DATABRICKS_HOST: 'https://dummy-databricks.example.com',
    DATABRICKS_TOKEN: 'test-token',
    DATABRICKS_WAREHOUSE_ID: 'wh-123',
  },
}));

// 2) Mock databricksClient tako da NIKAD ne ide na pravi HTTP
const executeQueryMock = vi.fn();

vi.mock('@/lib/databricksClient', () => ({
  executeQuery: (...args: unknown[]) => executeQueryMock(...args),
}));

// 3) Tek sad uvozimo repo module – oni vide mocked ENV + mocked executeQuery
import { create as createUser } from '@/lib/db.users';
import { addDoc as addKBDoc } from '@/lib/db.kb';
import { insertQuery } from '@/lib/db.queries';

describe('EP03-US03-TC10 — Repositories do not log sensitive data or raw SQL', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    executeQueryMock.mockReset();

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
      createUser({
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
      addKBDoc('Internal policy', 'Super secret text', ['private', 'internal']),
    ).rejects.toBeInstanceOf(Error);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('does not log sensitive data when Queries.insertQuery fails', async () => {
    executeQueryMock.mockRejectedValueOnce(new Error('Simulated DB failure'));

    await expect(insertQuery('user-123', 'How to reset password?', 150)).rejects.toBeInstanceOf(
      Error,
    );

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
