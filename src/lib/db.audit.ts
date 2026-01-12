// src/lib/db.audit.ts
import { randomUUID } from 'node:crypto';

import { executeQuery } from '@/lib/databricksClient';
import { isDatabricksEnabled } from '@/lib/dbMode';
import { readLocalDb, updateLocalDb } from '@/lib/localdb';

const SCHEMA = 'workspace.qaqanda';

/**
 * Audit change types
 */
export type AuditChangeType = 'CREATE' | 'UPDATE';

/**
 * Audit record shape (runtime, ne DB schema)
 */
export type KbAuditRecord = {
  id: string;
  actorUserId: string;
  changeType: AuditChangeType;
  kbId: string;
  beforeJson: string | null;
  afterJson: string;
  createdAt: string; // ISO string (kept as string by design)

  // ✅ EP09-US03: LLM metadata
  llmModel: string | null;
  llmLatencyMs: number | null;
  llmTotalTokens: number | null;
};

/**
 * -------------------------
 * File-based local storage
 * -------------------------
 */

type LocalAuditRow = KbAuditRecord;

async function insertKbAuditLocal(row: LocalAuditRow): Promise<string> {
  await updateLocalDb<void>((db) => {
    const audit = db.audit as unknown as LocalAuditRow[];
    audit.push(row);
  });
  return row.id;
}

async function listKbAuditByKbIdLocal(kbId: string, limit = 50): Promise<KbAuditRecord[]> {
  const db = await readLocalDb();
  const audit = db.audit as unknown as LocalAuditRow[];

  // newest first
  return audit
    .filter((a) => a.kbId === kbId)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

/**
 * Insert audit entry for KB mutation.
 * Ovo se zove SAMO nakon uspešne validacije + DB write-a.
 */
export async function insertKbAudit(params: {
  actorUserId: string;
  changeType: AuditChangeType;
  kbId: string;
  beforeJson: string | null;
  afterJson: string;

  // ✅ EP09-US03: required by acceptance criteria
  llmModel?: string | null;
  llmLatencyMs?: number | null;
  llmTotalTokens?: number | null;
}): Promise<string> {
  const auditId = `audit_${randomUUID()}`;
  const createdAt = new Date().toISOString();

  const record: KbAuditRecord = {
    id: auditId,
    actorUserId: params.actorUserId,
    changeType: params.changeType,
    kbId: params.kbId,
    beforeJson: params.beforeJson,
    afterJson: params.afterJson,
    createdAt,

    llmModel: params.llmModel ?? null,
    llmLatencyMs: params.llmLatencyMs ?? null,
    llmTotalTokens: params.llmTotalTokens ?? null,
  };

  if (!isDatabricksEnabled()) {
    return insertKbAuditLocal(record);
  }

  await executeQuery(
    `
    INSERT INTO ${SCHEMA}.kb_audit (
      id,
      actor_user_id,
      change_type,
      kb_id,
      before_json,
      after_json,
      created_at,

      llm_model,
      llm_latency_ms,
      llm_total_tokens
    )
    VALUES (
      :id,
      :actor_user_id,
      :change_type,
      :kb_id,
      :before_json,
      :after_json,
      CURRENT_TIMESTAMP(),

      :llm_model,
      :llm_latency_ms,
      :llm_total_tokens
    )
    `,
    {
      id: auditId,
      actor_user_id: params.actorUserId,
      change_type: params.changeType,
      kb_id: params.kbId,
      before_json: params.beforeJson,
      after_json: params.afterJson,

      llm_model: params.llmModel ?? null,
      llm_latency_ms: params.llmLatencyMs ?? null,
      llm_total_tokens: params.llmTotalTokens ?? null,
    },
  );

  return auditId;
}

/**
 * Public read API for tests/debugging (no private __ helpers).
 */
export async function listKbAuditByKbId(kbId: string, limit = 50): Promise<KbAuditRecord[]> {
  if (!isDatabricksEnabled()) return listKbAuditByKbIdLocal(kbId, limit);

  const rows = await executeQuery<{
    id: string;
    actor_user_id: string;
    change_type: string;
    kb_id: string;
    before_json: string | null;
    after_json: string;
    created_at: string;

    llm_model: string | null;
    llm_latency_ms: number | null;
    llm_total_tokens: number | null;
  }>(
    `
    SELECT
      id,
      actor_user_id,
      change_type,
      kb_id,
      before_json,
      after_json,
      created_at,

      llm_model,
      llm_latency_ms,
      llm_total_tokens
    FROM ${SCHEMA}.kb_audit
    WHERE kb_id = :kbId
    ORDER BY created_at DESC
    LIMIT :limit
    `,
    { kbId, limit },
  );

  return rows.map((r) => ({
    id: r.id,
    actorUserId: r.actor_user_id,
    changeType: r.change_type as AuditChangeType,
    kbId: r.kb_id,
    beforeJson: r.before_json,
    afterJson: r.after_json,
    createdAt: r.created_at,

    llmModel: r.llm_model ?? null,
    llmLatencyMs: r.llm_latency_ms ?? null,
    llmTotalTokens: r.llm_total_tokens ?? null,
  }));
}
