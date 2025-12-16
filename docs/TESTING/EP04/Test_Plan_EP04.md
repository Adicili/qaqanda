# QAQ&A — Test Plan for **EP04: Ask & Retrieval Engine**

## 1) Objective

Validate the core Ask & Retrieval flow end-to-end:

- TF-IDF retrieval returns deterministic, relevant results.
- `/api/ask` correctly validates input, enforces authentication, and logs queries.
- Ask UI (`/`) lets an authenticated user ask a question and see answer + context with proper UX and error handling.

---

## 2) Scope

**In scope (EP04-US01..US03):**

- `lib/retrieval.ts` (TF-IDF engine)
- `/api/ask` endpoint:
  - Input validation (Zod)
  - Auth enforcement (401 on missing session)
  - Logging to `queries` table
  - Latency measurement
- Ask UI page (`/`):
  - Question form
  - Loading state
  - Answer + context rendering
  - Error messages (validation + server errors)
- Tests:
  - Unit tests for retrieval
  - API tests for `/api/ask`
  - UI tests for Ask page (Playwright)

**Out of scope:**

- Registration/login internals (EP02) — used as preconditions only.
- Databricks connectivity details (EP03) — can be mocked or in-memory.
- KB management flows (EP05).
- Reports & analytics (EP06).
- LLM answer generation (EP09) — answer is simple top-doc based stub in EP04.

---

## 3) Approach

Combination of unit, API, and UI tests:

- **Unit tests (US01 — Retrieval)**
  - Framework: Vitest
  - Directly test `tokenize`, TF-IDF calculations, and `rankDocuments` behavior.
  - Determinism, case-insensitivity, stopwords, edge cases.

- **API tests (US02 — /api/ask)**
  - Framework: Playwright API tests
  - Validate:
    - 200 happy path (authenticated)
    - 400 on invalid question
    - 401 when unauthenticated
    - Graceful behavior when KB is empty
    - Latency measurement present
    - Query logged via `db.queries` (stub verification or real dev DB)

- **UI tests (US03 — Ask page)**
  - Framework: Playwright UI tests
  - Validate:
    - Ask form UX
    - Loading state
    - Answer + context rendering
    - Client-side validation
    - Error banners on 4xx/5xx from `/api/ask`
    - Auth guard (redirect to `/login` when unauthenticated)

All tests are fully automated; no manual-only coverage planned.

---

## 4) Environment

- Runtime: Node 20.x
- Framework: Next.js 14 (App Router)
- App: QAQ&A (auth, KB, queries repositories present)
- Test frameworks:
  - Vitest (unit)
  - Playwright (API + UI)
- Data layer:
  - Databricks SQL Warehouse via `databricksClient` **or** in-memory fallback
- Browsers: Playwright (Chromium as primary; Firefox/WebKit optional)
- OS: Win/macOS/Linux

Test users (re-use EP02 data):

| Email                | Password  | Role     |
| -------------------- | --------- | -------- |
| engineer@example.com | Passw0rd! | ENGINEER |
| lead@example.com     | Passw0rd! | LEAD     |

---

## 5) Entry / Exit Criteria

### Entry

- EP01 foundation (tooling, Playwright base) completed.
- EP02 auth + middleware implemented and passing:
  - `/login`, `/register`
  - session cookie
  - auth guard for `/` and `/api/ask`.
- EP03 repositories implemented:
  - `db.kb.listAll()`
  - `db.queries.insertQuery()`
- Basic KB data available (seeded or in-memory) for happy path tests.

### Exit

- All EP04 scenarios (US01–US03) below covered by passing automated tests.
- No open blocker or critical bugs related to Ask flow.
- Retrieval behavior confirmed deterministic.
- `/api/ask` validated for auth, validation, logging, and error handling.
- Ask UI usable and accessible for the main flow.

---

## 6) Scenarios to Cover (high-level)

### US01 — TF-IDF Retrieval Service

1. **Tokenization handles case + punctuation**
   - Lowercases text.
   - Strips punctuation.
   - Splits on whitespace.

2. **Optional stopword removal**
   - With stopwords: removes configured tokens.
   - Without stopwords: full token list returned.

3. **Deterministic ranking**
   - Same corpus + same query → identical ranking and scores across runs.

