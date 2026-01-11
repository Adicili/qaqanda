# Test Cases – EP09

## EP09 — LLM Integration & AI Enhancement

This document defines test cases for EP09 in the same structured format used across previous epics.  
Focus is on **safety, validation, fallback behavior, permissions, and determinism**.  
If any of these tests fail, EP09 is not “partially working” — it’s **dangerous**.

---

## EP09-US01 — LLM Client & Config (CORRECTED)

---

### EP09-US01-TC01

- **Test name:** LLM returns a valid KB entry when provider output is valid JSON and matches schema
- **Type:** Unit / Positive
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Unit (Vitest)
  - Spec file: `tests/unit/llm.spec.ts`
  - Test name: `EP09-US01-TC01 — valid JSON produces valid KbEntry`

**Description:**  
Ensure the LLM layer returns a parsed KB entry only when the provider output is valid JSON and passes Zod schema validation.

**Steps:**

1. Set `ENV.LLM_MODE = 'real'`.
2. Mock `fetch()` to return a `choices[0].message.content` string containing valid JSON with keys `{ title, text, tags }`.
3. Call `generateKbEntryFromPrompt(prompt)`.

**Expected Result:**

- Function resolves successfully
- Returned value is a `KbEntry` object
- `title` is a non-empty string
- `text` is a non-empty string
- `tags` is an array of strings

---

### EP09-US01-TC02

- **Test name:** LLM rejects malformed (non-JSON) provider output
- **Type:** Unit / Negative
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Unit (Vitest)
  - Spec file: `tests/unit/llm.spec.ts`
  - Test name: `EP09-US01-TC02 — non-JSON output rejected`

**Description:**  
Ensure malformed provider output is rejected and cannot pass into application logic.

**Steps:**

1. Set `ENV.LLM_MODE = 'real'`.
2. Mock `fetch()` to return `choices[0].message.content` as a plain string (not JSON).
3. Call `generateKbEntryFromPrompt(prompt)`.
4. Spy on `console.error` (or project logger if used).

**Expected Result:**

- Function rejects with an “invalid output” error (project uses `LlmOutputError`)
- Error is logged once with context (provider, model, latency)
- No partial parsing or “best effort extraction” occurs

---

### EP09-US01-TC03

- **Test name:** LLM rejects valid JSON that fails schema validation
- **Type:** Unit / Negative
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Unit (Vitest)
  - Spec file: `tests/unit/llm.spec.ts`
  - Test name: `EP09-US01-TC03 — schema mismatch rejected`

**Description:**  
Ensure correct JSON is still rejected if it does not match the required KB schema.

**Steps:**

1. Set `ENV.LLM_MODE = 'real'`.
2. Mock `fetch()` to return valid JSON missing required fields (e.g., `{ "title": "x" }`).
3. Call `generateKbEntryFromPrompt(prompt)`.

**Expected Result:**

- Function rejects with an “invalid output” error (schema validation failure)
- Error is logged
- Invalid data is not returned to the caller

---

### EP09-US01-TC04

- **Test name:** OpenRouter configuration is applied to the provider request
- **Type:** Unit / Configuration
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Unit (Vitest)
  - Spec file: `tests/unit/llm.spec.ts`
  - Test name: `EP09-US01-TC04 — openrouter env config applied`

**Description:**  
Validate that OpenRouter model/temperature and required headers are applied via the ENV wrapper.

**Steps:**

1. Set:
   - `ENV.LLM_MODE = 'real'`
   - `ENV.OPENROUTER_MODEL = '<known-model>'`
   - `ENV.OPENROUTER_TEMPERATURE = <known-number>`
   - `ENV.APP_URL = '<known-url>'`
2. Mock `fetch()` and capture the request URL, headers, and JSON body.
3. Call `generateKbEntryFromPrompt(prompt)`.

**Expected Result:**

- `fetch()` called with URL: `https://openrouter.ai/api/v1/chat/completions`
- Headers include:
  - `Authorization: Bearer ...`
  - `HTTP-Referer: ENV.APP_URL`
  - `X-Title: QAQ&A`
  - `Content-Type: application/json`
