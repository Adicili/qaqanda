# QAQ&A — Test Cases for **EP04: Ask & Retrieval Engine**

This document contains detailed **manual-first test cases** for EP04, aligned with the QAQ&A Test Strategy and consistent with EP01/EP02 formatting.

For each test case:

- Designed as a manual scenario.
- `Automate` indicates whether the case is (or should be) covered by automation (Vitest, Playwright API/UI).

---

## US01 — TF-IDF Retrieval Service

### EP04-US01-TC01

- **Test name:** Tokenization handles case and punctuation
- **Type:** Unit
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Vitest
  - Spec file: `tests/unit/retrieval.spec.ts`
  - Test name: `EP04-US01-TC01 — tokenize normalizes case and strips punctuation`
  - Command:  
    `pnpm test:unit -- --runTestsByPath tests/unit/retrieval.spec.ts`

**Description:**  
Verify that the tokenizer converts text to lowercase, removes punctuation, and splits into tokens correctly.

**Steps:**

1. Call `tokenize("Playwright, QA & Testing!!!")` with stopwords `["&"]`.
2. Inspect returned array of tokens.

**Expected Result:**

- Output tokens: `["playwright", "qa", "testing"]`.

---

### EP04-US01-TC02

- **Test name:** Optional stopword removal supported
- **Type:** Unit
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Vitest
  - Spec file: `tests/unit/retrieval.spec.ts`
  - Test name: `EP04-US01-TC02 — stopword filtering`
  - Command:  
    `pnpm test:unit -- --runTestsByPath tests/unit/retrieval.spec.ts`

**Description:**  
Ensure that stopword removal is optional and works when configured.

**Steps:**

1. Call `tokenize("The quick brown fox jumps over the lazy dog")` with default options.
2. Call `tokenize("The quick brown fox jumps over the lazy dog", { stopwords: ["the", "over"] })`.

**Expected Result:**

- First call: includes words like `"the"`, `"over"`.
- Second call: does **not** contain `"the"` or `"over"`, and has fewer tokens overall.

---

### EP04-US01-TC03

- **Test name:** Deterministic ranking for same corpus and query
- **Type:** Unit
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Vitest
  - Spec file: `tests/unit/retrieval.spec.ts`
  - Test name: `EP04-US01-TC03 — deterministic TF-IDF ranking`
  - Command:  
    `pnpm test:unit -- --runTestsByPath tests/unit/retrieval.spec.ts`

**Description:**  
Validate that calling `rankDocuments` multiple times with the same corpus and query returns identical ordering and scores.

**Preconditions:**

- A small static KB corpus of 3–4 documents is defined inside the test.

**Steps:**

1. Call `rankDocuments(query, docs, 3)` once and store result.
2. Call `rankDocuments(query, docs, 3)` again.
3. Compare both arrays.

**Expected Result:**

- Both result arrays are identical (same order, same document IDs, same scores).
- Docs most related to query appear at the top consistently.

---

### EP04-US01-TC04

- **Test name:** Case-insensitivity for query and documents
- **Type:** Unit
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Vitest
  - Spec file: `tests/unit/retrieval.spec.ts`
  - Test name: `EP04-US01-TC04 — case-insensitive ranking`
  - Command:  
    `pnpm test:unit -- --runTestsByPath tests/unit/retrieval.spec.ts`

**Description:**  
Confirm that changing case in the query or documents does not affect ranking.

**Steps:**

1. Call `rankDocuments("playwright testing", docs, 2)`.
2. Call `rankDocuments("PLAYWRIGHT TESTING", docs, 2)` using the same `docs`.
3. Compare outputs.

**Expected Result:**

- Result lists are identical.
- Top result is the same document in both runs.

---

### EP04-US01-TC05

- **Test name:** Empty or whitespace-only query returns empty list
- **Type:** Unit
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Vitest
  - Spec file: `tests/unit/retrieval.spec.ts`
  - Test name: `EP04-US01-TC05 — empty query returns []`
  - Command:  
    `pnpm test:unit -- --runTestsByPath tests/unit/retrieval.spec.ts`

**Description:**  
Ensure that invalid queries are handled gracefully without scoring.

