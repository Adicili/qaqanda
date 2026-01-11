import { describe, it, expect, vi, beforeEach } from 'vitest';

const executeQueryMock = vi.fn();

type KbModule = typeof import('@/lib/db.kb');

describe('EP03-US03 — KB repository', () => {
  let kb: KbModule;

  beforeEach(async () => {
    executeQueryMock.mockReset();

    // ✅ bitno: očisti module cache
    vi.resetModules();

    // ✅ env nije ključan ovde, ali da ne pukne env parser (SESSION_SECRET)
    process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'x'.repeat(32);

    // ✅ forsiraj Databricks branch (da repo ide preko executeQuery)
    vi.doMock('@/lib/dbMode', () => ({
      isDatabricksEnabled: () => true,
      isDatabricksMockEnabled: () => false,
    }));

    // ✅ mock executeQuery
    vi.doMock('@/lib/databricksClient', () => ({
      executeQuery: (...args: unknown[]) => executeQueryMock(...args),
    }));

    // (opciono) ako db.kb importuje ENV direktno i traži nešto
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

    // ✅ import tek POSLE mockova
    kb = await import('@/lib/db.kb');
  });

  it('EP03-US03-TC04 — getById returns typed KB doc or null', async () => {
    executeQueryMock.mockResolvedValueOnce([
      {
        id: 'kb-001',
        title: 'Doc title',
        text: 'Doc content',
        tags: '["tag1","tag2"]',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: null,
      },
    ]);

    const doc = await kb.getById('kb-001');

    expect(executeQueryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = executeQueryMock.mock.calls[0];

    expect(String(sql)).toContain('FROM');
    expect(String(sql)).toContain('kb_docs');
    expect(String(sql)).toContain('WHERE id = :id');
    expect(params).toEqual({ id: 'kb-001' });

    expect(doc).not.toBeNull();
    expect(doc?.id).toBe('kb-001');
    expect(doc?.title).toBe('Doc title');
    expect(doc?.text).toBe('Doc content');
    expect(doc?.tags).toEqual(['tag1', 'tag2']);
    expect(doc?.createdAt).toBeInstanceOf(Date);

    // case B: no rows -> null
    executeQueryMock.mockResolvedValueOnce([]);
    const missing = await kb.getById('kb-missing');
    expect(missing).toBeNull();
  });

  it('EP03-US03-TC05 — addDoc uses parameterized INSERT and returns generated id', async () => {
    executeQueryMock.mockResolvedValueOnce([]);

    const id = await kb.addDoc('Title', 'Body', ['tag1', 'tag2']);

    expect(typeof id).toBe('string');
    expect(id.startsWith('kb_')).toBe(true);

    expect(executeQueryMock).toHaveBeenCalledTimes(1);

    const [sql, params] = executeQueryMock.mock.calls[0];

    expect(String(sql)).toContain('INSERT INTO');
    expect(String(sql)).toContain('kb_docs');
    expect(String(sql)).toContain(':id');
    expect(String(sql)).toContain(':title');
    expect(String(sql)).toContain(':text');
    expect(String(sql)).toContain(':tags');

    expect(params.title).toBe('Title');
    expect(params.text).toBe('Body');

    expect(typeof params.tags).toBe('string');
    expect(params.tags).toBe(JSON.stringify(['tag1', 'tag2']));
  });

  it('EP03-US03-TC06 — updateDoc uses parameterized UPDATE', async () => {
    executeQueryMock.mockResolvedValueOnce([]);

    await kb.updateDoc('kb-001', 'New content');

    expect(executeQueryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = executeQueryMock.mock.calls[0];

    expect(String(sql)).toContain('UPDATE');
    expect(String(sql)).toContain('kb_docs');
    expect(String(sql)).toContain('SET');
    expect(String(sql)).toContain(':text');
    expect(String(sql)).toContain('WHERE id = :id');
    expect(params).toEqual({ id: 'kb-001', text: 'New content' });
  });

  it('EP03-US03-TC07 — listAll returns typed KB docs', async () => {
    executeQueryMock.mockResolvedValueOnce([
      {
        id: 'kb-1',
        title: 'T1',
        text: 'Body1',
        tags: '["a"]',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: null,
      },
      {
        id: 'kb-2',
        title: 'T2',
        text: 'Body2',
        tags: '["b","c"]',
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
      },
    ]);

    const docs = await kb.listAll();

    expect(executeQueryMock).toHaveBeenCalledTimes(1);
    const [sql] = executeQueryMock.mock.calls[0];

    expect(String(sql)).toContain('SELECT');
    expect(String(sql)).toContain('FROM');
    expect(String(sql)).toContain('kb_docs');

    expect(docs).toHaveLength(2);
    expect(docs[0].id).toBe('kb-1');
    expect(docs[0].tags).toEqual(['a']);
    expect(docs[0].createdAt).toBeInstanceOf(Date);
    expect(docs[1].tags).toEqual(['b', 'c']);
    expect(docs[1].updatedAt).toBeInstanceOf(Date);
  });
});
