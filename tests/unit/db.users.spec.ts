import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const executeQueryMock = vi.fn();
type DbUsersMod = typeof import('@/lib/db.users');

describe('EP03-US03 — Database Access Layer Module', () => {
  let mod: DbUsersMod;
  const prevEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    executeQueryMock.mockReset();

    // env required by your env parser (if it runs during imports)
    process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'x'.repeat(32);

    // ✅ force db.users to choose Databricks branch at import-time
    vi.doMock('@/lib/dbMode', () => ({
      isDatabricksEnabled: () => true,
      // if other modules import it, harmless to provide:
      isDatabricksMockEnabled: () => true,
    }));

    // ✅ mock the thing repos call
    vi.doMock('@/lib/databricksClient', () => ({
      executeQuery: (...args: unknown[]) => executeQueryMock(...args),
    }));

    mod = await import('@/lib/db.users');
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = { ...prevEnv };
  });

  it('EP03-US03-TC01 — getByEmail returns typed user or null', async () => {
    executeQueryMock.mockResolvedValueOnce([
      {
        id: 'u-1',
        email: 'user@example.com',
        password_hash: 'hash',
        role: 'ENGINEER',
        created_at: '2025-01-01T00:00:00Z',
      },
    ]);

    const user = await mod.getUserByEmail('user@example.com');

    expect(executeQueryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = executeQueryMock.mock.calls[0];

    expect(String(sql)).toContain('FROM');
    expect(String(sql)).toContain('users');
    expect(String(sql)).toContain('WHERE email = :email');
    expect(params).toEqual({ email: 'user@example.com' });

    expect(user?.id).toBe('u-1');
    expect(user?.email).toBe('user@example.com');
    expect(user?.role).toBe('ENGINEER');
    expect(user?.createdAt).toBeInstanceOf(Date);

    executeQueryMock.mockResolvedValueOnce([]);
    const missing = await mod.getUserByEmail('missing@example.com');
    expect(missing).toBeNull();
  });

  it('EP03-US03-TC02 — create inserts user and reads back', async () => {
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
      ]); // SELECT

    const result = await mod.create({
      email: 'new@example.com',
      passwordHash: 'hash',
      role: 'ENGINEER', // ✅ no mod.UserRole nonsense
    });

    expect(executeQueryMock).toHaveBeenCalledTimes(2);

    const [insertSql, insertParams] = executeQueryMock.mock.calls[0];
    expect(String(insertSql)).toContain('INSERT INTO');
    expect(String(insertSql)).toContain('users');
    expect(insertParams).toEqual(
      expect.objectContaining({
        email: 'new@example.com',
        passwordHash: 'hash',
        role: 'ENGINEER',
      }),
    );

    const [selectSql, selectParams] = executeQueryMock.mock.calls[1];
    expect(String(selectSql)).toContain('SELECT');
    expect(String(selectSql)).toContain('FROM');
    expect(String(selectSql)).toContain('users');
    expect(selectParams).toEqual({ email: 'new@example.com' });

    expect(result.id).toBe('u-123');
    expect(result.email).toBe('new@example.com');
    expect(result.role).toBe('ENGINEER');
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('EP03-US03-TC03 — listAll returns typed users', async () => {
    executeQueryMock.mockResolvedValueOnce([
      {
        id: 'u-1',
        email: 'a@example.com',
        password_hash: 'hash1',
        role: 'ENGINEER',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'u-2',
        email: 'b@example.com',
        password_hash: 'hash2',
        role: 'LEAD',
        created_at: '2025-01-01T00:00:00Z',
      },
    ]);

    const users = await mod.listAll();

    expect(executeQueryMock).toHaveBeenCalledTimes(1);
    const [sql] = executeQueryMock.mock.calls[0];
    expect(String(sql)).toContain('SELECT');
    expect(String(sql)).toContain('FROM');
    expect(String(sql)).toContain('users');

    expect(users).toHaveLength(2);
    expect(users[0].createdAt).toBeInstanceOf(Date);
    expect(users[1].role).toBe('LEAD');
  });
});
