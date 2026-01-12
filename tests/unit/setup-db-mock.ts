// tests/unit/setup-db-mock.ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { beforeEach, afterEach, vi } from 'vitest';

// ✅ hard-separate Unit DB from Playwright DB
const UNIT_DB_PATH = path.join(os.tmpdir(), 'qaqanda-local-db.unit.json');

function resetUnitDbFile() {
  try {
    fs.rmSync(UNIT_DB_PATH, { force: true });
  } catch {}
}

process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'x'.repeat(32);

// ✅ If any module falls back to localdb, it will use THIS file (not Playwright’s)
process.env.LOCAL_DB_PATH = UNIT_DB_PATH;

// ✅ If your code branches on these, make it deterministic for unit tests
process.env.DB_MODE = process.env.DB_MODE ?? 'databricks';
process.env.USE_DATABRICKS_MOCK = process.env.USE_DATABRICKS_MOCK ?? '1';

// optional: speed up any lock logic
process.env.LOCAL_DB_LOCK_TIMEOUT_MS = process.env.LOCAL_DB_LOCK_TIMEOUT_MS ?? '50';
process.env.LOCAL_DB_STALE_LOCK_MS = process.env.LOCAL_DB_STALE_LOCK_MS ?? '50';

// 🔥 IMPORTANT: reset file + reset module cache so import-time flags re-evaluate
beforeEach(() => {
  resetUnitDbFile();
  vi.resetModules();
});

afterEach(() => {
  resetUnitDbFile();
});