**Steps:**

1. Call `rankDocuments("", docs, 5)`.
2. Call `rankDocuments("   ", docs, 5)` (whitespace only).

**Expected Result:**

- Both calls return an empty array.

---

### EP04-US01-TC06

- **Test name:** Scores normalized between 0 and 1
- **Type:** Unit
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Vitest
  - Spec file: `tests/unit/retrieval.spec.ts`
  - Test name: `EP04-US01-TC06 — score range 0..1`
  - Command:  
    `pnpm test:unit -- --runTestsByPath tests/unit/retrieval.spec.ts`

**Description:**  
Verify that all computed scores are clamped to a 0..1 range.

**Steps:**

1. Call `rankDocuments("testing", docs, 10)` with a small corpus.
2. Inspect `score` of each returned document.

**Expected Result:**

- For each document:
  - `0 <= score <= 1`.

---

## US02 — `/api/ask` Endpoint

### EP04-US02-TC01

- **Test name:** Authenticated request returns answer + context + latency
- **Type:** API
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/ask-api.spec.ts`
  - Test name: `EP04-US02-TC01 — /api/ask happy path`
  - Command:  
    `pnpm test:api -- -g "EP04-US02-TC01"`

**Description:**  
Validate the happy-path behavior for `/api/ask` with a valid session and non-empty question.

**Preconditions:**

- Valid user session cookie obtained via login API or helper.
- KB contains at least one relevant document.

**Steps:**

1. Authenticate user and capture session cookie.
2. Send `POST /api/ask` with JSON body `{ "question": "How do I run Playwright tests?" }`.
3. Inspect status, JSON body, and fields `answer`, `context`, `latency_ms`.

**Expected Result:**

- Status `200 OK`.
- `answer` is non-empty string (top-doc-based).
- `context` is a non-empty array with ranked entries (id/title/text/score or equivalent).
- `latency_ms` is a numeric value.

---

### EP04-US02-TC02

- **Test name:** Empty or whitespace-only question returns 400
- **Type:** API
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/ask-api.spec.ts`
  - Test name: `EP04-US02-TC02 — empty question returns 400`
  - Command:  
    `pnpm test:api -- -g "EP04-US02-TC02"`

**Description:**  
Verify Zod/body validation for the `question` field.

**Steps:**

1. Send `POST /api/ask` with `{ "question": "" }`.
2. Send `POST /api/ask` with `{ "question": "   " }`.

**Expected Result:**

- Status `400 Bad Request` for both.
- Error payload clearly indicates invalid/empty question.

---

### EP04-US02-TC03

- **Test name:** Invalid request body schema returns 400
- **Type:** API
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/ask-api.spec.ts`
  - Test name: `EP04-US02-TC03 — invalid body schema`
  - Command:  
    `pnpm test:api -- -g "EP04-US02-TC03"`

**Description:**  
Ensure backend rejects malformed bodies (missing question or wrong type).

**Steps:**

1. Send `POST /api/ask` with `{}`.
2. Send `POST /api/ask` with `{ "question": 123 }`.

**Expected Result:**

- Status `400 Bad Request`.
- Validation error describing missing or invalid `question`.

---

### EP04-US02-TC04

- **Test name:** Unauthenticated request returns 401
- **Type:** API / Auth
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/ask-api.spec.ts`
  - Test name: `EP04-US02-TC04 — unauthenticated /api/ask returns 401`
  - Command:  
    `pnpm test:api -- -g "EP04-US02-TC04"`

**Description:**  
Verify that `/api/ask` requires a valid session and is not publicly accessible.

**Steps:**

1. In a clean request context with no cookies, send `POST /api/ask` with a valid body.

**Expected Result:**

- Status `401 Unauthorized`.
- Error payload indicates missing/invalid authentication.

---

### EP04-US02-TC05

