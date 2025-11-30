# QAQ&A — Test Cases for **EP03: Databricks Integration**

---

## 📦 Scope

**In scope**

- EP03-US01 — Databricks SQL REST Client Wrapper
- EP03-US02 — KB Repository & Typed Model
- EP03-US03 — Canary Integration (real Databricks)

**Out of scope**

- UI flows
- Playwright E2E
- Ask LLM refinement
- KB editing through AI

---

# 🧩 US01 — Databricks SQL REST Client Wrapper

---

### **EP03-US01-TC01 — SELECT: Valid request maps rows**

**Type:** Unit  
**Priority:** P0  
**Automate:** Yes
**Automation:**

- Framework: Vitest (unit)
- Spec file: `tests/unit/databricksClient.spec.ts`
- Test name: `EP03-US01-TC01 — sends authenticated POST request and maps rows for SELECT`
- Command:
  ```sh
  pnpm test:unit -- -t "EP03-US01-TC01"
  ```

**Description:**  
Verify that `executeQuery` sends authenticated POST request to `/api/2.0/sql/statements` and correctly maps returned schema/rows into JS objects.

**Preconditions:**

- Mock `ENV.DATABRICKS_HOST` + `ENV.DATABRICKS_TOKEN`
- `global.fetch` → returns FINISHED schema + 2 rows

**Steps:**

1. Call:
   executeQuery(
   'SELECT id, email FROM users WHERE active = :active',
   { active: true }
   )

markdown
Copy code 2. Inspect fetch arguments 3. Inspect return value

**Expected Result:**

- URL = `${HOST}/api/2.0/sql/statements`
- Method = `POST`
- Header: `Authorization: Bearer test-token`
- Result = array of objects:
  [{ id: '1', email: 'a@b.com' }, ...]

yaml
Copy code

---

### **EP03-US01-TC02 — Param substitution escapes values**

**Type:** Unit  
**Priority:** P0  
**Automate:** Yes
**Automation:**

- Framework: Vitest (unit)
- Spec file: `tests/unit/databricksClient.spec.ts`
- Test name: `EP03-US01-TC02 — replaces named params with escaped SQL values`
- Command:
  ```sh
  pnpm test:unit -- -t "EP03-US01-TC02"
  ```

**Steps:**
buildSqlWithParams(
'SELECT \* FROM users WHERE email = :email AND active = :active',
{ email: "o'connor@test.com", active: true }
)

makefile
Copy code

**Expected:**
SELECT \* FROM users WHERE email = 'o''connor@test.com' AND active = TRUE

yaml
Copy code

---

### **EP03-US01-TC03 — Missing param throws error**

**Type:** Unit  
**Priority:** P1  
**Automate:** Yes
**Automation:**

- Framework: Vitest (unit)
- Spec file: `tests/unit/databricksClient.spec.ts`
- Test name: `EP03-US01-TC03 — throws if a param in SQL has no value provided`
- Command:
  ```sh
  pnpm test:unit -- -t "EP03-US01-TC03"
  ```

**Steps:**
buildSqlWithParams(
'SELECT \* FROM kb_docs WHERE id = :id',
{}
)

yaml
Copy code

**Expected:**

- Throws `DatabricksClientError` mentioning `:id`

---

### **EP03-US01-TC04 — Unused parameters detected**

**Type:** Unit  
**Priority:** P2  
**Automate:** Yes
**Automation:**

- Framework: Vitest (unit)
- Spec file: `tests/unit/databricksClient.spec.ts`
- Test name: `EP03-US01-TC04 — throws if there are unused params`
- Command:
  ```sh
  pnpm test:unit -- -t "EP03-US01-TC04"
  ```

**Steps:**
buildSqlWithParams(
'SELECT \* FROM kb_docs WHERE id = :id',
{ id: 1, email: 'unused@test.com' }
)

markdown
Copy code

**Expected:**

- Throws `DatabricksClientError`
- Mentions unused `:email`

---

### **EP03-US01-TC05 — Retry on 5xx then success**

**Type:** Unit  
**Priority:** P0  
**Automate:** Yes
**Automation:**

- Framework: Vitest (unit)
- Spec file: `tests/unit/databricksClient.spec.ts`
- Test name: `EP03-US01-TC05 — retries on 5xx and eventually succeeds`
- Command:
  ```sh
  pnpm test:unit -- -t "EP03-US01-TC05"
  ```

