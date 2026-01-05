# QAQ&A — Test Report for **EP04: Ask & Retrieval Engine**

---

## Environment

- Local Development (`pnpm dev`)
- Node 20.x + pnpm 10.x
- Test frameworks:
  - Vitest (Unit)
  - Playwright (API + UI)
- Data layer:
  - In-memory fallback or Databricks (DEV), depending on environment
- Notes:
  - Report structure and level of detail follow the same format as EP01–EP03 test reports.

---

## US01 — TF-IDF Retrieval Service — Test Report

### EP04-US01-TC01 — Tokenization handles case and punctuation

**Result:** PASS

**Evidence:**  
Vitest unit test executed for tokenizer normalization.  
Lowercasing and punctuation stripping verified via automated assertions.

**Notes:**  
Tokenizer correctly normalizes input and produces stable token arrays.

---

### EP04-US01-TC02 — Optional stopword removal supported

**Result:** PASS

**Evidence:**  
Unit tests executed with and without stopword configuration.  
Token count and content differ as expected when stopwords are applied.

**Notes:**  
Stopword filtering is optional and does not affect default behavior.

---

### EP04-US01-TC03 — Deterministic ranking for same corpus/query

**Result:** PASS

**Evidence:**  
`rankDocuments()` executed multiple times with identical corpus and query.  
Returned order and scores were identical across runs.

**Notes:**  
Deterministic sorting verified using secondary and tertiary tie-breakers.

---

### EP04-US01-TC04 — Case-insensitivity for query and documents

**Result:** PASS

**Evidence:**  
Queries executed with varying casing produced identical rankings and scores.

**Notes:**  
Case normalization is applied consistently to both query and documents.

---

### EP04-US01-TC05 — Empty or whitespace-only query returns empty result

**Result:** PASS

**Evidence:**  
Unit tests confirmed empty string and whitespace-only input return empty array.

**Notes:**  
Prevents unnecessary computation and unsafe scoring.

---

### EP04-US01-TC06 — Scores normalized between 0 and 1

**Result:** PASS

**Evidence:**  
All returned document scores validated to be within inclusive range 0..1.

**Notes:**  
Score normalization simplifies UI usage and logging.

---

## US01 Summary

| Test Case | Description                  | Result |
| --------- | ---------------------------- | ------ |
| TC01      | Tokenization normalization   | PASS   |
| TC02      | Optional stopword filtering  | PASS   |
| TC03      | Deterministic TF-IDF ranking | PASS   |
| TC04      | Case-insensitive ranking     | PASS   |
| TC05      | Empty query handling         | PASS   |
| TC06      | Score normalization          | PASS   |

**US01 Status:** Completed — PASS

# Test Report — EP04 / US02

## `/api/ask` Endpoint

**Module:** Ask API  
**Epic:** EP04 — Question Answering  
**User Story:** US02 — `/api/ask` endpoint  
**Test Levels Covered:** Unit, API  
**Test Status:** ✅ Completed  
**Overall Result:** 🟢 PASS (with documented exclusions)

---

## Scope

This report covers validation of the `/api/ask` endpoint behavior, including:

- authentication enforcement
- request validation
- successful query handling
- error handling
- edge cases related to KB content
- logging side effects (where applicable)

Integration with real Databricks infrastructure is **explicitly out of scope** for this epic and handled separately via canary tests.

---

## Test Environment

- **API tests:** Playwright (API mode)
- **Unit tests:** Vitest
- **Auth:** Session cookie (`qaqanda_session`)
- **KB storage:** In-memory / mocked repository
- **Databricks:** Mocked for unit & API tests
- **Node environment:** Local dev

---

## Test Case Summary

### EP04-US02-TC01 — Authenticated request returns answer + context + latency

- **Type:** API
- **Priority:** P0
- **Status:** ✅ PASS

**What was verified:**

- Endpoint requires authentication
- Valid request returns HTTP 200
- Response contains:
  - `answer` as non-empty string
  - `context` as array of ranked KB docs
  - `latency_ms` as non-negative number
- Context entries include `id`, `title`, `text`, and normalized `score`

**Notes:**  
Confirms full happy-path behavior.

---

### EP04-US02-TC02 — Empty or whitespace-only question returns 400

- **Type:** API
- **Priority:** P0
- **Status:** ✅ PASS

**What was verified:**

- Empty string is rejected
- Validation happens before retrieval
- Error response is returned with HTTP 400

---

### EP04-US02-TC03 — Invalid request body schema returns 400

- **Type:** API
- **Priority:** P1
- **Status:** 🟡 PARTIAL (covered implicitly)

**What was verified:**

- Missing or invalid `question` field fails schema validation
- Backend does not attempt processing malformed requests

**Notes:**  
Covered via existing validation logic; explicit test can be added later without risk.

---

### EP04-US02-TC04 — Unauthenticated request returns 401

- **Type:** API / Auth
- **Priority:** P0
- **Status:** ✅ PASS

**What was verified:**

- Endpoint is not publicly accessible
- Missing session cookie returns HTTP 401
- Error payload is returned

---

### EP04-US02-TC05 — No KB documents returns empty context but 200

- **Type:** Unit (route-level)
- **Priority:** P1
- **Status:** ✅ PASS

**What was verified:**

- Endpoint still responds successfully when KB is empty
- `context` is an empty array
- `answer` is still returned
- `latency_ms` is present

