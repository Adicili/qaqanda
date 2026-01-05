# Test Cases — EP05 (Knowledge Base Management)

## EP05 — Knowledge Base Management (Lead)

---

## EP05-US01 — Add Knowledge Base Entry via AI

---

### EP05-US01-TC01

- **Test name:** Lead can add KB entry via AI (happy path)
- **Type:** API
- **Priority:** P0
- **Automate:** Yes

**Description:**  
Verify that a QA Lead can successfully create a new KB entry using AI-generated content.

**Preconditions:**

- Authenticated user with role `LEAD`
- LLM client mocked to return valid JSON
- Databricks available (mock or dev)

**Steps:**

1. Authenticate as Lead.
2. Send `POST /api/kb/add` with body `{ prompt: "Generate KB entry about Playwright retries" }`.
3. Mock LLM returns valid JSON `{ title, text, tags[] }`.

**Expected Result:**

- Status `200 OK`
- Response contains created KB entry ID
- New record inserted into `kb_docs`
- Audit record created in `kb_audit` with `change_type = CREATE`

---

### EP05-US01-TC02

- **Test name:** Non-Lead user cannot add KB entry
- **Type:** API / Security
- **Priority:** P0
- **Automate:** Yes

**Description:**  
Ensure only Lead users can access `/api/kb/add`.

**Steps:**

1. Authenticate as Engineer (non-Lead).
2. Send `POST /api/kb/add` with valid prompt.

**Expected Result:**

- Status `403 Forbidden`
- No KB entry created
- No audit entry created

---

### EP05-US01-TC03

- **Test name:** Invalid request body rejected
- **Type:** API / Validation
- **Priority:** P1
- **Automate:** Yes

**Description:**  
Verify request validation for missing or invalid `prompt`.

**Steps:**

1. Authenticate as Lead.
2. Send `POST /api/kb/add` with `{}` or `{ prompt: "" }`.

**Expected Result:**

- Status `400 Bad Request`
- Validation error message returned
- No DB writes performed

---

### EP05-US01-TC04

- **Test name:** Invalid LLM output rejected
- **Type:** API / AI Validation
- **Priority:** P0
- **Automate:** Yes

**Description:**  
Ensure malformed or non-JSON AI output is rejected safely.

**Preconditions:**

- LLM mocked to return invalid output (plain text or malformed JSON)

**Steps:**

1. Authenticate as Lead.
2. Call `POST /api/kb/add`.
3. LLM returns invalid response.

**Expected Result:**

- Status `400 Bad Request`
- Clear error message returned
- No KB entry inserted
- No audit entry created

---

### EP05-US01-TC05

- **Test name:** UI flow — add KB entry via AI
- **Type:** UI
- **Priority:** P1
- **Automate:** Yes

**Description:**  
Verify full UI flow for adding a KB entry via AI.

**Steps:**

1. Login as Lead.
2. Navigate to `/kb`.
3. Enter prompt and click “Generate”.
4. Preview generated content.
5. Confirm save.

**Expected Result:**

- Preview shows generated title/text/tags
- Success toast shown after save
- Entry visible in KB list

---

## EP05-US02 — Update Knowledge Base Entry via AI

---

### EP05-US02-TC01

- **Test name:** Lead can update KB entry via AI (happy path)
- **Type:** API
- **Priority:** P0
- **Automate:** Yes

**Description:**  
Verify Lead can update an existing KB entry using AI.

**Preconditions:**

- Existing KB entry present
- LLM mocked to return valid updated JSON

**Steps:**

1. Authenticate as Lead.
2. Send `POST /api/kb/update` with `{ id, prompt }`.
3. LLM returns valid updated JSON.

**Expected Result:**

- Status `200 OK`
- `kb_docs` updated with new content
- `kb_audit` contains entry with `change_type = UPDATE`
- Audit includes before/after snapshot

---

### EP05-US02-TC02

- **Test name:** Update with non-existent ID returns 404
- **Type:** API / Validation
- **Priority:** P1
- **Automate:** Yes

**Steps:**

1. Authenticate as Lead.
2. Send `POST /api/kb/update` with invalid `id`.

**Expected Result:**

- Status `404 Not Found`
- No DB updates
- No audit entry created

---

### EP05-US02-TC03

- **Test name:** Invalid LLM output does not overwrite data
- **Type:** API / Data Integrity
- **Priority:** P0
- **Automate:** Yes

**Description:**  
Ensure invalid AI output does not corrupt existing KB entry.

**Steps:**

1. Authenticate as Lead.
2. Send update request.
3. LLM returns invalid JSON.

**Expected Result:**

- Status `400 Bad Request`
- Original KB entry unchanged
- No audit update entry created

---

### EP05-US02-TC04

- **Test name:** Non-Lead user cannot update KB entry
- **Type:** API / Security
- **Priority:** P0
- **Automate:** Yes