**Preconditions:**

- `fetch`:
  - Call #1 → 500
  - Call #2 → 200 OK

**Steps:**
executeQuery(
'SELECT COUNT(\*) as count FROM kb_docs',
{},
{ maxRetries: 2 }
)

markdown
Copy code

**Expected:**

- fetch called at least 2×
- return `[ { count: 42 } ]`

---

### **EP03-US01-TC06 — Timeout triggers retry then error**

**Type:** Unit  
**Priority:** P0  
**Automate:** Yes
**Automation:**

- Framework: Vitest (unit)
- Spec file: `tests/unit/databricksClient.spec.ts`
- Test name: `EP03-US01-TC06 — throws DatabricksTimeoutError on timeout and respects retries`
- Command:
  ```sh
  pnpm test:unit -- -t "EP03-US01-TC06"
  ```

**Preconditions:**

- `fetch` rejects AbortError every call

**Steps:**
executeQuery(
'SELECT 1',
{},
{ timeoutMs: 10, maxRetries: 1 }
)

markdown
Copy code

**Expected:**

- fetch called twice (1+retry)
- throws `DatabricksTimeoutError`

---

### **EP03-US01-TC07 — Non-5xx error fails immediately**

**Type:** Unit  
**Priority:** P0  
**Automate:** Yes
**Automation:**

- Framework: Vitest (unit)
- Spec file: `tests/unit/databricksClient.spec.ts`
- Test name: `EP03-US01-TC07 — throws DatabricksClientError on non-5xx failure`
- Command:
  ```sh
  pnpm test:unit -- -t "EP03-US01-TC07"
  ```

**Preconditions:**

- `fetch` → 400 + text “Bad request”

**Steps:**
executeQuery('SELECT 1')

markdown
Copy code

**Expected:**

- 1 call
- throws `DatabricksClientError`
- status=400
- error contains “Bad request”

---

### **EP03-US01-TC08 — Statements without result return []**

**Type:** Unit  
**Priority:** P1  
**Automate:** Yes
**Automation:**

- Framework: Vitest (unit)
- Spec file: `tests/unit/databricksClient.spec.ts`
- Test name: `EP03-US01-TC08 — returns empty array for statements without result set (e.g. INSERT)`
- Command:
  ```sh
  pnpm test:unit -- -t "EP03-US01-TC08"
  ```

**Preconditions:**

- fetch returns EMPTY result + FINISHED

**Steps:**
executeQuery(
'INSERT INTO kb_docs (id,title) VALUES (1,:title)',
{ title: 'Hello' }
)

markdown
Copy code

**Expected:**

- returns `[]`

---

### **EP03-US01-TC09 — Missing ENV config fails fast**

**Type:** Unit  
**Priority:** P0  
**Automate:** Yes
**Automation:**

- Framework: Vitest (unit)
- Spec file: `tests/unit/databricksClient.spec.ts`
- Test name: `EP03-US01-TC09 — fails fast when ENV is missing Databricks config`
- Command:
  ```sh
  pnpm test:unit -- -t "EP03-US01-TC09"
  ```

**Preconditions:**

- Mock `ENV` missing HOST/TOKEN

**Steps:**
executeQuery('SELECT 1')

yaml
Copy code

**Expected:**

- fetch NOT called
- throws `DatabricksClientError`
- message = “environment not configured” (or equivalent)

---

## US02 — Schema Definition & Seed Verification (Integration)

Validates that the Databricks schema exists, seed data is inserted correctly, and that the Databricks SQL REST client (EP03-US01) can query the live Warehouse.

---

### EP03-US02-TC01 — Users seed contains admin@example.com and user@example.com

**Type:** Integration  
**Priority:** P0  
**Automated:** Yes

**Automation:**

- Framework: Vitest (integration config)
- Spec file: tests/integration/seedDatabricks.spec.ts
- Test name: EP03-US02-TC01 — users seed contains admin@example.com and user@example.com
- Command: pnpm test:db

**Preconditions:**

- Environment variables available:  
  DATABRICKS_HOST  
  DATABRICKS_TOKEN  
  DATABRICKS_WAREHOUSE_ID
