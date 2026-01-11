// tests/unit/setup-db-mock.ts

// Required by env.ts schema
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'x'.repeat(64);

// Force Databricks layer ON but routed to mock
process.env.DB_MODE = 'databricks';
process.env.USE_DATABRICKS_MOCK = '1';

// Provide dummy Databricks config (some code expects them non-empty)
process.env.DATABRICKS_HOST = process.env.DATABRICKS_HOST ?? 'https://dummy-databricks.example.com';
process.env.DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN ?? 'test-token';
process.env.DATABRICKS_WAREHOUSE_ID = process.env.DATABRICKS_WAREHOUSE_ID ?? 'test-warehouse-id';

// If you still have STORAGE_MODE anywhere in codebase, lock it too.
// Safe even if unused.
process.env.STORAGE_MODE = process.env.STORAGE_MODE ?? 'databricks_mock';

// Optional: keep localdb isolated if any unit touches it
process.env.LOCAL_DB_PATH = process.env.LOCAL_DB_PATH ?? '.qaqanda/local-db.unit.json';
