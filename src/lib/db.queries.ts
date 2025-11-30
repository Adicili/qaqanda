// lib/db.queries.ts
import { randomUUID } from 'node:crypto';

import { executeQuery } from '@/lib/databricksClient';

const SCHEMA = 'workspace.qaqanda';

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
