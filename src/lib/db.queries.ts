// src/lib/db.queries.ts
import { randomUUID } from 'node:crypto';

import { isDatabricksEnabled } from './dbMode';

import { executeQuery } from '@/lib/databricksClient';
import { readLocalDb, updateLocalDb } from '@/lib/localdb';

const SCHEMA = 'workspace.qaqanda';

// opet – isto kao db.users.ts
const hasDatabricksEnv = isDatabricksEnabled();

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

/**
 * -------------------------
 * File-based local storage
 * -------------------------
 */

type LocalQueryRow = {
  id: string;
  userId: string;
  question: string;
  latencyMs: number;
  createdAt: string; // ISO
};

function toQueryLog(row: LocalQueryRow): QueryLog {
  return {
    id: row.id,
    userId: row.userId,
    question: row.question,
    latencyMs: Number.isFinite(row.latencyMs) ? row.latencyMs : 0,
    createdAt: new Date(row.createdAt),
  };
}

async function insertQueryLocal(
  userId: string,
  question: string,
  latencyMs: number,
): Promise<string> {
  const id = `local_${randomUUID()}`;
  const nowIso = new Date().toISOString();

  await updateLocalDb<void>((db) => {
    const queries = db.queries as unknown as LocalQueryRow[];

    const row: LocalQueryRow = {
      id,
      userId,
      question,
      latencyMs: Number.isFinite(latencyMs) ? latencyMs : 0,
      createdAt: nowIso,
    };

    // newest first (matches old memoryQueries.unshift)
    queries.unshift(row);

    // cap at 1000 like before
    if (queries.length > 1000) {
      queries.length = 1000;
    }
  });

  return id;
}

async function getRecentByUserLocal(userId: string, limit = 10): Promise<QueryLog[]> {
  const db = await readLocalDb();
  const queries = db.queries as unknown as LocalQueryRow[];

  return queries
    .filter((q) => q.userId === userId)
    .slice(0, limit)
    .map(toQueryLog);
}

/**
 * -------------------------
 * Public API
 * -------------------------
 */

export async function insertQuery(
  userId: string,
  question: string,
  latencyMs: number,
): Promise<string> {
  if (!hasDatabricksEnv) return insertQueryLocal(userId, question, latencyMs);

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
  if (!hasDatabricksEnv) return getRecentByUserLocal(userId, limit);

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
