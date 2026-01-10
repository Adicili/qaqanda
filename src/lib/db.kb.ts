// src/lib/db.kb.ts
import { randomUUID } from 'node:crypto';

import { executeQuery } from '@/lib/databricksClient';
import { ENV } from '@/lib/env';
import { readLocalDb, updateLocalDb } from '@/lib/localdb';

const SCHEMA = 'workspace.qaqanda';

// isti kriterijum kao u db.users.ts
const hasDatabricksEnv = !!ENV.DATABRICKS_HOST && !!ENV.DATABRICKS_TOKEN;

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

export type KBDocPatch = {
  title: string;
  text: string;
  tags: string[];
};

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((t) => String(t));
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

/**
 * -------------------------
 * File-based local storage
 * -------------------------
 */

type LocalKbRow = {
  id: string;
  title: string;
  text: string;
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string | null; // ISO | null
};

function toKBDoc(row: LocalKbRow): KBDoc {
  return {
    id: row.id,
    title: row.title,
    text: row.text,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    createdAt: new Date(row.createdAt),
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
  };
}

async function getByIdLocal(id: string): Promise<KBDoc | null> {
  const db = await readLocalDb();
  const docs = db.kb as unknown as LocalKbRow[];
  const found = docs.find((d) => d.id === id);
  return found ? toKBDoc(found) : null;
}

async function addDocLocal(title: string, text: string, tags: string[]): Promise<string> {
  const id = `kb_${randomUUID()}`;
  const nowIso = new Date().toISOString();

  await updateLocalDb<void>((db) => {
    const docs = db.kb as unknown as LocalKbRow[];

    const row: LocalKbRow = {
      id,
      title,
      text,
      tags: tags.map(String),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    docs.push(row);
  });

  return id;
}

async function updateDocLocal(id: string, arg: string | KBDocPatch): Promise<void> {
  const nowIso = new Date().toISOString();

  await updateLocalDb<void>((db) => {
    const docs = db.kb as unknown as LocalKbRow[];
    const idx = docs.findIndex((d) => d.id === id);
    if (idx === -1) return;

    const existing = docs[idx];

    if (typeof arg === 'string') {
      docs[idx] = { ...existing, text: arg, updatedAt: nowIso };
      return;
    }

    docs[idx] = {
      ...existing,
      title: arg.title,
      text: arg.text,
      tags: arg.tags.map(String),
      updatedAt: nowIso,
    };
  });
}

async function listAllLocal(): Promise<KBDoc[]> {
  const db = await readLocalDb();
  const docs = (db.kb as unknown as LocalKbRow[]).slice();

  docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return docs.map(toKBDoc);
}

/**
 * -------------------------
 * Public API
 * -------------------------
 */

export async function getById(id: string): Promise<KBDoc | null> {
  if (!hasDatabricksEnv) return getByIdLocal(id);

  const sql = `
    SELECT id, title, text, tags, created_at, updated_at
    FROM ${SCHEMA}.kb_docs
    WHERE id = :id
    LIMIT 1
  `;

  const rows = await executeQuery<DbKBDocRow>(sql, { id });
  if (!rows.length) return null;

  return mapKBDocRow(rows[0]);
}

export async function addDoc(title: string, text: string, tags: string[]): Promise<string> {
  if (!hasDatabricksEnv) return addDocLocal(title, text, tags);

  const id = `kb_${randomUUID()}`;

  // EP03 test očekuje RETURNING id (mock vraća 'kb-xyz')
  const sql = `
    INSERT INTO ${SCHEMA}.kb_docs (id, title, text, tags, created_at, updated_at)
    VALUES (:id, :title, :text, :tags, current_timestamp(), current_timestamp())
    RETURNING id
  `;

  const rows = await executeQuery<{ id: string }>(sql, {
    id,
    title,
    text,
    tags: JSON.stringify(tags),
  });

  return rows[0]?.id ?? id;
}

// Overload 1 (EP03): update only text
export async function updateDoc(id: string, newText: string): Promise<void>;
// Overload 2 (EP05): update title + text + tags
export async function updateDoc(id: string, patch: KBDocPatch): Promise<void>;
export async function updateDoc(id: string, arg: string | KBDocPatch): Promise<void> {
  if (!hasDatabricksEnv) return updateDocLocal(id, arg);

  if (typeof arg === 'string') {
    // EP03 behavior (unit tests expect :text param only)
    const sql = `
      UPDATE ${SCHEMA}.kb_docs
      SET text = :text,
          updated_at = current_timestamp()
      WHERE id = :id
    `;

    await executeQuery<never>(sql, { id, text: arg });
    return;
  }

  // EP05 behavior
  const sql = `
    UPDATE ${SCHEMA}.kb_docs
    SET
      title = :title,
      text = :text,
      tags = :tags,
      updated_at = current_timestamp()
    WHERE id = :id
  `;

  await executeQuery<never>(sql, {
    id,
    title: arg.title,
    text: arg.text,
    tags: JSON.stringify(arg.tags),
  });
}

export async function listAll(): Promise<KBDoc[]> {
  if (!hasDatabricksEnv) return listAllLocal();

  const sql = `
    SELECT id, title, text, tags, created_at, updated_at
    FROM ${SCHEMA}.kb_docs
    ORDER BY created_at DESC
  `;

  const rows = await executeQuery<DbKBDocRow>(sql);
  return rows.map(mapKBDocRow);
}
