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

# 🧩 US02 — KB Repository Layer

---

### **EP03-US02-TC01 — getArticleById returns typed KBArticle**

**Type:** Unit / Component  
**Priority:** P0  
**Automate:** Yes

**Preconditions:**

- mock `executeQuery` to return 1 valid row

**Steps:**
getArticleById('kb-123')

markdown
Copy code

**Expected:**

- executeQuery called with:
  SELECT ... WHERE id = :id

markdown
Copy code

- returns `KBArticle`
- if no rows → returns `null`

---

### **EP03-US02-TC02 — listArticles returns sorted list**

**Type:** Unit / Component  
**Priority:** P1  
**Automate:** Yes

**Preconditions:**

- mock `executeQuery` with >1 rows, different created_at

**Steps:**
listArticles()

markdown
Copy code

**Expected:**

- SQL includes `ORDER BY created_at DESC`
- returned array sorted DESC

---

### **EP03-US02-TC03 — insertArticle uses paramized INSERT**

**Type:** Unit / Component  
**Priority:** P0  
**Automate:** Yes

**Preconditions:**

- mock `executeQuery`

**Steps:**
insertArticle({ title, text, tags })

yaml
Copy code

**Expected:**

- SQL uses `:title`,`:text`,`:tags`
- 1 call
- no exceptions

---

# 🧩 US03 — Canary Integration (real Databricks)

> Ovi testovi se NE izvršavaju u CI na PR-ovima.  
> Tag `@canary`. Pokreću se ručno na staging/dev.

---

### **EP03-US03-TC01 — SELECT 1 connectivity**

**Type:** Integration  
**Priority:** P1  
**Automate:** Yes (conditionally)

**Steps:**
executeQuery('SELECT 1 as value')

yaml
Copy code

**Expected:**

- returns `[ { value: 1 } ]`
- no exceptions

---

### **EP03-US03-TC02 — listArticles returns ≥ 1**

**Type:** Integration  
**Priority:** P2  
**Automate:** Yes (conditionally)

**Steps:**
listArticles()

yaml
Copy code

**Expected:**

- returns array length ≥ 1

---

# 📊 Summary

| US   | Cases | Automated | Notes             |
| ---- | ----- | --------- | ----------------- |
| US01 | 9     | 9         | Core client logic |
| US02 | 3     | 3         | Domain repository |
| US03 | 2     | 2         | Canary only       |

**Total:** 14 test cases  
**Automation:** 100% planned

---
