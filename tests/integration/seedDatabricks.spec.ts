import 'dotenv/config';

import { describe, it, expect } from 'vitest';

import { ENV } from '@/lib/env';
import { executeQuery } from '@/lib/databricksClient';

const SCHEMA = 'workspace.qaqanda';

const hasRWEnv = !!ENV.DATABRICKS_HOST && !!ENV.DATABRICKS_TOKEN && !!ENV.DATABRICKS_WAREHOUSE_ID;

const hasSeedFlag = process.env.DATABRICKS_SEED_TESTS_ENABLED === 'true';

// ✅ Ne dozvoli da “Databricks seed” testovi rade u mock modu
const shouldRun = hasRWEnv && hasSeedFlag && ENV.USE_DATABRICKS_MOCK !== true;

function getCountFromRows(rows: Array<Record<string, unknown>>): number {
  if (!rows[0]) return 0;

  const row = rows[0];
  const keys = Object.keys(row);
  if (keys.length === 0) return 0;

  const value = row[keys[0]];

  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }

  throw new Error(`Expected numeric COUNT, got: ${String(value)} (type: ${typeof value})`);
}

const seedDescribe = shouldRun ? describe : describe.skip;

seedDescribe('EP03-US02 — Databricks schema & seed verification', () => {
  it('EP03-US02-TC01 — users seed contains admin@example.com and user@example.com', async () => {
    const rows = await executeQuery<Record<string, unknown>>(
      `
        SELECT COUNT(*) as count
        FROM ${SCHEMA}.users
        WHERE email IN (:leadEmail, :engineerEmail)
      `,
      {
        leadEmail: 'admin@example.com',
        engineerEmail: 'user@example.com',
      },
    );

    const count = getCountFromRows(rows);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('EP03-US02-TC02 — kb_docs seed contains two KB docs', async () => {
    const rows = await executeQuery<Record<string, unknown>>(
      `
        SELECT COUNT(*) as count
        FROM ${SCHEMA}.kb_docs
        WHERE id IN (:doc1, :doc2)
      `,
      {
        doc1: 'kb-001',
        doc2: 'kb-002',
      },
    );

    const count = getCountFromRows(rows);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('EP03-US02-TC03 — queries seed contains sample queries', async () => {
    const rows = await executeQuery<Record<string, unknown>>(
      `
        SELECT COUNT(*) as count
        FROM ${SCHEMA}.queries
        WHERE id IN (:q1, :q2)
      `,
      {
        q1: 'q-001',
        q2: 'q-002',
      },
    );

    const count = getCountFromRows(rows);
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