- Table workspace.qaqanda.users exists
- Seed script scripts/seedDatabricks.ts has inserted admin@example.com and user@example.com

**Steps:**

1. Execute SQL:  
   SELECT COUNT(\*) AS count  
   FROM workspace.qaqanda.users  
   WHERE email IN (:leadEmail, :engineerEmail)
2. Bind parameters:  
   leadEmail = "admin@example.com"  
   engineerEmail = "user@example.com"
3. Parse numeric result from REST response using getCountFromRows helper

**Expected Result:**

- HTTP 200
- Exactly one row returned
- count >= 2

**Notes:**  
Confirms baseline RBAC accounts are present in the actual Warehouse.  
EP02 authentication tests operate on persistent data rather than mocks.

---

### EP03-US02-TC02 — KB seed contains at least two knowledge base documents

**Type:** Integration  
**Priority:** P1  
**Automated:** Yes

**Automation:**

- Framework: Vitest
- Spec file: tests/integration/seedDatabricks.spec.ts
- Test name: EP03-US02-TC02 — kb_docs seed contains two KB docs

**Preconditions:**

- Databricks connectivity operational
- Table workspace.qaqanda.kb_docs exists
- Seed script inserts documents:  
  kb-001  
  kb-002

**Steps:**

1. Execute SQL:  
   SELECT COUNT(\*) AS count  
   FROM workspace.qaqanda.kb_docs  
   WHERE id IN (:doc1, :doc2)
2. Bind parameters:  
   doc1 = "kb-001"  
   doc2 = "kb-002"
3. Parse numeric result with getCountFromRows

**Expected Result:**

- HTTP 200
- count >= 2

**Notes:**  
Confirms knowledge base is initialized.  
Provides deterministic fixtures for:

- EP03-US03 repository layer
- EP04 ask/retrieval engine
- EP05 knowledge UI

---

### EP03-US02-TC03 — Queries seed contains sample queries

**Type:** Integration  
**Priority:** P2  
**Automated:** Yes

**Automation:**

- Framework: Vitest
- Spec file: tests/integration/seedDatabricks.spec.ts
- Test name: EP03-US02-TC03 — queries seed contains sample queries

**Preconditions:**

- Databricks connectivity operational
- Table workspace.qaqanda.queries exists
- Seed script inserts sample queries:  
  q-001  
  q-002

**Steps:**

1. Execute SQL:  
   SELECT COUNT(\*) AS count  
   FROM workspace.qaqanda.queries  
   WHERE id IN (:q1, :q2)
2. Bind parameters:  
   q1 = "q-001"  
   q2 = "q-002"
3. Parse numeric result with getCountFromRows

**Expected Result:**

- HTTP 200
- count >= 2

**Notes:**  
Validates that the analytics domain has baseline sample rows.  
Provides a stable data source for upcoming reporting (EP06).

---

### Environment Safeguards

These tests automatically skip if Databricks credentials are not configured.  
Condition in code:

- ENV.DATABRICKS_HOST must be non-empty
- ENV.DATABRICKS_TOKEN must be non-empty
- ENV.DATABRICKS_WAREHOUSE_ID must be non-empty

If the condition is not met, the entire test suite for EP03-US02 is skipped.  
This prevents CI failures when Databricks is unavailable.

## US03 — Database Access Layer Modules (Unit / Contract)

Validates that each domain (Users, Knowledge Base, Queries) has its own repository module,
all queries go through the Databricks client wrapper, results are typed, and no raw/unsafe SQL is used.

Modules under test:

- lib/db.users.ts
- lib/db.kb.ts
- lib/db.queries.ts

Databricks client is always mocked.

---

### EP03-US03-TC01 — Users.getByEmail returns typed user or null

Type: Unit / Contract  
Priority: P0  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/unit/db.users.spec.ts
- Test name: EP03-US03-TC01 — getByEmail returns typed user or null

Preconditions:

- Mock executeQuery to return:  
  case A: one user row with id, email, password_hash, role, created_at  
  case B: empty array

Steps:

1. Call getByEmail("user@example.com") in case A
2. Call getByEmail("missing@example.com") in case B

Expected Result:

- Case A:
  - executeQuery called once with SQL containing "FROM users WHERE email = :email"
  - Params contain email: "user@example.com"
  - Return value is a typed user object (id, email, role, createdAt)
