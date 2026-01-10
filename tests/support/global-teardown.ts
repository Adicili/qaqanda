// tests/support/global-teardown.ts
import fs from 'node:fs/promises';
import path from 'node:path';

import { getResolvedLocalDbPath } from '../../src/lib/localdb';

async function globalTeardown() {
  // This is the DB file the server used (webServer env LOCAL_DB_PATH)
  const dbPath = getResolvedLocalDbPath();

  // Only allow deleting test DBs (safety belt)
  const normalized = dbPath.replace(/\\/g, '/');
  if (!normalized.includes('/.qaqanda/local-db.playwright')) {
    console.warn(`ℹ️ Skipping DB cleanup (not a playwright DB): ${dbPath}`);
    return;
  }

  try {
    await fs.unlink(dbPath);
  } catch (e: any) {
    if (e?.code !== 'ENOENT') throw e;
  }

  // Also remove lock if it exists
  try {
    await fs.unlink(`${dbPath}.lock`);
  } catch (e: any) {
    if (e?.code !== 'ENOENT') throw e;
  }

  console.warn(`🧹 Cleaned Playwright DB: ${path.resolve(dbPath)}`);
}

export default globalTeardown;
