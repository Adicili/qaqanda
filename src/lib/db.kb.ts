// lib/db.kb.ts
import { randomUUID } from 'node:crypto';

import { executeQuery } from '@/lib/databricksClient';

const SCHEMA = 'workspace.qaqanda';

type DbKBDocRow = {
  id: string;
  title: string;
  text: string;
  // stored as JSON string or NULL in DB
  tags: string | null;
  created_at: string;
  updated_at: string | null;
};

export type KBDoc = {
  id: string;
  title: string;
  text: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date | null;
};

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((t) => String(t));
    }
    // fallback – ako neko upuca plain string umesto JSON
    return [String(parsed)];
  } catch {
    return [];
  }
}

function mapKBDocRow(row: DbKBDocRow): KBDoc {
  return {
    id: row.id,
    title: row.title,
    text: row.text,
    tags: parseTags(row.tags),
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  };
}

export async function getById(id: string): Promise<KBDoc | null> {
  const sql = `
    SELECT id, title, text, tags, created_at, updated_at
    FROM ${SCHEMA}.kb_docs
    WHERE id = :id
  `;

  const rows = await executeQuery<DbKBDocRow>(sql, { id });
  if (!rows.length) return null;

  return mapKBDocRow(rows[0]);
}

export async function addDoc(title: string, text: string, tags: string[]): Promise<string> {
  const sql = `
    INSERT INTO ${SCHEMA}.kb_docs (id, title, text, tags, created_at, updated_at)
    VALUES (:id, :title, :text, :tags, current_timestamp(), current_timestamp())
    RETURNING id
  `;

  const id = `kb_${randomUUID()}`;
  const tagsJson = JSON.stringify(tags);

  const rows = await executeQuery<{ id: string }>(sql, {
    id,
    title,
    text,
    tags: tagsJson, // SqlParams: string ✔
  });

  return rows[0]?.id ?? id;
}

// US kaže updateDoc(id, newText) — držim taj potpis
export async function updateDoc(id: string, newText: string): Promise<void> {
  const sql = `
    UPDATE ${SCHEMA}.kb_docs
    SET text = :text,
        updated_at = current_timestamp()
    WHERE id = :id
  `;

  await executeQuery<never>(sql, {
    id,
    text: newText,
  });
}

export async function listAll(): Promise<KBDoc[]> {
  const sql = `
    SELECT id, title, text, tags, created_at, updated_at
    FROM ${SCHEMA}.kb_docs
    ORDER BY created_at DESC
  `;

  const rows = await executeQuery<DbKBDocRow>(sql);
  return rows.map(mapKBDocRow);
}