- Case B:
  - Returns null
  - No exceptions thrown

Notes:  
Confirms basic READ behavior and mapping for Users repository.

---

### EP03-US03-TC02 — Users.create inserts user via parameterized SQL and returns new id

Type: Unit / Contract  
Priority: P0  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/unit/db.users.spec.ts
- Test name: EP03-US03-TC02 — create inserts user and returns id

Preconditions:

- Mock executeQuery to return a single row with generated id (for example: "u-123")

Steps:

1. Call create({ email, passwordHash, role })

Expected Result:

- executeQuery called once with SQL that:
  - References users table
  - Uses named parameters (:email, :passwordHash, :role)
  - Does not interpolate email/password directly in the SQL string
- Params object includes the same values passed into create
- Function returns new user id as string

Notes:  
Covers CREATE behavior and enforces parameterized SQL (no string concatenation).

---

### EP03-US03-TC03 — Users.listAll returns array of typed users

Type: Unit / Contract  
Priority: P1  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/unit/db.users.spec.ts
- Test name: EP03-US03-TC03 — listAll returns array of typed users

Preconditions:

- Mock executeQuery to return multiple user rows

Steps:

1. Call listAll()

Expected Result:

- executeQuery called with SQL that selects from users table
- Returned value is an array of user objects (not raw rows)
- Each item has the expected shape: id, email, role, createdAt

Notes:  
This test prepares for later admin-only listing; auth not checked here, only data mapping.

---

### EP03-US03-TC04 — KB.getById returns typed KB doc or null

Type: Unit / Contract  
Priority: P0  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/unit/db.kb.spec.ts
- Test name: EP03-US03-TC04 — getById returns typed KB doc or null

Preconditions:

- Mock executeQuery:  
  case A: single row for id "kb-001"  
  case B: empty array

Steps:

1. Call getById("kb-001") in case A
2. Call getById("kb-missing") in case B

Expected Result:

- SQL uses "FROM kb_docs WHERE id = :id" and parameter :id
- Case A: returns object with id, title, text, tags, updatedAt
- Case B: returns null

Notes:  
Ensures the KB repository correctly maps Databricks rows to the KB doc model.

---

### EP03-US03-TC05 — KB.addDoc inserts doc and returns new id

Type: Unit / Contract  
Priority: P0  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/unit/db.kb.spec.ts
- Test name: EP03-US03-TC05 — addDoc uses parameterized INSERT and returns id

Preconditions:

- Mock executeQuery to behave as INSERT returning new id

Steps:

1. Call addDoc("Title", "Text", ["tag1", "tag2"])

Expected Result:

- executeQuery called once with SQL that:
  - Inserts into kb_docs
  - Uses parameters for title, text, tags
- No raw string concatenation of title/text in SQL
- Return value is new KB document id

Notes:  
Verifies CREATE path and param handling for tags (array).

---

### EP03-US03-TC06 — KB.updateDoc updates text using parameterized SQL

Type: Unit / Contract  
Priority: P1  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/unit/db.kb.spec.ts
- Test name: EP03-US03-TC06 — updateDoc uses parameterized UPDATE

Preconditions:

- Mock executeQuery to confirm it was called, return empty array or affected row count

Steps:

1. Call updateDoc("kb-001", "New content")

Expected Result:

- executeQuery called with UPDATE statement on kb_docs
- SQL includes WHERE id = :id and SET text = :text (or equivalent)
- No direct interpolation of id or text into the SQL string
- No exceptions for valid input

Notes:  
Ensures UPDATE uses named parameters and does not leak content into logs or error messages.

---

### EP03-US03-TC07 — KB.listAll returns typed array of KB docs

Type: Unit / Contract  
Priority: P1  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/unit/db.kb.spec.ts
- Test name: EP03-US03-TC07 — listAll returns typed KB docs

Preconditions:

- Mock executeQuery to return multiple KB rows

Steps:

1. Call listAll()

Expected Result:

- executeQuery selects from kb_docs
- Function returns array of typed KB docs
- No raw Databricks rows leaked upward

Notes:  
Establishes KB repository as the single mapping layer between SQL and domain objects.

---

### EP03-US03-TC08 — Queries.insertQuery logs question and latency via paramized INSERT

