// src/lib/db.queries.ts
import { randomUUID } from 'node:crypto';

import { executeQuery } from '@/lib/databricksClient';
import { ENV } from '@/lib/env';

const SCHEMA = 'workspace.qaqanda';

// Vitest/Jest mock detection – u testovima je executeQuery mock sa `.mock`
const isExecuteQueryMocked = typeof (executeQuery as any).mock === 'object';

const forceDatabricksMock = !!ENV.USE_DATABRICKS_MOCK;

const enableDatabricks =
  isExecuteQueryMocked ||
  forceDatabricksMock ||
  (ENV.NODE_ENV === 'production' &&
    !!ENV.DATABRICKS_HOST &&
    !!ENV.DATABRICKS_TOKEN &&
    !!ENV.DATABRICKS_WAREHOUSE_ID);

const memoryQueries: QueryLog[] = [];

type DbQueryRow = {
  id: string;
  user_id: string;
  question: string;
  latency_ms: number | string;
  created_at: string;
};

export type QueryLog = {
  id: string;
  userId: string;
  question: string;
  latencyMs: number;
  createdAt: Date;
};

function mapQueryRow(row: DbQueryRow): QueryLog {
  const latency = typeof row.latency_ms === 'string' ? Number(row.latency_ms) : row.latency_ms;

  return {
    id: row.id,
    userId: row.user_id,
    question: row.question,
    latencyMs: Number.isFinite(latency) ? Number(latency) : 0,
    createdAt: new Date(row.created_at),
  };
}

export async function insertQuery(
  userId: string,
  question: string,
  latencyMs: number,
): Promise<string> {
  if (!enableDatabricks) {
    const id = `local_${randomUUID()}`;
    memoryQueries.unshift({
      id,
      userId,
      question,
      latencyMs,
      createdAt: new Date(),
    });
    // neka ne naraste u beskonačnost
    if (memoryQueries.length > 1000) {
      memoryQueries.pop();
    }
    return id;
  }

  const sql = `
    INSERT INTO ${SCHEMA}.queries (id, user_id, question, latency_ms, created_at)
    VALUES (:id, :userId, :question, :latencyMs, current_timestamp())
    RETURNING id
  `;

  const id = `q_${randomUUID()}`;

  const rows = await executeQuery<{ id: string }>(sql, {
    id,
    userId,
    question,
    latencyMs,
  });

  return rows[0]?.id ?? id;
}

export async function getRecentByUser(userId: string, limit = 10): Promise<QueryLog[]> {
  if (!enableDatabricks) {
    return memoryQueries.filter((q) => q.userId === userId).slice(0, limit);
  }

  const sql = `
    SELECT id, user_id, question, latency_ms, created_at
    FROM ${SCHEMA}.queries
    WHERE user_id = :userId
    ORDER BY created_at DESC
    LIMIT :limit
  `;

  const rows = await executeQuery<DbQueryRow>(sql, { userId, limit });
  return rows.map(mapQueryRow);
}