- Request body includes:
  - `model === ENV.OPENROUTER_MODEL`
  - `temperature === ENV.OPENROUTER_TEMPERATURE`
  - `messages` include a system instruction enforcing JSON-only output

---

### EP09-US01-TC05

- **Test name:** LLM handles network/provider failure gracefully and logs the error
- **Type:** Unit / Error Handling
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Unit (Vitest)
  - Spec file: `tests/unit/llm.spec.ts`
  - Test name: `EP09-US01-TC05 — provider failure handled`

**Description:**  
Ensure external dependency failures are surfaced cleanly and logged, without returning undefined or corrupt data.

**Steps:**

1. Set `ENV.LLM_MODE = 'real'`.
2. Mock `fetch()` to throw (network error) OR return `ok: false`.
3. Spy on `console.error`.
4. Call `generateKbEntryFromPrompt(prompt)`.

**Expected Result:**

- Function rejects with an error
- Error is logged with context (provider, model, latency)
- No undefined return values

---

## EP09-US02 — LLM Integration in `/api/ask`

### EP09-US02-TC01

- **Test name:** `/api/ask` returns LLM-enhanced answer when AI succeeds
- **Type:** API / Positive
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/ask-llm.spec.ts`
  - Test name: `EP09-US02-TC01 — llm answer returned with context`

**Description:**  
Ensure `/api/ask` uses TF-IDF for retrieval and LLM for summarized answer.

**Steps:**

1. Seed KB with at least 3 relevant docs.
2. Mock `callLLM()` (or HTTP) to return valid JSON: `{ "answer": "..." }`.
3. POST question to `/api/ask`.

**Expected Result:**

- HTTP `200`
- Response includes:
  - AI-generated `answer`
  - context derived from top 3 TF-IDF docs
- Answer equals mocked AI value (deterministic)

---

### EP09-US02-TC02

- **Test name:** `/api/ask` falls back to TF-IDF-only answer when AI fails
- **Type:** API / Fallback
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/ask-llm.spec.ts`
  - Test name: `EP09-US02-TC02 — fallback used when llm fails`

**Description:**  
Ensure AI failures do not break the core feature.

**Steps:**

1. Seed KB with relevant docs.
2. Mock `callLLM()` to throw or return invalid JSON.
3. POST question to `/api/ask`.

**Expected Result:**

- HTTP `200`
- Response includes a non-empty answer generated by TF-IDF path
- Response still includes context docs
- Error is logged (if log assertions are supported)

---

### EP09-US02-TC03

- **Test name:** `/api/ask` sends top 3 docs as LLM context
- **Type:** API / Contract
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API (spy/mocked call)
  - Spec file: `tests/api/ask-llm.spec.ts`
  - Test name: `EP09-US02-TC03 — llm prompt includes top 3 docs`

**Description:**  
Ensure prompt construction is correct and stable.

**Steps:**

1. Seed KB with 5 docs.
2. Stub TF-IDF to return known ordering OR control seed so ordering is deterministic.
3. Spy on `callLLM()` input prompt.
4. Call `/api/ask`.

**Expected Result:**

- Prompt contains exactly 3 docs of context (top 3)
- Prompt includes the user question
- Prompt requests JSON output format explicitly

If you send garbage context, AI outputs garbage too.

---

### EP09-US02-TC04

- **Test name:** `/api/ask` records and returns latency metrics
- **Type:** API / Observability
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/ask-llm.spec.ts`
  - Test name: `EP09-US02-TC04 — latency recorded`

**Description:**  
Ensure request latency is recorded and exposed/logged as required.

**Steps:**

1. Call `/api/ask` with LLM success mocked.
2. Inspect response (and DB log if applicable).

**Expected Result:**

- Latency is captured (field returned OR logged OR persisted as per implementation)
- Value is a non-negative number
- Does not break response shape

---

## EP09-US03 — AI-Assisted KB Operations

### EP09-US03-TC01

- **Test name:** `/api/kb/add` saves KB entry when AI output is valid
- **Type:** API / Positive
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/kb-llm.spec.ts`
  - Test name: `EP09-US03-TC01 — kb add success with llm`

