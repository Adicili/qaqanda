# EP03 — Databricks Integration

## Epic Description
This epic focuses on integrating QAQ&A with **Databricks SQL Warehouse** as the persistent data layer.  
It includes creating a type-safe SQL client wrapper, defining initial schemas, seeding default data, and establishing the data access layer for users, knowledge base, and query logs.

Databricks will serve as the single source of truth for user accounts, knowledge base documents, and query/audit logs.

### Epic Completion Criteria
- Databricks connection tested and verified
- Schema for all initial tables created
- Seed script populates default users and KB data
- Data access modules (`lib/db.*`) implemented
- Unit and integration tests for DB access pass successfully

---

## EP03-US01 — Databricks SQL REST Client Wrapper (3 pts)

### Description
As a backend engineer, I need a reusable, safe wrapper for executing SQL queries through the Databricks REST API so that the app can communicate with the database reliably.

### Acceptance Criteria
- Wrapper sends authenticated REST requests to `/api/2.0/sql/statements`
- Supports SELECT and INSERT/UPDATE/DELETE statements
- Implements request timeout and retry logic
- Prevents SQL injection by using parameterized queries
- Handles JSON response parsing and maps to typed results

### Tasks
- **EP03-US01-T01 — Create `lib/databricksClient.ts`**
  1. Implement `executeQuery(sql: string, params?: Record<string, any>)`
  2. Use fetch or axios with `DATABRICKS_HOST` and `DATABRICKS_TOKEN`
  3. Include retries for transient 5xx errors
  4. Handle timeout errors gracefully

- **EP03-US01-T02 — Add parameter substitution helper**
  - Prevent direct string interpolation  
  - Replace tokens safely (e.g. `:email` → escaped param)  

- **EP03-US01-T03 — Add integration tests (mock HTTP)**
  - Simulate successful SELECT + INSERT
  - Simulate timeout and ensure retry logic works
  - Validate SQL parameters are sanitized  

### Deliverables
```
lib/databricksClient.ts
tests/unit/databricksClient.spec.ts
```

---

## EP03-US02 — Schema Definition & Seed Data (3 pts)

### Description
As a backend engineer, I need the Databricks database schema and seed scripts so the application has structured, ready-to-use tables for users, knowledge base, and queries.

### Acceptance Criteria
- Schema covers `users`, `kb_docs`, `queries`, and `kb_audit`
- Seed script inserts default roles and test data
- Tables created if not exist (idempotent)
- Seeded data verified via Databricks REST client

### Tasks
- **EP03-US02-T01 — Define `schema.sql`**
  - Tables:
    - `users(id, email, password_hash, role, created_at)`
    - `kb_docs(id, title, text, tags, updated_at)`
    - `queries(id, user_id, question, latency_ms, created_at)`
    - `kb_audit(id, doc_id, user_id, change_type, diff, created_at)`
  - Define correct types (`STRING`, `ARRAY<STRING>`, `TIMESTAMP`)

- **EP03-US02-T02 — Create seed script**
  - File: `scripts/seedDatabricks.ts`
  - Inserts:
    - Lead user (admin@example.com)
    - Engineer user (user@example.com)
    - 2 KB docs for testing

- **EP03-US02-T03 — Add test to verify DB connectivity**
  - Execute SELECT count(*) queries
  - Validate inserted seed data  

### Deliverables
```
schema.sql
scripts/seedDatabricks.ts
tests/integration/seedDatabricks.spec.ts
```

---

## EP03-US03 — Database Access Layer Modules (3 pts)

### Description
As a developer, I need modularized database access files to handle CRUD operations for users, KB documents, and queries in a reusable, testable way.

### Acceptance Criteria
- Each domain has its own module (`lib/db.users.ts`, etc.)
- All queries use the Databricks client wrapper
- Methods return typed results (no raw strings)
- Unit tests for all CRUD operations
- No sensitive logs or unescaped SQL

### Tasks
- **EP03-US03-T01 — Implement Users module**
  - `getByEmail(email: string)`  
  - `create(user)` (insert + return new id)  
  - `listAll()` (admin only later)

- **EP03-US03-T02 — Implement Knowledge Base module**
  - `getById(id: string)`  
  - `addDoc(title, text, tags)`  
  - `updateDoc(id, newText)`  
  - `listAll()`  

- **EP03-US03-T03 — Implement Query Log module**
  - `insertQuery(userId, question, latency)`  
  - `getRecentByUser(userId)`  

- **EP03-US03-T04 — Write contract tests for each module**
  - Mock Databricks client  
  - Validate return shape and SQL correctness  

### Deliverables
```
lib/db.users.ts
lib/db.kb.ts
lib/db.queries.ts
tests/unit/db.users.spec.ts
tests/unit/db.kb.spec.ts
tests/unit/db.queries.spec.ts
```

---

## ✅ EP03 Epic Done When
- Databricks connection tested successfully
- Schema + seed data deployed
- Access layer implemented and covered by tests
- No SQL injection risk or unescaped parameters
- Data layer supports all auth and KB operations