4. **Case-insensitive query & docs**
   - Changing case in query/doc does not change ranking.

5. **Normalized scoring**
   - Scores are between 0 and 1.
   - Non-matching docs get score 0.

6. **Edge cases**
   - Empty query → empty result.
   - Query that becomes all stopwords → empty result.
   - No documents or `topK <= 0` → empty result.

---

### US02 — `/api/ask` Endpoint

7. **Happy path, authenticated**
   - Valid session cookie.
   - Non-empty `question`.
   - Returns 200 with:
     - `answer` (top-doc-based)
     - `context[]` with ranked KB entries
     - `latency_ms` as number.

8. **Input validation error (empty/whitespace question)**
   - Returns 400 with validation error payload.

9. **Invalid body format**
   - Missing `question` or wrong type → 400.

10. **Unauthenticated request blocked**
    - No session cookie → 401.

11. **Empty KB corpus**
    - No docs in KB.
    - Returns 200 with:
      - `answer` describing no relevant results.
      - `context` empty array.

12. **Internal error surfaced cleanly**
    - Simulated repository failure or retrieval error.
    - Returns 500 with generic error, no internal details leaked.

13. **Query logging**
    - On successful 200 response:
      - entry in `queries` with user id, question, latency.

---

### US03 — Ask UI Page (`/`)

14. **Ask flow happy path**
    - Authenticated user.
    - Enters valid question.
    - Sees loading indicator.
    - Receives answer + context list rendered.

15. **Client-side validation on empty input**
    - Submit with empty input.
    - Inline validation and no request sent (or request fails fast).

16. **400 from `/api/ask` surfaces as user-friendly error**
    - Backend returns 400.
    - UI shows error message, not raw JSON.

17. **500 from `/api/ask` shows generic error**
    - Backend returns 500.
    - UI shows “Something went wrong” style error.

18. **Loading indicator behavior**
    - Shown while awaiting response.
    - Hidden when response arrives or on error.

19. **Auth enforcement at UI level**
    - Unauthenticated visit to `/` → redirect to `/login`.

20. **Accessibility and keyboard usage**
    - Question field focused by default or easily reachable.
    - Hitting Enter in input submits form.
    - Screen reader labels for input, submit button, answer, and context list.

---

## 7) Risks & Mitigations

| Risk                                          | Mitigation                                                      |
| --------------------------------------------- | --------------------------------------------------------------- |
| Retrieval feels “random” or non-deterministic | Deterministic TF-IDF + tests asserting ranking stability.       |
| Flaky tests due to async UI / network timing  | Use Playwright waits on locators, not raw timeouts.             |
| `/api/ask` leaking internal errors            | Ensure 500 responses return generic messages; log details only. |
| Auth/session issues breaking Ask UI tests     | Re-use stable login helper / API login from EP02.               |
| Databricks instability affecting tests        | Prefer in-memory KB for unit/UI/API tests; tag real-DB tests.   |

---

## 8) Evidence to Collect

- Vitest output for `retrieval.spec.ts` (US01).
- Playwright API test logs for `/api/ask` (US02).
- Playwright HTML report for Ask UI tests (US03).
- Screenshots:
  - Ask page with successful answer.
  - Validation error state.
  - Generic error state (500).
- Query logs snapshot (or mock assertions) showing entries created.

---

## 9) Commands (Quick Sheet)

- Run unit tests (retrieval):  
  `pnpm test:unit -- --runTestsByPath tests/unit/retrieval.spec.ts`

- Run API tests for `/api/ask`:  
  `pnpm test:api -- -g "@ep04-api"`

- Run UI tests for Ask page:  
  `pnpm test:ui -- -g "@ep04-ask-ui"`

- Full EP04 suite (if grouped/tagged):  
  `pnpm test -- --grep "@ep04"`

_(Exact commands may be adjusted to match final scripts; documented here as target state.)_

---

## 10) Acceptance & Sign-off

EP04 can be considered complete when:

- All scenarios in section 6 are implemented and pass.
- No critical/blocker issues related to Ask flow remain.
- Evidence collected and stored in `Test_Report_EP04.md`.
- CI runs EP04 tests as part of the main pipeline (or dedicated job).
