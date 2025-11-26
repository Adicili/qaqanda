-- schema.sql

-- Users table: logical app users (not necessarily Databricks identities)
CREATE TABLE IF NOT EXISTS users (
  id STRING,
  email STRING,
  password_hash STRING,
  role STRING,
  created_at TIMESTAMP DEFAULT current_timestamp()
);

-- Knowledge base documents
CREATE TABLE IF NOT EXISTS kb_docs (
  id STRING,
  title STRING,
  text STRING,
  tags ARRAY<STRING>,
  updated_at TIMESTAMP DEFAULT current_timestamp()
);

-- Queries made by users against the KB / Ask engine
CREATE TABLE IF NOT EXISTS queries (
  id STRING,
  user_id STRING,
  question STRING,
  latency_ms BIGINT,
  created_at TIMESTAMP DEFAULT current_timestamp()
);

-- Audit log for KB changes (who changed what)
CREATE TABLE IF NOT EXISTS kb_audit (
  id STRING,
  doc_id STRING,
  user_id STRING,
  change_type STRING,
  diff STRING,
  created_at TIMESTAMP DEFAULT current_timestamp()
);
