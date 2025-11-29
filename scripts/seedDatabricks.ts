// scripts/seedDatabricks.ts
import 'dotenv/config';

import path from 'node:path';
import { readFile } from 'node:fs/promises';

import bcrypt from 'bcryptjs';

import { executeQuery } from '@/lib/databricksClient';
import { ENV } from '@/lib/env';

async function applySchema() {
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  const sql = await readFile(schemaPath, 'utf8');

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    const preview = statement.replace(/\s+/g, ' ').slice(0, 120);
    console.warn(`↪ Running schema statement: ${preview}...`);
    await executeQuery(statement);
  }
}

// USERS
async function seedUsers() {
  const leadPassword = 'Passw0rd!';
  const engineerPassword = 'Passw0rd!';

  const leadHash = await bcrypt.hash(leadPassword, 10);
  const engineerHash = await bcrypt.hash(engineerPassword, 10);

  const mergeUserSql = `
    MERGE INTO workspace.qaqanda.users AS t
    USING (
      SELECT
        :id            AS id,
        :email         AS email,
        :password_hash AS password_hash,
        :role          AS role,
        current_timestamp() AS created_at
    ) AS s
    ON t.email = s.email
    WHEN NOT MATCHED THEN
      INSERT (id, email, password_hash, role, created_at)
      VALUES (s.id, s.email, s.password_hash, s.role, s.created_at)
  `;

  // LEAD
  await executeQuery(mergeUserSql, {
    id: 'user-lead-1',
    email: 'admin@example.com',
    password_hash: leadHash,
    role: 'LEAD',
  });

  // ENGINEER
  await executeQuery(mergeUserSql, {
    id: 'user-engineer-1',
    email: 'user@example.com',
    password_hash: engineerHash,
    role: 'ENGINEER',
  });

  console.warn('✅ Users seeded (admin@example.com, user@example.com, Passw0rd!)');
}

// KB_DOCS
async function seedKbDocs() {
  const mergeDocSql = `
    MERGE INTO workspace.qaqanda.kb_docs AS t
    USING (
      SELECT
        :id    AS id,
        :title AS title,
        :text  AS text,
        ARRAY(:tag1, :tag2) AS tags,
        current_timestamp() AS updated_at
    ) AS s
    ON t.id = s.id
    WHEN NOT MATCHED THEN
      INSERT (id, title, text, tags, updated_at)
      VALUES (s.id, s.title, s.text, s.tags, s.updated_at)
  `;

  await executeQuery(mergeDocSql, {
    id: 'kb-001',
    title: 'Getting started with QAQ&A',
    text: 'This is a sample KB article.',
    tag1: 'intro',
    tag2: 'qaqanda',
  });

  await executeQuery(mergeDocSql, {
    id: 'kb-002',
    title: 'Playwright testing strategy',
    text: 'KB article describing the test strategy',
    tag1: 'testing',
    tag2: 'playwright',
  });

  console.warn('✅ KB docs seeded (kb-001, kb-002)');
}

// QUERIES – sample analytics
async function seedQueries() {
  const mergeQuerySql = `
    MERGE INTO workspace.qaqanda.queries AS t
    USING (
      SELECT
        :id               AS id,
        :user_id          AS user_id,
        :question         AS question,
        :answer           AS answer,
        :model            AS model,
        :latency_ms       AS latency_ms,
        :tokens_prompt    AS tokens_prompt,
        :tokens_completion AS tokens_completion,
        current_timestamp() AS created_at
    ) AS s
    ON t.id = s.id
    WHEN NOT MATCHED THEN
      INSERT (
        id,
        user_id,
        question,
        answer,
        model,
        latency_ms,
        tokens_prompt,
        tokens_completion,
        created_at
      )
      VALUES (
        s.id,
        s.user_id,
        s.question,
        s.answer,
        s.model,
        s.latency_ms,
        s.tokens_prompt,
        s.tokens_completion,
        s.created_at
      )
  `;

  await executeQuery(mergeQuerySql, {
    id: 'q-001',
    user_id: 'user-engineer-1',
    question: 'How do I run the test suite?',
    answer: 'Use pnpm test to run Playwright tests.',
    model: 'gpt-4.1-mini',
    latency_ms: 850,
    tokens_prompt: 120,
    tokens_completion: 80,
  });

  await executeQuery(mergeQuerySql, {
    id: 'q-002',
    user_id: 'user-lead-1',
    question: 'How do I seed Databricks?',
    answer: 'Use pnpm seed:databricks after configuring ENV.',
    model: 'gpt-4.1-mini',
    latency_ms: 650,
    tokens_prompt: 90,
    tokens_completion: 60,
  });

  console.warn('✅ Queries seeded (q-001, q-002)');
}

async function main() {
  if (!ENV.DATABRICKS_HOST || !ENV.DATABRICKS_TOKEN || !ENV.DATABRICKS_WAREHOUSE_ID) {
    console.error('❌ DATABRICKS_* not set. Cannot seed.');
    process.exitCode = 1;
    return;
  }

  console.warn('⏳ Applying Databricks schema...');
  await applySchema();
  console.warn('✅ Schema applied');

  console.warn('⏳ Seeding users...');
  await seedUsers();

  console.warn('⏳ Seeding KB docs...');
  await seedKbDocs();

  console.warn('⏳ Seeding queries...');
  await seedQueries();

  console.warn('🎉 Databricks seed complete');
}

main().catch((err) => {
  console.error('❌ Databricks seed failed:', err);
  process.exitCode = 1;
});