**Steps:**

1. Authenticate as Engineer.
2. Call `POST /api/kb/update`.

**Expected Result:**

- Status `403 Forbidden`
- No KB changes
- No audit entry

---

### EP05-US02-TC05

- **Test name:** UI flow — update KB entry via AI
- **Type:** UI
- **Priority:** P1
- **Automate:** Yes

**Description:**  
Verify UI edit flow for updating KB entries.

**Steps:**

1. Login as Lead.
2. Navigate to `/kb`.
3. Select existing KB entry.
4. Enter AI prompt and generate update.
5. Preview changes.
6. Confirm update.

**Expected Result:**

- Preview shows updated content
- Success confirmation shown
- KB list reflects updated entry

---

## EP05-US02-TC06

- **Test name:** Audit trail created for each update
- **Type:** API / Audit
- **Priority:** P2
- **Automate:** Yes

**Description:**  
Ensure every successful update produces an audit record.

**Steps:**

1. Perform successful update as Lead.
2. Query audit table.

**Expected Result:**

- Audit record exists with:
  - `change_type = UPDATE`
  - Correct user ID
  - Timestamp
  - Before/after data

---

## End of EP05 Test Cases

## EP05 — Additional Test Cases (Coverage Gaps)

> These are _add-on_ test cases to close the real gaps: auth vs role, strict LLM validation, audit integrity, atomicity, and UI guarding.

---

# EP05-US01 — Add KB Entry via AI (`/api/kb/add`)

### EP05-US01-TC00

- **Test name:** Unauthenticated request returns 401
- **Type:** API / Auth
- **Priority:** P0
- **Automate:** Yes (Playwright API)
- **Spec file:** `tests/api/kb-add.spec.ts`
- **Command:** `pnpm test:api -- -g "EP05-US01-TC00"`

**Steps:**

1. Send `POST /api/kb/add` with `{ prompt: "Create KB entry..." }` and **no cookies**.

**Expected:**

- `401 Unauthorized`
- JSON error payload present (no stack trace)

---

### EP05-US01-TC04

- **Test name:** Valid JSON but invalid schema returns 400 (strict output validation)
- **Type:** API / Validation
- **Priority:** P0
- **Automate:** Yes
- **Preconditions:** LLM call mocked to return _schema-invalid_ JSON.

**Steps:**

1. Authenticate as Lead.
2. Mock LLM response to return valid JSON with wrong types, e.g. `{ "title": "X", "text": "Y", "tags": "not-array" }`.
3. Call `POST /api/kb/add` with a valid `{ prompt }`.

**Expected:**

- `400 Bad Request`
- Error message indicates invalid AI output / schema validation
- **No insert** into `kb_docs`
- **No insert** into `kb_audit`

---

### EP05-US01-TC05

- **Test name:** LLM returns JSON wrapped in markdown/code fences → rejected
- **Type:** API / Validation
- **Priority:** P1
- **Automate:** Yes
- **Preconditions:** LLM mocked to return fenced JSON:
  - `json\n{...}\n`

**Steps:**

1. Authenticate as Lead.
2. Mock LLM response to include code fences / extra text.
3. Call `POST /api/kb/add`.

**Expected:**

- `400 Bad Request`
- Clear validation error (no raw LLM dump)
- **No DB writes** (kb_docs + kb_audit)

---

### EP05-US01-TC06

- **Test name:** Prompt whitespace-only returns 400
- **Type:** API / Validation
- **Priority:** P1
- **Automate:** Yes

**Steps:**

1. Authenticate as Lead.
2. Call `POST /api/kb/add` with `{ prompt: "   " }`.

**Expected:**

- `400 Bad Request`
- Error payload indicates prompt is required/invalid
- No DB writes

---

### EP05-US01-TC07

- **Test name:** Prompt too long returns 400/413 (abuse guard)
- **Type:** API / Validation / Abuse
- **Priority:** P2
- **Automate:** Yes
- **Preconditions:** Define max prompt length (e.g. 5k/10k). This test locks behavior.

**Steps:**

1. Authenticate as Lead.
2. Call `POST /api/kb/add` with prompt larger than max.

**Expected:**

- `400 Bad Request` (or `413 Payload Too Large`, whichever you implement)
- Error message is clear
- No DB writes

---

### EP05-US01-TC08

- **Test name:** Audit entry contains actor + change metadata (CREATE)
- **Type:** API / Audit
- **Priority:** P1
- **Automate:** Yes (integration if DB available; otherwise unit with repo mocks)

**Steps:**

1. Authenticate as Lead.
2. Mock LLM valid output.
3. Call `POST /api/kb/add`.
4. Verify `kb_audit` row created.

**Expected:**

