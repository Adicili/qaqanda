// src/lib/localdb.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

import { ENV } from '@/lib/env';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

export type LocalDb = {
  version: number;
  users: Array<Record<string, JsonValue>>;
  kb: Array<Record<string, JsonValue>>;
  queries: Array<Record<string, JsonValue>>;
  audit: Array<Record<string, JsonValue>>;
};

const DEFAULT_DB_RELATIVE_PATH = path.join('.qaqanda', 'local-db.json');

function getDbPath(): string {
  // Allow override (tests, CI, custom env)
  const fromEnv = ENV.LOCAL_DB_PATH?.trim();
  if (fromEnv) return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(fromEnv);
  return path.resolve(DEFAULT_DB_RELATIVE_PATH);
}

function getLockPath(dbPath: string): string {
  return `${dbPath}.lock`;
}

function defaultDb(): LocalDb {
  return {
    version: 1,
    users: [],
    kb: [],
    queries: [],
    audit: [],
  };
}

async function ensureParentDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Acquire a filesystem lock by creating <dbPath>.lock with O_EXCL semantics ("wx").
 * This is a simple cross-platform lock good enough for local dev + tests.
 *
 * Notes:
 * - If the process crashes, the lock file can remain. We treat locks older than STALE_LOCK_MS as stale.
 * - We retry with jittered backoff up to LOCK_TIMEOUT_MS.
 */
async function acquireLock(lockPath: string): Promise<{ release: () => Promise<void> }> {
  const LOCK_TIMEOUT_MS = Number(ENV.LOCAL_DB_LOCK_TIMEOUT_MS ?? 10_000);
  const STALE_LOCK_MS = Number(ENV.LOCAL_DB_STALE_LOCK_MS ?? 60_000);

  // ✅ Ensure the directory exists before creating the lock file
  await ensureParentDir(lockPath);

  const start = Date.now();
  const token = crypto.randomBytes(12).toString('hex');
  const payload = JSON.stringify({ token, pid: process.pid, at: new Date().toISOString() });

  while (true) {
    try {
      // "wx" => fail if exists
      const handle = await fs.open(lockPath, 'wx');
      try {
        await handle.writeFile(payload, 'utf8');
      } finally {
        await handle.close();
      }

      return {
        release: async () => {
          try {
            const current = await fs.readFile(lockPath, 'utf8');
            if (current.includes(token)) {
              await fs.unlink(lockPath);
            }
          } catch {
            // ignore
          }
        },
      };
    } catch (err: any) {
      if (err?.code !== 'EEXIST') throw err;

      try {
        const stat = await fs.stat(lockPath);
        const age = Date.now() - stat.mtimeMs;
        if (age > STALE_LOCK_MS) {
          await fs.unlink(lockPath);
          continue;
        }
      } catch {
        // ignore
      }

      if (Date.now() - start > LOCK_TIMEOUT_MS) {
        throw new Error(
          `LOCAL_DB lock timeout after ${LOCK_TIMEOUT_MS}ms (lock file: ${lockPath}). ` +
            `If this persists, delete the lock file or increase LOCAL_DB_LOCK_TIMEOUT_MS.`,
        );
      }

      await sleep(25 + Math.floor(Math.random() * 100));
    }
  }
}

/**
 * Atomic write: write to a temp file in the same directory, then rename over target.
 * On Windows, rename over existing can be finicky; so we unlink target first if needed.
 */
async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  await ensureParentDir(filePath);

  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmp = path.join(dir, `.${base}.${process.pid}.${Date.now()}.tmp`);

  const json = JSON.stringify(data, null, 2);

  await fs.writeFile(tmp, json, 'utf8');

  // Try rename over target. If it fails on Windows due to existing target, unlink then rename.
  try {
    await fs.rename(tmp, filePath);
  } catch (err: any) {
    if (err?.code === 'EPERM' || err?.code === 'EACCES' || err?.code === 'EEXIST') {
      try {
        await fs.unlink(filePath);
      } catch {
        // ignore if file doesn't exist
      }
      await fs.rename(tmp, filePath);
    } else {
      // cleanup tmp and rethrow
      try {
        await fs.unlink(tmp);
      } catch {}
      throw err;
    }
  }
}

async function safeReadJson(filePath: string): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    // If file is corrupted, don't silently mask it — that hides real bugs.
    throw new Error(`LOCAL_DB read failed for ${filePath}: ${err?.message ?? String(err)}`);
  }
}

function assertDbShape(db: any): asserts db is LocalDb {
  if (!db || typeof db !== 'object') throw new Error('LOCAL_DB: invalid DB (not an object)');
  if (typeof db.version !== 'number') throw new Error('LOCAL_DB: invalid DB (missing version)');
  if (!Array.isArray(db.users)) throw new Error('LOCAL_DB: invalid DB (users not array)');
  if (!Array.isArray(db.kb)) throw new Error('LOCAL_DB: invalid DB (kb not array)');
  if (!Array.isArray(db.queries)) throw new Error('LOCAL_DB: invalid DB (queries not array)');
  if (!Array.isArray(db.audit)) throw new Error('LOCAL_DB: invalid DB (audit not array)');
}

/**
 * Read the DB (creates it if missing).
 */
export async function readLocalDb(): Promise<LocalDb> {
  const dbPath = getDbPath();
  const lockPath = getLockPath(dbPath);

  const lock = await acquireLock(lockPath);
  try {
    const data = await safeReadJson(dbPath);
    if (data === null) {
      const fresh = defaultDb();
      await atomicWriteJson(dbPath, fresh);
      return fresh;
    }
    assertDbShape(data);
    return data;
  } finally {
    await lock.release();
  }
}

/**
 * Write the DB (atomic) under lock.
 */
export async function writeLocalDb(db: LocalDb): Promise<void> {
  const dbPath = getDbPath();
  const lockPath = getLockPath(dbPath);

  const lock = await acquireLock(lockPath);
  try {
    assertDbShape(db);
    await atomicWriteJson(dbPath, db);
  } finally {
    await lock.release();
  }
}

/**
 * Update the DB with a single read-modify-write transaction under lock.
 * This is what your route handlers should call.
 */
export async function updateLocalDb<T>(
  fn: (db: LocalDb) => { db: LocalDb; result: T } | T,
): Promise<T> {
  const dbPath = getDbPath();
  const lockPath = getLockPath(dbPath);

  const lock = await acquireLock(lockPath);
  try {
    const currentRaw = await safeReadJson(dbPath);
    const current = currentRaw === null ? defaultDb() : (currentRaw as any);
    assertDbShape(current);

    const out = fn(current);

    // Support two styles:
    // - return { db, result }
    // - mutate db in place and return result directly
    if (out && typeof out === 'object' && 'db' in (out as any) && 'result' in (out as any)) {
      const { db, result } = out as any;
      assertDbShape(db);
      await atomicWriteJson(dbPath, db);
      return result as T;
    } else {
      // assume mutation in place
      assertDbShape(current);
      await atomicWriteJson(dbPath, current);
      return out as T;
    }
  } finally {
    await lock.release();
  }
}

/**
 * Hard reset the DB (used by tests).
 */
export async function resetLocalDb(): Promise<void> {
  const fresh = defaultDb();
  await writeLocalDb(fresh);
}

/**
 * Expose resolved path for debugging/tests.
 */
export function getResolvedLocalDbPath(): string {
  return getDbPath();
}