- **Test name:** No KB documents returns empty context but 200
- **Type:** API
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/ask-api.spec.ts`
  - Test name: `EP04-US02-TC05 — no KB docs`
  - Command:  
    `pnpm test:api -- -g "EP04-US02-TC05"`

**Description:**  
When KB is empty, `/api/ask` should still respond successfully but signal no matching docs.

**Preconditions:**

- `db.kb.listAll()` returns an empty array or in-memory KB cleared.

**Steps:**

1. Authenticate user.
2. Send `POST /api/ask` with valid question.

**Expected Result:**

- Status `200 OK`.
- `answer` describes that no relevant documents were found.
- `context` is an empty array.
- `latency_ms` is present.

---

### EP04-US02-TC06

- **Test name:** Internal error returns 500 with generic message
- **Type:** API / Error Handling
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/ask-api.spec.ts`
  - Test name: `EP04-US02-TC06 — internal error surfaces as 500`
  - Command:  
    `pnpm test:api -- -g "EP04-US02-TC06"`

**Description:**  
Ensure that unexpected errors (e.g. repository failure) return a safe 500 response without leaking stack traces.

**Preconditions:**

- `db.kb.listAll()` or retrieval call is mocked to throw.

**Steps:**

1. Authenticate user.
2. Send `POST /api/ask` with valid question while mock throws.

**Expected Result:**

- Status `500 Internal Server Error`.
- Response contains a generic error message (no stack trace or internal details).

---

### EP04-US02-TC07

- **Test name:** Query is logged with user, question, and latency
- **Type:** API / Logging
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Vitest or Playwright API tests (depending on implementation)
  - Spec file: `tests/api/ask-logging.spec.ts` (or unit-level log test)
  - Test name: `EP04-US02-TC07 — query logging`
  - Command:  
    `pnpm test:api -- -g "EP04-US02-TC07"`

**Description:**  
Verify that each successful `/api/ask` call inserts a record into `queries` table.

**Preconditions:**

- Logging function `logQuery` mocked or dev DB accessible.

**Steps:**

1. Authenticate user.
2. Send `POST /api/ask` with valid body.
3. Inspect mock calls or DB entries.

**Expected Result:**

- One log entry created with:
  - user ID
  - question text
  - latency value.

---

## US03 — Ask UI Page (`/`)

### EP04-US03-TC01

- **Test name:** Ask flow happy path (UI)
- **Type:** UI
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI tests
  - Spec file: `tests/ui/ask-ui.spec.ts`
  - Test name: `EP04-US03-TC01 — ask flow happy path`
  - Command:  
    `pnpm test:ui -- -g "EP04-US03-TC01"`

**Description:**  
Validate the full ask flow from UI perspective for an authenticated user.

**Preconditions:**

- User is logged in (via UI login or API login + cookie injection).
- `/api/ask` functioning (or mocked).

**Steps:**

1. Navigate to `/`.
2. Enter a valid question in the Ask input.
3. Submit the form.
4. Wait for response.

**Expected Result:**

- Loading indicator appears while waiting.
- Answer text is displayed.
- Context list (KB entries) is rendered (titles at minimum).

---

### EP04-US03-TC02

- **Test name:** Client-side validation for empty question
- **Type:** UI / Validation
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI tests
  - Spec file: `tests/ui/ask-ui.spec.ts`
  - Test name: `EP04-US03-TC02 — empty input validation`
  - Command:  
    `pnpm test:ui -- -g "EP04-US03-TC02"`

**Description:**  
Ensure user cannot submit an obviously empty question.

**Steps:**

1. Login if required and navigate to `/`.
2. Leave question input empty.
3. Attempt to submit.

**Expected Result:**

- Inline validation message displayed.
- No network request sent (or request fails fast with 400 + UI error).
- Answer/context area not updated.

---

### EP04-US03-TC03

- **Test name:** 400 from `/api/ask` shows validation error message
- **Type:** UI / API Integration
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI tests
  - Spec file: `tests/ui/ask-ui.spec.ts`
  - Test name: `EP04-US03-TC03 — backend 400 surfaced cleanly`
  - Command:  
    `pnpm test:ui -- -g "EP04-US03-TC03"`

**Description:**  
Verify that when backend returns 400 (invalid question), the UI shows a clear, non-technical error.

**Preconditions:**

- `/api/ask` configured to return 400 for specific input, or request mocked.

**Steps:**

1. Navigate to `/` as authenticated user.
2. Enter a value known to trigger backend validation error (or simulate via mock).
3. Submit.

