// tests/integration/seedDatabricks.spec.ts
import 'dotenv/config';

import { describe, it, expect } from 'vitest';

import { ENV } from '@/lib/env';
import { executeQuery } from '@/lib/databricksClient';

const hasDatabricksEnv =
  !!ENV.DATABRICKS_HOST && !!ENV.DATABRICKS_TOKEN && !!ENV.DATABRICKS_WAREHOUSE_ID;

const SCHEMA = 'workspace.qaqanda';

function getCountFromRows(rows: Array<Record<string, unknown>>): number {
  if (!rows[0]) return 0;

  const row = rows[0];
  const keys = Object.keys(row);
  if (keys.length === 0) return 0;

  const value = row[keys[0]];

  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;

  // Databricks JSON_ARRAY format – sve dolazi kao string
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }

  // Ako baš bude neki cirkus, test će jasno puknuti
  throw new Error(`Expected numeric COUNT, got: ${String(value)} (type: ${typeof value})`);
}

(hasDatabricksEnv ? describe : describe.skip)(
  'EP03-US02 — Databricks schema & seed verification',
  () => {
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
  },
);
