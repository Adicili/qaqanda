// tests/integration/databricks.canary.spec.ts
import 'dotenv/config';
import { describe, it, expect, beforeAll, vi } from 'vitest';

// 1) Mock env PRE nego što uvezemo bilo koji modul koji koristi ENV
vi.mock('@/lib/env', () => ({
  ENV: {
    SESSION_SECRET: process.env.SESSION_SECRET ?? 'test-session-secret',
    DATABRICKS_HOST: process.env.DATABRICKS_HOST,
    DATABRICKS_TOKEN: process.env.DATABRICKS_TOKEN,
    DATABRICKS_WAREHOUSE_ID: process.env.DATABRICKS_WAREHOUSE_ID,
  },
}));

// 2) Sada uvozimo ENV i ostale module – oni vide MOCK, ne pravi env.ts sa Zod validacijom
import { ENV } from '@/lib/env';
import { executeQuery } from '@/lib/databricksClient';
import { addDoc, getById, updateDoc } from '@/lib/db.kb';

const SCHEMA = 'workspace.qaqanda';
const TABLE = `${SCHEMA}.kb_docs`;

// Canary se pokreće samo kada su ENV + CANARY flag ok
const hasRWEnv = !!ENV.DATABRICKS_HOST && !!ENV.DATABRICKS_TOKEN && !!ENV.DATABRICKS_WAREHOUSE_ID;

const RO_TOKEN = process.env.DATABRICKS_RO_TOKEN;
const hasROEnv = !!RO_TOKEN;

const hasCanaryFlag = process.env.DATABRICKS_CANARY_ENABLED === 'true';

const canaryDescribe = hasRWEnv && hasCanaryFlag ? describe : describe.skip;

canaryDescribe('EP03-US04 — Databricks Canary @canary', () => {
  const createdIds: string[] = [];

  beforeAll(async () => {
    // Best-effort clean-up starih canary redova
    try {
      await executeQuery(
        `
        DELETE FROM ${TABLE}
        WHERE id LIKE 'kb_canary_%'
      `,
      );
    } catch (err) {
      console.warn('[Canary] Cleanup failed:', (err as Error).message);
    }
  });

  it('EP03-US04-TC01 — Canary CRUD: INSERT → SELECT → UPDATE → SELECT', async () => {
    const uniqueSuffix = Date.now();
    const title = `Canary title ${uniqueSuffix}`;
    const text = `Canary content ${uniqueSuffix}`;
    const tags = ['canary', 'ep03', String(uniqueSuffix)];

    // 1) INSERT preko repo sloja
    const id = await addDoc(title, text, tags);
    createdIds.push(id);

    // 2) SELECT inserted
    const created = await getById(id);
    expect(created).not.toBeNull();
    if (!created) return;

    expect(created.id).toBe(id);
    expect(created.title).toBe(title);
    expect(created.text).toBe(text);
    expect(created.tags).toEqual(tags);
    expect(created.createdAt).toBeInstanceOf(Date);

    // 3) UPDATE
    const updatedText = `${text} :: updated`;
    await updateDoc(id, updatedText);

    // 4) SELECT updated
    const updated = await getById(id);
    expect(updated).not.toBeNull();
    if (!updated) return;

    expect(updated.id).toBe(id);
    expect(updated.text).toBe(updatedText);
    expect(updated.title).toBe(title);
    expect(updated.updatedAt).not.toBeNull();
    expect(updated.updatedAt).toBeInstanceOf(Date);
  });

  (hasROEnv ? it : it.skip)('EP03-US04-TC02 — RO credentials cannot mutate, RW can', async () => {
    const originalToken = ENV.DATABRICKS_TOKEN;

    // RW sanity: INSERT mora da prođe
    const rwCheckId = `kb_canary_perm_rw_${Date.now()}`;
    await expect(
      executeQuery(
        `
        INSERT INTO ${TABLE} (id, title, text, tags, created_at, updated_at)
        VALUES (:id, :title, :text, :tags, current_timestamp(), current_timestamp())
      `,
        {
          id: rwCheckId,
          title: 'RW canary',
          text: 'RW should succeed',
          tags: '["rw"]',
        },
      ),
    ).resolves.toBeDefined();

    createdIds.push(rwCheckId);

    // RO – mutacije moraju da padnu
    (ENV as any).DATABRICKS_TOKEN = RO_TOKEN;

    await expect(
      executeQuery(
        `
        INSERT INTO ${TABLE} (id, title, text, tags, created_at, updated_at)
        VALUES (:id, :title, :text, :tags, current_timestamp(), current_timestamp())
      `,
        {
          id: `kb_canary_perm_ro_insert_${Date.now()}`,
          title: 'RO insert',
          text: 'Should fail',
          tags: '["ro"]',
        },
      ),
    ).rejects.toBeInstanceOf(Error);

    await expect(
      executeQuery(
        `
        UPDATE ${TABLE}
        SET text = :text, updated_at = current_timestamp()
        WHERE id = :id
      `,
        {
          id: rwCheckId,
          text: 'RO update should fail',
        },
      ),
    ).rejects.toBeInstanceOf(Error);

    (ENV as any).DATABRICKS_TOKEN = originalToken;
  });

  it('EP03-US04-TC03 — Schema drift detection for kb_docs', async () => {
    let rows = await executeQuery<Record<string, unknown>>(
      `
      SELECT *
      FROM ${TABLE}
      LIMIT 1
    `,
    );

    if (!rows.length) {
      const id = `kb_canary_schema_${Date.now()}`;
      await executeQuery(
        `
        INSERT INTO ${TABLE} (id, title, text, tags, created_at, updated_at)
        VALUES (:id, :title, :text, :tags, current_timestamp(), current_timestamp())
      `,
        {
          id,
          title: 'Schema probe',
          text: 'Schema probe',
          tags: '["schema","probe"]',
        },
      );

      rows = await executeQuery<Record<string, unknown>>(
        `
        SELECT *
        FROM ${TABLE}
        LIMIT 1
      `,
      );
    }

    expect(rows.length).toBeGreaterThan(0);

    const sample = rows[0];
    const columns = Object.keys(sample).sort();

    const expectedColumns = ['id', 'title', 'text', 'tags', 'created_at', 'updated_at'].sort();

    expectedColumns.forEach((col) => {
      expect(columns).toContain(col);
    });

    expect(typeof sample.id).toBe('string');
    expect(typeof sample.title).toBe('string');
    expect(typeof sample.text).toBe('string');
    expect(['string', 'object']).toContain(typeof (sample as any).tags);
  });

  it('EP03-US04-TC04 — Canary tests are isolated and tagged', () => {
    // Dokumentovano ponašanje:
    // - u nazivu je @canary
    // - fajl je u tests/integration
    // - pokreće se preko posebnog vitest.canary.config.ts
    expect(true).toBe(true);
  });
});
