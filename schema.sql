-- 1) Catalog / schema (Unity Catalog)
CREATE SCHEMA IF NOT EXISTS workspace.qaqanda;

-- 2) USERS
CREATE TABLE IF NOT EXISTS workspace.qaqanda.users (
  id STRING NOT NULL,
  email STRING NOT NULL,
  password_hash STRING NOT NULL,
  role STRING NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- 3) KB_DOCS
CREATE TABLE IF NOT EXISTS workspace.qaqanda.kb_docs (
  id STRING NOT NULL,
  title STRING NOT NULL,
  text STRING NOT NULL,
  tags ARRAY<STRING>,
  updated_at TIMESTAMP NOT NULL
);

-- 4) QUERIES - ANALITIKA / LOGGING
CREATE TABLE IF NOT EXISTS workspace.qaqanda.queries (
  id STRING NOT NULL,          -- npr. UUID v4
  user_id STRING,              -- može NULL za anon / system
  question STRING NOT NULL,
  answer STRING,               -- ceo odgovor (ili skraćen)
  model STRING,                -- npr. 'gpt-4.1-mini'
  latency_ms BIGINT,           -- round-trip latency
  tokens_prompt BIGINT,
  tokens_completion BIGINT,
  created_at TIMESTAMP NOT NULL
);
