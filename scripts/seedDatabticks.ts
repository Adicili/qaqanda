// scripts/seedDatabricks.ts
import path from 'node:path';
import { readFile } from 'node:fs/promises';

import { executeQuery } from '@/lib/databricksClient';
import { ENV } from '@/lib/env';

async function applySchema() {
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  const sql = await readFile(schemaPath, 'utf8');

  // Databricks SQL API expects single statement per request
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    // DDL, no result set needed
    await executeQuery(statement);
  }
}

async function seedUsers() {
  // Lead user (admin@example.com)
  const mergeLead = `
    MERGE INTO users AS t
    USING (
      SELECT
        'user-lead-1'       AS id,
        'admin@example.com' AS email,
        'HASHED_PASSWORD'   AS password_hash,
        'LEAD'              AS role,
        current_timestamp() AS created_at
    ) AS s
    ON t.email = s.email
    WHEN NOT MATCHED THEN
      INSERT (id, email, password_hash, role, created_at)
      VALUES (s.id, s.email, s.password_hash, s.role, s.created_at)
  `;

  // Engineer user (user@example.com)
  const mergeEngineer = `
    MERGE INTO users AS t
    USING (
      SELECT
        'user-engineer-1'    AS id,
        'user@example.com'   AS email,
        'HASHED_PASSWORD_2'  AS password_hash,
        'ENGINEER'           AS role,
        current_timestamp()  AS created_at
    ) AS s
    ON t.email = s.email
    WHEN NOT MATCHED THEN
      INSERT (id, email, password_hash, role, created_at)
      VALUES (s.id, s.email, s.password_hash, s.role, s.created_at)
  `;

  await executeQuery(mergeLead);
  await executeQuery(mergeEngineer);
}

async function seedKbDocs() {
  const mergeDoc1 = `
    MERGE INTO kb_docs AS t
    USING (
      SELECT
        'kb-001'                            AS id,
        'Getting started with QAQ&A'        AS title,
        'This is a sample KB article.'      AS text,
        ARRAY('intro', 'qaqanda')           AS tags,
        current_timestamp()                 AS updated_at
    ) AS s
    ON t.id = s.id
    WHEN NOT MATCHED THEN
      INSERT (id, title, text, tags, updated_at)
      VALUES (s.id, s.title, s.text, s.tags, s.updated_at)
  `;

  const mergeDoc2 = `
    MERGE INTO kb_docs AS t
    USING (
      SELECT
        'kb-002'                                 AS id,
        'Playwright testing strategy'            AS title,
        'KB article describing the test strategy' AS text,
        ARRAY('testing', 'playwright')           AS tags,
        current_timestamp()                       AS updated_at
    ) AS s
    ON t.id = s.id
    WHEN NOT MATCHED THEN
      INSERT (id, title, text, tags, updated_at)
      VALUES (s.id, s.title, s.text, s.tags, s.updated_at)
  `;

  await executeQuery(mergeDoc1);
  await executeQuery(mergeDoc2);
}

async function main() {
  if (!ENV.DATABRICKS_HOST || !ENV.DATABRICKS_TOKEN) {
    console.error('❌ DATABRICKS_HOST / DATABRICKS_TOKEN not set. Cannot seed.');
    process.exitCode = 1;
    return;
  }

  console.warn('⏳ Applying Databricks schema...');
  await applySchema();
  console.warn('✅ Schema applied');

  console.warn('⏳ Seeding users...');
  await seedUsers();
  console.warn('✅ Users seeded');

  console.warn('⏳ Seeding KB docs...');
  await seedKbDocs();
  console.warn('✅ KB docs seeded');

  console.warn('🎉 Databricks seed complete');
}

main().catch((err) => {
  console.error('❌ Databricks seed failed:', err);
  process.exitCode = 1;
});
