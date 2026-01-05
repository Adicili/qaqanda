// src/lib/db.audit.ts
import { randomUUID } from 'node:crypto';

import { executeQuery } from '@/lib/databricksClient';
import { ENV } from '@/lib/env';

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
  createdAt: string;
};

/**
 * In-memory fallback (kad Databricks nije konfigurisan)
 * Ovo je NAMERNO jednostavno – služi testovima i local dev-u.
 */
const memoryAudit: KbAuditRecord[] = [];

function isDbEnabled(): boolean {
  return Boolean(ENV.DATABRICKS_HOST && ENV.DATABRICKS_TOKEN && ENV.DATABRICKS_WAREHOUSE_ID);
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
}): Promise<string> {
  const auditId = `audit_${randomUUID()}`;
  const createdAt = new Date().toISOString();

  if (!isDbEnabled()) {
    memoryAudit.push({
      id: auditId,
      actorUserId: params.actorUserId,
      changeType: params.changeType,
      kbId: params.kbId,
      beforeJson: params.beforeJson,
      afterJson: params.afterJson,
      createdAt,
    });

    return auditId;
  }

  await executeQuery(
    `
    INSERT INTO kb_audit (
      id,
      actor_user_id,
      change_type,
      kb_id,
      before_json,
      after_json,
      created_at
    )
    VALUES (
      :id,
      :actor_user_id,
      :change_type,
      :kb_id,
      :before_json,
      :after_json,
      CURRENT_TIMESTAMP()
    )
    `,
    {
      id: auditId,
      actor_user_id: params.actorUserId,
      change_type: params.changeType,
      kb_id: params.kbId,
      before_json: params.beforeJson,
      after_json: params.afterJson,
    },
  );

  return auditId;
}

/**
 * Test helper – koristi se SAMO u testovima
 * (npr. da proveriš da li je audit napravljen)
 */
export function __getInMemoryAudit(): KbAuditRecord[] {
  return memoryAudit;
}

/**
 * Test helper – reset između testova
 */
export function __resetInMemoryAudit() {
  memoryAudit.length = 0;
}