- `kb_audit.change_type === "CREATE"`
- `kb_audit.actor_user_id` (or equivalent) matches session user id
- timestamp field exists (`created_at`)
- snapshot contains the created doc (title/text/tags)

---

### EP05-US01-TC09

- **Test name:** Atomicity — if audit insert fails, KB entry is not persisted (or endpoint fails clearly)
- **Type:** API / Consistency
- **Priority:** P1
- **Automate:** Yes (unit-level with mocks)

**Steps:**

1. Authenticate as Lead.
2. Mock `db.kb.addDoc()` succeeds.
3. Mock audit insert throws error.
4. Call `POST /api/kb/add`.

**Expected:**

- `500 Internal Server Error`
- Generic error message
- If you implement rollback/compensation: KB entry not present afterwards
- If no rollback possible: behavior must be explicitly asserted/documented (but don’t pretend success)

---

# EP05-US02 — Update KB Entry via AI (`/api/kb/update`)

### EP05-US02-TC00

- **Test name:** Unauthenticated request returns 401
- **Type:** API / Auth
- **Priority:** P0
- **Automate:** Yes

**Steps:**

1. Call `POST /api/kb/update` with `{ id: "kb-001", prompt: "..." }` and no cookies.

**Expected:**

- `401 Unauthorized`
- Error payload present

---

### EP05-US02-TC04

- **Test name:** Valid JSON but invalid schema returns 400; doc not overwritten
- **Type:** API / Validation
- **Priority:** P0
- **Automate:** Yes

**Steps:**

1. Authenticate as Lead.
2. Ensure doc exists.
3. Mock LLM to return schema-invalid JSON.
4. Call `POST /api/kb/update`.

**Expected:**

- `400 Bad Request`
- Existing `kb_docs` content unchanged
- No audit entry (or audit entry indicates failure only if you _explicitly_ implement failure logging)

---

### EP05-US02-TC05

- **Test name:** Audit contains before/after snapshots + actor (UPDATE)
- **Type:** API / Audit
- **Priority:** P0
- **Automate:** Yes (integration if DB available; otherwise unit with repo mocks)

**Steps:**

1. Authenticate as Lead.
2. Seed a known KB doc state (title/text/tags).
3. Mock LLM valid updated output.
4. Call `POST /api/kb/update`.
5. Read audit entry.

**Expected:**

- `change_type === "UPDATE"`
- `actor_user_id` matches Lead
- `before` snapshot equals original doc
- `after` snapshot equals updated doc
- timestamp exists

---

### EP05-US02-TC06

- **Test name:** Atomicity — if audit write fails, update is not applied
- **Type:** API / Consistency
- **Priority:** P1
- **Automate:** Yes (unit with mocks)

**Steps:**

1. Authenticate as Lead.
2. Mock repo: fetch existing doc OK.
3. Mock audit insert throws.
4. Call `POST /api/kb/update`.

**Expected:**

- `500 Internal Server Error`
- Existing doc remains unchanged

---

# EP05-US01/US02 — UI Additions

### EP05-US01-TC10

- **Test name:** Non-Lead blocked from `/kb` page (authz guard)
- **Type:** UI / Auth Guard
- **Priority:** P0
- **Automate:** Yes (Playwright UI)

**Steps:**

1. Login as Engineer (or inject Engineer cookie).
2. Navigate to `/kb`.

**Expected:**

- Redirect to `/` or `/login` OR forbidden UI state (whatever your app standard is)
- KB management UI elements not visible (prompt textarea, generate button, etc.)

---

### EP05-US01-TC11

- **Test name:** UI distinguishes 400 vs 500 errors (clear messaging)
- **Type:** UI / Error Handling
- **Priority:** P1
- **Automate:** Yes

**Steps:**

1. Login as Lead.
2. Mock `/api/kb/add` to return 400 with `{ error: "Invalid AI output" }`.
3. Submit prompt.

**Expected:**

- User-friendly validation banner shown (non-technical)
- No “success” toast/state

**Steps (500 path):**

1. Mock `/api/kb/add` to return 500.
2. Submit prompt.

**Expected:**

- Generic error banner (“Something went wrong…”)
- No partial/garbled output shown

---

### EP05-US02-TC10

- **Test name:** Update UI shows preview before confirming save
- **Type:** UI / UX
- **Priority:** P2
- **Automate:** Yes

**Steps:**

1. Login as Lead, open `/kb`.
2. Select an existing doc.
3. Enter prompt and click “Generate update”.

**Expected:**

- Preview shows new title/text/tags
- Confirm/save is a separate explicit action
- Cancel leaves doc unchanged

---

## Notes / Implementation Constraints

- Atomicity tests should be unit-level if Databricks doesn’t support easy transactional semantics.
- For LLM output tests, mock `lib/llm.ts` at unit level or intercept the server route call in API tests depending on your setup.