Type: Unit / Contract  
Priority: P0  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/unit/db.queries.spec.ts
- Test name: EP03-US03-TC08 — insertQuery uses parameterized INSERT

Preconditions:

- Mock executeQuery

Steps:

1. Call insertQuery("user-123", "How to reset password?", 150)

Expected Result:

- executeQuery called with INSERT into queries
- SQL uses parameters (:userId, :question, :latencyMs or equivalent)
- question is not interpolated directly into SQL string
- Function resolves successfully, no return value needed or returns new id if designed so

Notes:  
Confirms logging uses safe parameterization and supports later analytics.

---

### EP03-US03-TC09 — Queries.getRecentByUser returns recent queries in correct order

Type: Unit / Contract  
Priority: P1  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/unit/db.queries.spec.ts
- Test name: EP03-US03-TC09 — getRecentByUser returns recent queries

Preconditions:

- Mock executeQuery to return multiple query rows with different created_at timestamps

Steps:

1. Call getRecentByUser("user-123")

Expected Result:

- SQL includes WHERE user_id = :userId
- SQL includes ORDER BY created_at DESC (or another defined ordering)
- Returned array is typed (id, userId, question, latencyMs, createdAt)
- Order in returned array matches expected ordering

Notes:  
Supports later EP06 reporting and EP04 ask history features.

---

### EP03-US03-TC10 — Repository functions do not log sensitive data or raw SQL

Type: Unit / Contract  
Priority: P0  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/unit/db.users.spec.ts (or dedicated logging spec)
- Test name: EP03-US03-TC10 — repositories do not log sensitive data

Preconditions:

- Mock logger (for example console or custom logger)
- Mock executeQuery to throw a DatabricksClientError

Steps:

1. Trigger a repository method (for example create or insertQuery) that causes executeQuery to throw
2. Assert how logging is performed

Expected Result:

- Error is propagated or wrapped without logging full SQL statement or raw secrets
- Log messages (if any) contain high-level error info only (for example "DB error" and error code)
- No email, password hash, token, or full SQL text appears in logged output

Notes:  
Enforces acceptance criteria “No sensitive logs or unescaped SQL” from the user story.

## US04 — Canary Integration (Live Databricks Validation)

Validates that the live Databricks SQL Warehouse is reachable, the schema is stable, CRUD works end-to-end on real data, and permissions are correctly enforced for read-only vs read-write credentials.

Module under test:

- tests/integration/databricks.canary.spec.ts

These tests are tagged and must NOT run on every PR.

---

### EP03-US04-TC01 — Canary CRUD: INSERT → SELECT → UPDATE → SELECT

Type: Integration (Canary)  
Priority: P0  
Automated: Yes

Automation:

- Framework: Vitest (integration / canary config)
- Spec file: tests/integration/databricks.canary.spec.ts
- Test name: EP03-US04-TC01 — canary CRUD round trip
- Command: pnpm test:canary (or dedicated canary script)

Preconditions:

- DEV or STAGING Databricks Warehouse available
- Environment variables set for RW credentials:  
  DATABRICKS_HOST  
  DATABRICKS_TOKEN  
  DATABRICKS_WAREHOUSE_ID
- Table workspace.qaqanda.kb_docs exists
- No hard dependency on specific existing rows (test uses its own temporary id)

Steps:

1. Generate unique KB id (for example kb-canary-<timestamp>)
2. INSERT KB doc with that id, title, text, tags
3. SELECT the same id and assert row exists
4. UPDATE the doc (change title and/or text)
5. SELECT again and assert updated values returned

Expected Result:

- All operations succeed (HTTP 200 from Databricks API)
- First SELECT returns exactly one row with original title/text/tags
- Second SELECT returns exactly one row with updated title/text, unchanged id
- No unexpected errors, timeouts, or schema mismatches during the flow

Notes:  
Core canary to validate live CRUD against the Warehouse.  
If this fails, later epics depending on KB data must be blocked.

---

### EP03-US04-TC02 — Canary Permissions: RO credentials cannot mutate

Type: Integration (Canary)  
Priority: P0  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/integration/databricks.canary.spec.ts
- Test name: EP03-US04-TC02 — read-only credentials fail on INSERT/UPDATE

Preconditions:

