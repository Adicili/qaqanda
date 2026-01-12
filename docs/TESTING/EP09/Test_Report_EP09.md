# QAQ&A — Test Report for **EP09: LLM Integration & AI Enhancement**

---

## Environment

- Local Development (`pnpm dev`)
- Node 20.x + pnpm 10.x
- Test frameworks:
  - Vitest (Unit)
  - Playwright (API)
- LLM mode:
  - `mock` (deterministic, header-driven)
- Data layer:
  - File-based local DB (`LOCAL_DB_PATH`)
- External providers:
  - OpenRouter **mocked** (real calls explicitly out of scope for CI)

**Notes:**

- All AI behavior is mocked to ensure determinism.
- Real LLM calls are validated only at contract level, not executed in CI.
- This report follows the same structure and bar as EP01–EP04.

---

## US01 — LLM Client & Configuration

### Scope

Validation of the **LLM abstraction layer**, including:

- strict JSON parsing
- schema validation
- provider error handling
- OpenRouter configuration wiring
- deterministic failure modes

---

### EP09-US01-TC01 — Valid JSON produces valid KB entry

**Result:** PASS

**Evidence:**  
Vitest unit test mocking provider response with valid JSON.  
Output successfully parsed and validated via `KbEntrySchema`.

**Verified:**

- Function resolves successfully
- Returned object contains `title`, `text`, `tags`
- No partial or inferred data allowed

---

### EP09-US01-TC02 — Non-JSON provider output rejected

**Result:** PASS

**Evidence:**  
Mocked provider response returned plain text.  
Function rejected with `LlmOutputError`.

**Verified:**

- No best-effort parsing
- Error logged with provider + model context
- No invalid data propagated upstream

---

### EP09-US01-TC03 — Schema mismatch rejected

**Result:** PASS

**Evidence:**  
Provider returned valid JSON missing required fields.  
Zod schema validation failed as expected.

**Verified:**

- Strict schema enforcement
- Failure treated as invalid AI output
- No silent acceptance of partial data

---

### EP09-US01-TC04 — OpenRouter config applied correctly

**Result:** PASS

**Evidence:**  
Fetch call inspected via mock.

**Verified:**

- Correct endpoint URL
- Headers include:
  - Authorization
  - HTTP-Referer
  - X-Title
- Request body includes:
  - `model` from ENV
  - `temperature` from ENV
  - System instruction enforcing JSON-only output

---

### EP09-US01-TC05 — Provider/network failure handled safely

**Result:** PASS

**Evidence:**  
Fetch mocked to throw or return non-OK response.

**Verified:**

- Function rejects with error
- Error logged with latency metadata
- No undefined or corrupted return values

---

### US01 Summary

| Test Case | Description                       | Result |
| --------- | --------------------------------- | ------ |
| TC01      | Valid JSON accepted               | PASS   |
| TC02      | Malformed output rejected         | PASS   |
| TC03      | Schema mismatch rejected          | PASS   |
| TC04      | OpenRouter config wiring          | PASS   |
| TC05      | Provider/network failure handling | PASS   |

**US01 Status:** Completed — PASS

---

## US02 — LLM Integration in `/api/ask`

---

## `/api/ask` Endpoint — LLM + TF-IDF

**Module:** Ask API  
**Epic:** EP09 — LLM Integration  
**User Story:** US02  
**Test Levels Covered:** API (Playwright)  
**Overall Result:** PASS

---

### Scope

This section validates:

- TF-IDF retrieval remains the source of truth
- LLM is used only as an enhancement layer
- Fallback behavior is safe and deterministic
- Prompt construction is stable and testable
- Latency metrics are captured

---

### EP09-US02-TC01 — LLM answer returned with context

**Result:** PASS

**Verified:**

- HTTP 200 returned
- Response includes:
  - `answer` (mocked, deterministic)
  - `context` (top 3 TF-IDF docs)
  - `latency_ms`
  - `used_llm: true`

---

### EP09-US02-TC02 — Fallback used when LLM fails

**Result:** PASS

**Verified:**

- LLM failure simulated via `x-mock-llm: malformed`
- Endpoint still returns HTTP 200
- Answer generated from TF-IDF fallback
- `used_llm: false`
- Context still included

---

### EP09-US02-TC03 — Prompt includes top 3 docs

**Result:** PASS

**Verified:**

- Prompt includes:
  - User question
  - JSON-only instruction
  - Exactly 3 context docs
- Prompt deterministically ordered

---

### EP09-US02-TC04 — Latency recorded

**Result:** PASS

**Verified:**

- `latency_ms` present in response
- Non-negative number
- Recorded regardless of LLM success or fallback

---

### US02 Summary

| Test Case | Description                     | Result |
| --------- | ------------------------------- | ------ |
| TC01      | LLM success path                | PASS   |
| TC02      | LLM failure fallback            | PASS   |
| TC03      | Prompt correctness (top 3 docs) | PASS   |
| TC04      | Latency recording               | PASS   |

**US02 Status:** Completed — PASS

---

## US03 — AI-Assisted KB Operations

### Scope

Validation of AI-assisted KB **add/update** flows, including:

- strict AI output validation
- permission enforcement
- audit logging
- rejection of invalid AI output
- protection against data corruption

---

### EP09-US03-TC01 — KB add succeeds with valid AI output

**Result:** PASS

**Verified:**

- LEAD user required
- Valid AI output persisted
- KB entry saved with title/text/tags
- Audit log entry created with metadata

---

### EP09-US03-TC02 — KB update succeeds with valid AI output

**Result:** PASS

**Verified:**

- Existing KB entry updated
- Data exactly matches AI output
- No partial merge or residue from previous state
- Audit entry recorded

---

### EP09-US03-TC03 — Invalid AI output blocks KB add

**Result:** PASS

**Verified:**

- HTTP 400 returned
- Explicit error message
- No KB entry created
- No partial writes

---

### EP09-US03-TC04 — Invalid AI output blocks KB update

**Result:** PASS

**Verified:**

- HTTP 400 returned
- Existing KB entry unchanged
- No silent overwrite

---

### EP09-US03-TC05 — Permissions enforced

**Result:** PASS

**Verified:**

- ENGINEER receives 403
- Unauthenticated receives 401
- No DB side effects

---

### EP09-US03-TC06 — Audit log contains LLM metadata

**Result:** PASS

**Verified:**

- Audit entries include:
  - model
  - timestamp
  - latency
- Values are non-empty and correctly typed

---

### US03 Summary

| Test Case | Description              | Result |
| --------- | ------------------------ | ------ |
| TC01      | KB add with AI           | PASS   |
| TC02      | KB update with AI        | PASS   |
| TC03      | Invalid AI blocks add    | PASS   |
| TC04      | Invalid AI blocks update | PASS   |
| TC05      | Permissions enforced     | PASS   |
| TC06      | Audit metadata recorded  | PASS   |

**US03 Status:** Completed (with explicit exclusion)

---

## Overall Assessment — EP09

**Status:** READY

- AI output treated as untrusted input
- Deterministic tests at all levels
- Mandatory fallback behavior enforced
- No data corruption paths
- Observability included

This is a real, production-grade AI integration — not a demo hack.