**Description:**  
Ensure KB creation uses LLM output and persists only validated data.

**Steps:**

1. Login as LEAD.
2. Mock LLM output to valid schema:
   `{ "title": "...", "text": "...", "tags": ["..."] }`
3. POST to `/api/kb/add` with prompt/input.
4. Query KB list or DB to confirm persistence.

**Expected Result:**

- HTTP `200`
- KB entry saved with title/text/tags from AI output
- Audit log includes `llm_model` and timestamp

---

### EP09-US03-TC02

- **Test name:** `/api/kb/update` updates KB entry when AI output is valid
- **Type:** API / Positive
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/kb-llm.spec.ts`
  - Test name: `EP09-US03-TC02 — kb update success with llm`

**Description:**  
Ensure updates use validated LLM output and persist correctly.

**Steps:**

1. Login as LEAD.
2. Create an existing KB entry.
3. Mock LLM output with updated content (valid schema).
4. POST to `/api/kb/update` for that entry.

**Expected Result:**

- HTTP `200`
- KB entry updated exactly to AI output values
- Audit log includes model and latency metadata

---

### EP09-US03-TC03

- **Test name:** `/api/kb/add` returns 400 when AI output is invalid
- **Type:** API / Validation
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/kb-llm.spec.ts`
  - Test name: `EP09-US03-TC03 — invalid llm output returns 400`

**Description:**  
Ensure invalid AI output is rejected and does not write to DB.

**Steps:**

1. Login as LEAD.
2. Mock AI to return invalid JSON or wrong schema.
3. POST to `/api/kb/add`.
4. Query KB list.

**Expected Result:**

- HTTP `400`
- Response contains explicit validation error message
- No new KB entry created
- Audit log either:
  - records failure safely, or
  - does not record (as implemented) — but must not crash

---

### EP09-US03-TC04

- **Test name:** `/api/kb/update` returns 400 when AI output is invalid
- **Type:** API / Validation
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/kb-llm.spec.ts`
  - Test name: `EP09-US03-TC04 — invalid llm output blocks update`

**Description:**  
Ensure invalid AI output cannot overwrite existing KB data.

**Steps:**

1. Login as LEAD.
2. Create an existing KB entry and record its values.
3. Mock AI output invalid/wrong schema.
4. POST to `/api/kb/update`.

**Expected Result:**

- HTTP `400`
- Explicit error message returned
- KB entry remains unchanged

If this fails, your KB is corruptible by garbage AI output.

---

### EP09-US03-TC05

- **Test name:** KB AI endpoints enforce permissions
- **Type:** API / Security
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/kb-llm.spec.ts`
  - Test name: `EP09-US03-TC05 — permissions enforced`

**Description:**  
Ensure only LEAD (or required role) can perform AI-assisted KB operations.

**Steps:**

1. Login as ENGINEER or unauthenticated.
2. Attempt `/api/kb/add` and `/api/kb/update`.

**Expected Result:**

- HTTP `403` (or `401` if unauthenticated)
- No DB changes occur

---

### EP09-US03-TC06

- **Test name:** Audit log captures model and latency metadata
- **Type:** API / Observability
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/kb-llm.spec.ts`
  - Test name: `EP09-US03-TC06 — audit log contains llm metadata`

**Description:**  
Ensure AI usage is traceable for debugging and accountability.

**Steps:**

1. Login as LEAD.
2. Mock AI success response.
3. Perform KB add or update.
4. Read audit log entry (endpoint or DB read depending on project utilities).

**Expected Result:**

- Audit log contains:
  - `llm_model`
  - timestamp
  - `llm_latency` (and tokens if available)
- Values are non-empty and valid types

---

## Notes

- All AI interactions must be mocked to remain deterministic.
- Tests must verify **no data corruption** on AI failure.
- Fallback behavior is not “nice to have” — it is required for reliability.

If EP09 passes only happy-path tests, it’s fake confidence.
