import fs from 'node:fs/promises';

import { getResolvedLocalDbPath } from '../../src/lib/localdb';

export default async function globalTeardown() {
  const dbPath = getResolvedLocalDbPath();
  const lockPath = `${dbPath}.lock`;

  // Best-effort cleanup
  await fs.rm(lockPath, { force: true }).catch(() => {});
  await fs.rm(dbPath, { force: true }).catch(() => {});
}
