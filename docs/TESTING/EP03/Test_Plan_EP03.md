# QAQ&A — Test Plan for EP03: Databricks Integration

## 1. Overview

EP03 focuses on backend integration with the **Databricks SQL Warehouse REST API**.  
The goal is to ensure reliable, secure, and typed communication with the database, with no raw SQL interpolation and no real network effects in unit testing.

This plan defines testing scope, methods, entry criteria, risks, automation approach, and execution strategy.

---

## 2. Objectives

- Validate that **DatabricksClient**:
  - Sends authenticated HTTP requests to Databricks
  - Supports SELECT and non-SELECT statements
  - Implements retry + timeout logic correctly
  - Prevents SQL injection through parameter substitution
  - Maps JSON responses to typed objects

- Validate **KB Repository Layer (EP03-US02)**:
  - Uses DatabricksClient as the **only** data access layer
  - Uses parameterized SQL
  - Returns strongly typed values (`KBArticle`, `KBArticle[]`)
  - Handles “no results” → null or empty arrays

- Validate minimum **canary integration** with real Databricks instance.

---

## 3. In Scope

- `src/lib/databricksClient.ts`
- `src/lib/db/kb.ts` (typed adapter / repository)
- Unit tests for:
  - param substitution logic
  - request authentication
  - retry logic
  - timeout logic
- Integration tests (tagged) for dev Databricks

---

## 4. Out of Scope

- UI flows
- Playwright E2E tests
- AskEngine / Retrieval semantics
- OpenAI / LLM prompt integration
- Workspace and infrastructure provisioning
- Large data ingestion pipelines

---

## 5. Test Levels & Approach

### 5.1 Unit Testing

- Framework: **Vitest**
- Components under test:
  - `buildSqlWithParams`
  - `executeQuery`
  - `DatabricksClientError` / `DatabricksTimeoutError`
- **No real network**:
  - `global.fetch` → mocked
  - `ENV` module → mocked
- Goal: deterministic logic coverage.

---

### 5.2 Component Testing (Repository Layer)

- Test the typed repository API directly:
  - `getArticleById`
  - `listArticles`
  - `insertArticle`
- DatabricksClient is **mocked** (stubbed)
- Focus on domain mapping + SQL patterns
- Do not re-test HTTP transport layer.

---

### 5.3 Integration Testing (Canary)

- Executed in **dev/staging env only**
- With real Databricks credentials
- Use minimal test queries:
  - `SELECT 1`
  - `listArticles()`
- **Not executed on every PR**

---

## 6. Test Types

### 6.1 Functional

- Validate expected values and types
- SELECT → list of objects
- Non-SELECT → empty array

### 6.2 Error Handling

- AbortError → retry until max → timeout exception
- 5xx → retry until success or abort
- 4xx → immediate error (no retry)

### 6.3 Security / SQL Injection

- `'` → escaped as `''`
- Boolean → `TRUE/FALSE`
- Null → `NULL`
- Missing SQL param → error
- Extra SQL param → error

### 6.4 Configuration

- If ENV invalid → fail fast
- No HTTP request should be sent

---

## 7. Test Data

### 7.1 Mock Data (Unit)

- Dummy host/token values
- Generic dataset:
  schema: ["id","title"]
  rows: [["1","Hello"]]

yaml
Copy code

### 7.2 Real Data (Integration)

- Minimal dev dataset
- 1 KB article in `kb_docs`
- `SELECT 1` for connectivity

---

## 8. Automation Strategy

- **Vitest is the primary test platform for EP03**
- All core EP03 scenarios are automated (US01 + US02)
- Canary tests are **isolated** and **tagged**

**Goal:** 100% logic coverage for DatabricksClient + repository layer

---

## 9. Tools

- **Vitest** (unit + component)
- **fetch mocking via vi.fn()**
- **TypeScript** for typed models
- **tsx / ts-node** if needed

---

## 10. Entry Criteria

- `databricksClient.ts` implemented
- `buildSqlWithParams` implemented
- Custom error classes implemented
- Repository layer API defined

---

## 11. Exit Criteria

- All unit tests PASS
- Retry and timeout logic covered
- Non-SELECT behavior validated
- ENV misconfig → immediate failure
- Repository uses DatabricksClient exclusively
- Canary SELECT 1 PASS in dev

---

## 12. Risks

- Over-reliance on mocks → real API mismatch
- Databricks API schema changes
- Timeout / retry calibration issues

**Mitigation:**

- Canary tests
- Strict mapping logic
- Fail-fast ENV validation

---

## 13. Test Execution

- Local: `pnpm test:unit`
- Dev work: `pnpm test:unit:watch`
- Canary: `pnpm test:unit --filter @canary`

---

## 14. Reporting

- Vitest output as primary source
- Github Actions logs
- Optional: `Test_Report_EP03.md`
