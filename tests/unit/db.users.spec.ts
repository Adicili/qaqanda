import { describe, it, expect, vi, beforeEach } from 'vitest';

// Force Databricks branch (hasDatabricksEnv = true)
vi.mock('@/lib/env', () => ({
  ENV: {
    DATABRICKS_HOST: 'https://dummy-host',
    DATABRICKS_TOKEN: 'dummy-token',
    DATABRICKS_WAREHOUSE_ID: 'wh-123',
  },
}));

const executeQueryMock = vi.fn();

// Mock Databricks client
vi.mock('@/lib/databricksClient', () => ({
  executeQuery: (...args: unknown[]) => executeQueryMock(...args),
}));

import { getUserByEmail, create, listAll, UserRole } from '@/lib/db.users';

describe('EP03-US03 — Database Access Layer Module', () => {
  beforeEach(() => {
    executeQueryMock.mockReset();
  });

  it('EP03-US03-TC01 — getByEmail returns typed user or null', async () => {
    // case A: user exists
    executeQueryMock.mockResolvedValueOnce([
      {
        id: 'u-1',
        email: 'user@example.com',
        password_hash: 'hash',
        role: 'ENGINEER',
        created_at: '2025-01-01T00:00:00Z',
      },
    ]);

    const user = await getUserByEmail('user@example.com');

    expect(executeQueryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = executeQueryMock.mock.calls[0];

    // Ne forsiramo schema prefix, ali proveravamo da gađa users tabelu i email param
    expect(String(sql)).toContain('FROM');
    expect(String(sql)).toContain('users');
    expect(String(sql)).toContain('WHERE email = :email');
    expect(params).toEqual({ email: 'user@example.com' });

    expect(user).not.toBeNull();
    expect(user?.id).toBe('u-1');
    expect(user?.email).toBe('user@example.com');
    expect(user?.role).toBe('ENGINEER');
    expect(user?.createdAt).toBeInstanceOf(Date);

    // case B: no result → null
    executeQueryMock.mockResolvedValueOnce([]);
    const missing = await getUserByEmail('missing@example.com');
    expect(missing).toBeNull();
  });

  it('EP03-US03-TC02 — create inserts user via parameterized SQL and returns new user with id', async () => {
    // create radi: INSERT → SELECT preko getUserByEmailDatabricks
    // first call: INSERT (result ignored)
    // second call: SELECT (returns row used for DbUser)
    executeQueryMock
      .mockResolvedValueOnce([]) // INSERT
      .mockResolvedValueOnce([
        {
          id: 'u-123',
          email: 'new@example.com',
          password_hash: 'hash',
          role: 'ENGINEER',
          created_at: '2025-01-02T00:00:00Z',
        },
      ]);

    const result = await create({
      email: 'new@example.com',
      passwordHash: 'hash',
      role: 'ENGINEER' as UserRole,
    });

    // prvi poziv = INSERT INTO users ...
    expect(executeQueryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO'),
      expect.objectContaining({
        email: 'new@example.com',
        passwordHash: 'hash',
        role: 'ENGINEER',
      }),
    );

    const [insertSql, insertParams] = executeQueryMock.mock.calls[0];
    expect(String(insertSql)).toContain('INSERT INTO');
    expect(String(insertSql)).toContain('users');
    expect(String(insertSql)).toContain(':email');
    expect(String(insertSql)).toContain(':passwordHash');
    expect(String(insertSql)).toContain(':role');
    expect(insertParams.email).toBe('new@example.com');

    // drugi poziv = SELECT za čitanje nazad
    const [selectSql, selectParams] = executeQueryMock.mock.calls[1];
    expect(String(selectSql)).toContain('SELECT');
    expect(String(selectSql)).toContain('FROM');
    expect(String(selectSql)).toContain('users');
    expect(selectParams).toEqual({ email: 'new@example.com' });

    // rezultat je DbUser sa id i ostalim poljima
    expect(result.id).toBe('u-123');
    expect(result.email).toBe('new@example.com');
    expect(result.role).toBe('ENGINEER');
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('EP03-US03-TC03 — listAll returns array of typed users', async () => {
    const now = '2025-01-01T00:00:00Z';

    executeQueryMock.mockResolvedValueOnce([
      {
        id: 'u-1',
        email: 'a@example.com',
        password_hash: 'hash1',
        role: 'ENGINEER',
        created_at: now,
      },
      {
        id: 'u-2',
        email: 'b@example.com',
        password_hash: 'hash2',
        role: 'LEAD',
        created_at: now,
      },
    ]);

    const users = await listAll();

    expect(executeQueryMock).toHaveBeenCalledTimes(1);
    const [sql] = executeQueryMock.mock.calls[0];

    expect(String(sql)).toContain('SELECT');
    expect(String(sql)).toContain('FROM');
    expect(String(sql)).toContain('users');

    expect(Array.isArray(users)).toBe(true);
    expect(users).toHaveLength(2);
    expect(users[0].email).toBe('a@example.com');
    expect(users[0].createdAt).toBeInstanceOf(Date);
    expect(users[1].role === 'ENGINEER' || users[1].role === 'LEAD').toBe(true);
  });
});
