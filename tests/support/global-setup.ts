// tests/support/global-setup.ts
import { resetLocalDb, getResolvedLocalDbPath } from '../../src/lib/localdb';

async function globalSetup() {
  // Must match playwright.config.ts
  process.env.LOCAL_DB_PATH = '.qaqanda/local-db.playwright.json';

  // Force local file DB behavior in this test process too
  process.env.USE_DATABRICKS_MOCK = 'false';
  process.env.DATABRICKS_HOST = '';
  process.env.DATABRICKS_TOKEN = '';
  process.env.DATABRICKS_WAREHOUSE_ID = '';

  await resetLocalDb();

  console.warn(`ℹ️ Tests running with file-based local storage: ${getResolvedLocalDbPath()}`);
}

export default globalSetup;