**Expected Result:**

- User sees clear error message on screen (banner or inline).
- No raw JSON / stack trace.

---

### EP04-US03-TC04

- **Test name:** 500 from `/api/ask` shows generic error banner
- **Type:** UI / Error Handling
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI tests
  - Spec file: `tests/ui/ask-ui.spec.ts`
  - Test name: `EP04-US03-TC04 — backend 500 shows generic error`
  - Command:  
    `pnpm test:ui -- -g "EP04-US03-TC04"`

**Description:**  
Ensure the UI handles server errors gracefully.

**Preconditions:**

- `/api/ask` mocked or configured to return 500.

**Steps:**

1. Navigate to `/` as authenticated user.
2. Enter valid question and submit (while 500 is simulated).

**Expected Result:**

- Generic error banner/message displayed (e.g. “Something went wrong, please try again.”).
- Loading indicator hidden.
- No partial/garbled data shown.

---

### EP04-US03-TC05

- **Test name:** Loading indicator appears and disappears correctly
- **Type:** UI
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI tests
  - Spec file: `tests/ui/ask-ui.spec.ts`
  - Test name: `EP04-US03-TC05 — loading indicator behavior`
  - Command:  
    `pnpm test:ui -- -g "EP04-US03-TC05"`

**Description:**  
Validate UX feedback while the request is in progress.

**Steps:**

1. Navigate to `/` as authenticated user.
2. Enter valid question and submit.
3. Observe UI between submit and response arrival.

**Expected Result:**

- Loading indicator (spinner/text) visible while waiting.
- Indicator disappears after success or error.
- User can submit another question after completion.

---

### EP04-US03-TC06

- **Test name:** Unauthenticated user sees Landing page instead of Ask page
- **Type:** UI / Auth Guard (server-side rendering)
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI tests
  - Spec file: `tests/ui/ask-ui.spec.ts`
  - Test name: `EP04-US03-TC06 — unauthenticated user sees landing`
  - Command:  
    `pnpm test:ui -- -g "EP04-US03-TC06"`

**Description:**  
Verify that the Ask page is protected and that anonymous users are not shown the Ask UI.  
When no valid session cookie is present, the application renders the public Landing page instead of the Ask interface.

**Steps:**

1. Start Playwright browser with no session cookies.
2. Navigate to `/`.

**Expected Result:**

- Landing page content is rendered (title and Register/Login CTAs are visible).
- Ask page UI elements (question input, submit button, answer/context sections) are not rendered.
- No redirect occurs; access control is enforced via server-side conditional rendering.

---

### EP04-US03-TC07

- **Test name:** Keyboard and accessibility basics on Ask page
- **Type:** UI / Accessibility
- **Priority:** P3
- **Automate:** Partial (manual + automated)
- **Automation:**
  - Framework: Playwright UI tests
  - Spec file: `tests/ui/ask-a11y.spec.ts`
  - Test name: `EP04-US03-TC07 — basic a11y on Ask page`
  - Command:  
    `pnpm test:ui -- -g "EP04-US03-TC07"`

**Description:**  
Check minimal accessibility: keyboard usage and labels.

**Steps:**

1. Navigate to `/` as authenticated user.
2. Verify focus can reach question input via Tab.
3. Press Enter in the input and confirm that it triggers submit.
4. Inspect ARIA labels/roles for question input, answer region, and context list (manually or via locator checks).

**Expected Result:**

- Question input focusable via keyboard.
- Enter triggers submit.
- Answer/context areas have reasonable labels/roles for screen readers.

---

## Summary

| US   | # of Tests | Automated       | Focus                                      |
| ---- | ---------- | --------------- | ------------------------------------------ |
| US01 | 6          | 6               | TF-IDF retrieval correctness & determinism |
| US02 | 7          | 7               | `/api/ask` behavior, auth, logging         |
| US03 | 7          | 7 (one partial) | Ask UI UX, errors, auth, accessibility     |

**Total:** 20 test cases  
**Automation coverage:** 100% planned (Vitest + Playwright), aligned with EP04 scope and QAQ&A Test Strategy.