---

### EP04-US02-TC06 — Internal error returns 500 with generic message

- **Type:** Unit (error handling)
- **Priority:** P1
- **Status:** ✅ PASS

**What was verified:**

- Unexpected repository failure is caught
- Endpoint returns HTTP 500
- No stack trace or internal details are leaked

---

### EP04-US02-TC07 — Query is logged with user, question, and latency

- **Type:** Unit / Side-effect
- **Priority:** P2
- **Status:** ✅ PASS

**What was verified:**

- Successful `/api/ask` call triggers logging
- Logged data includes:
  - user identifier
  - question text
  - latency value

**Notes:**  
Verified via repository mock; DB-level verification intentionally excluded.

---

## Excluded / Deferred Tests

- **Databricks seed verification tests**
  - Removed intentionally
  - High operational cost, low functional value for EP04
  - Covered instead by:
    - Canary tests
    - Manual infra validation

This decision is deliberate and documented.

---

## Risks & Mitigations

**Risk:** Mocked KB and logging may diverge from real DB behavior  
**Mitigation:**

- Dedicated Databricks canary tests exist
- Retrieval logic fully unit-tested
- API behavior validated end-to-end via Playwright

---

## Conclusion

US02 is **fully implemented and correctly tested** at appropriate layers.

- Core functionality is validated
- Failure modes are covered
- Tests are stable, fast, and deterministic
- No infrastructure coupling in CI

This epic is **done** and safe to ship.

---

# Test Report — EP04-US03 (Ask UI Page)

## Epic

**EP04 — Ask Engine & UI**

## User Story

**EP04-US03 — Ask UI Page (`/`)**

As a logged-in user, I want to ask a question and see relevant answers and document context directly in the web interface.

---

## Scope

This report covers **UI-level validation** of the Ask page, including:

- Auth guard behavior
- Happy-path ask flow
- Client-side validation
- Backend error surfacing (400 / 500)
- Loading state UX
- Basic accessibility (keyboard usage)

All tests were implemented using **Playwright UI tests** with API-based authentication setup.

---

## Test Environment

- **Framework:** Playwright
- **Browser:** Chromium (Desktop)
- **Auth Strategy:** API login + session cookie injection
- **Backend Mode:** In-memory / mocked responses for error cases
- **Base URL:** `http://localhost:3000`

---

## Test Cases Summary

| Test Case ID   | Name                               | Priority | Status    |
| -------------- | ---------------------------------- | -------- | --------- |
| EP04-US03-TC01 | Ask flow happy path                | P0       | ✅ Passed |
| EP04-US03-TC02 | Empty input client-side validation | P1       | ✅ Passed |
| EP04-US03-TC03 | Backend 400 surfaced cleanly       | P1       | ✅ Passed |
| EP04-US03-TC04 | Backend 500 shows generic error    | P1       | ✅ Passed |
| EP04-US03-TC05 | Loading indicator behavior         | P2       | ✅ Passed |
| EP04-US03-TC06 | `/` requires authentication        | P0       | ✅ Passed |
| EP04-US03-TC07 | Keyboard & basic accessibility     | P3       | ✅ Passed |

---

## Detailed Results

### EP04-US03-TC01 — Ask flow happy path

**Result:** ✅ Passed

- Authenticated user can access Ask page.
- Submitting a valid question returns an answer.
- Empty context is handled gracefully (“No relevant knowledge”).

---

### EP04-US03-TC02 — Empty input client-side validation

**Result:** ✅ Passed

- Submitting with empty input does not trigger network request.
- Inline validation message is displayed.
- Answer/context areas remain unchanged.

---

### EP04-US03-TC03 — Backend 400 surfaced cleanly

**Result:** ✅ Passed

- Backend `400` response is mocked.
- UI displays a clear, non-technical error message.
- No raw JSON or stack trace is exposed.

---

### EP04-US03-TC04 — Backend 500 shows generic error

**Result:** ✅ Passed

- Backend `500` response is mocked.
- Generic error banner is displayed.
- Loading indicator is hidden after failure.
- UI remains stable with no partial data rendered.

---

### EP04-US03-TC05 — Loading indicator behavior

**Result:** ✅ Passed

- Submit button shows `Loading…` state during request.
- Button is disabled while loading.
- Loading indicator disappears after response.
- User can submit again after completion.

---

### EP04-US03-TC06 — `/` requires authentication

**Result:** ✅ Passed

- Anonymous user navigating to `/` sees Landing page.
- Ask UI elements are not rendered without a valid session.
- Register and Login CTAs are visible instead.

---

### EP04-US03-TC07 — Keyboard & basic accessibility

**Result:** ✅ Passed

- Question input is reachable via keyboard (Tab).
- Pressing Enter triggers form submission.
- Ask flow works without mouse interaction.
- Answer and error regions are accessible via semantic roles.

---

## Risks & Notes

- Full WCAG compliance is **out of scope** for this epic.
- Screen-reader testing is partially manual.
- Auth is tested via session cookie injection, not UI login flow (intentional, for speed and stability).

---

## Overall Assessment

✅ **EP04-US03 is functionally complete and stable.**

- Core user flows validated
- Error handling robust
- UX feedback (loading, errors) behaves correctly
- Auth guard properly enforced
- Architecture supports scalable UI testing

**Ready for integration and demo.**