- RO Databricks credentials available (read-only token or workspace user)
- Environment variables set for RO config (for example DATABRICKS_TOKEN_RO)
- Same Warehouse and schema as RW canary

Steps:

1. Configure Databricks client to use RO credentials
2. Attempt INSERT on workspace.qaqanda.kb_docs
3. Attempt UPDATE on workspace.qaqanda.kb_docs
4. Optionally perform SELECT to confirm RO can still read

Expected Result:

- INSERT fails with permission-related error (access denied, insufficient privileges, or equivalent)
- UPDATE fails with similar permission error
- SELECT using RO credentials succeeds (if executed)
- Tests explicitly assert that mutations with RO credentials do not succeed

Notes:  
Proves that DB permissions are configured correctly and repository layer cannot accidentally write with read-only accounts.

---

### EP03-US04-TC03 — Schema Drift: columns and types match expectation

Type: Integration (Canary)  
Priority: P0  
Automated: Yes

Automation:

- Framework: Vitest
- Spec file: tests/integration/databricks.canary.spec.ts
- Test name: EP03-US04-TC03 — schema drift detection for kb_docs

Preconditions:

- RW Databricks credentials configured
- workspace.qaqanda.kb_docs table exists

Steps:

1. Execute a limited SELECT on kb_docs (for example one row or SELECT \* WITH LIMIT 1)
2. Inspect returned column metadata or row keys
3. Compare actual keys and expected keys, such as:  
   id, title, text, tags, created_at, updated_at
4. Optionally validate simple type expectations (strings vs numeric vs array-like)

Expected Result:

- All expected columns are present
- No unexpected extra columns if you decide to treat them as breaking
- Column types are compatible with repository expectations (for example id/title/text as string)
- If any required column is missing or renamed, test fails with clear message

Notes:  
Primary early-warning system for schema changes that would break repository mapping and higher epics.

---

### EP03-US04-TC04 — Canary tagging and environment isolation

Type: Process / Config  
Priority: P0  
Automated: Partially

Automation:

- Framework: Vitest configuration + CI config
- Spec file: tests/integration/databricks.canary.spec.ts
- Tagging: @canary (or similar pattern)

Preconditions:

- Vitest or test runner supports grep/tag patterns
- CI pipeline for PRs configured separately from canary pipeline

Steps:

1. Mark all canary tests (for example with @canary in test titles or describe block)
2. Configure canary test command (for example pnpm test:canary) to only run @canary tests
3. Configure PR CI job to run standard test suite without @canary tests
4. Configure a separate pipeline/job (manual or scheduled) that runs pnpm test:canary against DEV/STAGING

Expected Result:

- PR CI runs do not execute canary tests
- Canary suite runs only when explicitly triggered (or on schedule)
- When canary job fails, build is marked as failed and must be investigated before release

Notes:  
Enforces acceptance criteria that canary tests do not slow down or break normal PR validation, but still block unsafe releases when the live Warehouse is not healthy.

---

### EP03-US04-TC05 — Canary failure blocks release

Type: Process / Pipeline  
Priority: P0  
Automated: Yes

Automation:

- Tooling: CI system (GitHub Actions, Azure DevOps, etc.)
- Job: staging_release or preprod_gate

Preconditions:

- Release pipeline includes a step to run pnpm test:canary against the target environment

Steps:

1. Trigger staging/preprod release pipeline
2. Ensure pipeline step executes canary test suite
3. Intentionally break canary preconditions in a safe way (for example change env var or use invalid token) to simulate failure
4. Observe pipeline result

Expected Result:

- When canary tests pass, release pipeline continues
- When canary tests fail, pipeline is marked as failed or blocked
- No deployment to staging/production occurs while canary is red

Notes:  
This test case can be documented with one-time evidence (screenshots/logs) rather than being executed frequently. It proves that canary truly acts as a release gate, not just a “nice-to-have” test.

---

# 📊 Summary

| US   | Cases | Automated | Notes                            |
| ---- | ----- | --------- | -------------------------------- |
| US01 | 9     | 9         | Core Databricks client logic     |
| US02 | 3     | 3         | Schema & seed verification       |
| US03 | 10    | 10        | Full repository CRUD contract    |
| US04 | 5     | 4         | Canary integration & permissions |

**Total:** 27 test cases  
**Automation coverage:** 26/27 (96.3%)

---
