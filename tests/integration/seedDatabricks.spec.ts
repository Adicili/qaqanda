// tests/integration/seedDatabricks.spec.ts
import { describe, it, expect } from 'vitest';

import { ENV } from '@/lib/env';
import { executeQuery } from '@/lib/databricksClient';

const hasDatabricksEnv = !!ENV.DATABRICKS_HOST && !!ENV.DATABRICKS_TOKEN;

(hasDatabricksEnv ? describe : describe.skip)(
  'EP03-US02 — Databricks schema & seed verification',
  () => {
    it('EP03-US02-TC01 — users seed contains admin@example.com and user@example.com', async () => {
      const rows = await executeQuery<{ count: number }>(
        `
        SELECT COUNT(*) as count
        FROM users
        WHERE email IN (:leadEmail, :engineerEmail)
      `,
        {
          leadEmail: 'admin@example.com',
          engineerEmail: 'user@example.com',
        },
      );

      expect(rows[0]?.count).toBeGreaterThanOrEqual(2);
    });

    it('EP03-US02-TC02 — kb_docs seed contains two KB docs', async () => {
      const rows = await executeQuery<{ count: number }>(
        `
        SELECT COUNT(*) as count
        FROM kb_docs
        WHERE id IN (:doc1, :doc2)
      `,
        {
          doc1: 'kb-001',
          doc2: 'kb-002',
        },
      );

      expect(rows[0]?.count).toBeGreaterThanOrEqual(2);
    });
  },
);
