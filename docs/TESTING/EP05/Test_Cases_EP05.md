# Test Cases — EP05 (Knowledge Base Management)

## EP05 — Knowledge Base Management (Lead)

---

## EP05-US01 — Add Knowledge Base Entry via AI (`POST /api/kb/add`)

---

### EP05-US01-TC01

- **Test name:** Unauthenticated request is rejected
- **Type:** API / Auth
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-add-api.spec.ts`
  - Test name: `EP05-US01-TC01 — unauthenticated add rejected`
  - Command:  
    `pnpm test:api -- -g "EP05-US01-TC01"`

**Description:**  
Verify that unauthenticated users cannot add KB entries.

**Steps:**

1. Send `POST /api/kb/add` with valid `{ prompt }` and no auth cookies.

**Expected Result:**

- Status `401 Unauthorized`
- Error payload returned
- No DB writes performed

---

### EP05-US01-TC02

- **Test name:** Non-Lead user cannot add KB entry
- **Type:** API / Security
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-add-api.spec.ts`
  - Test name: `EP05-US01-TC02 — engineer forbidden`
  - Command:  
    `pnpm test:api -- -g "EP05-US01-TC02"`

**Description:**  
Ensure only users with LEAD role can access KB creation.

**Steps:**

1. Authenticate as ENGINEER.
2. Call `POST /api/kb/add` with valid prompt.

**Expected Result:**

- Status `403 Forbidden`
- No KB entry created
- No audit entry created

---

### EP05-US01-TC03

- **Test name:** Lead can add KB entry via AI (happy path)
- **Type:** API
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-add-api.spec.ts`
  - Test name: `EP05-US01-TC03 — lead happy path`
  - Command:  
    `pnpm test:api -- -g "EP05-US01-TC03"`

**Description:**  
Verify that a Lead can successfully create a KB entry using AI-generated content.

**Steps:**

1. Authenticate as LEAD.
2. Call `POST /api/kb/add` with `{ prompt }`.
3. LLM returns valid JSON `{ title, text, tags[] }`.

**Expected Result:**

- Status `200 OK`
- Response contains KB entry ID
- Record inserted into `kb_docs`
- Audit record created with `change_type = CREATE`

---

### EP05-US01-TC04

- **Test name:** Missing or empty prompt is rejected
- **Type:** API / Validation
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-add-api.spec.ts`
  - Test name: `EP05-US01-TC04 — invalid prompt`
  - Command:  
    `pnpm test:api -- -g "EP05-US01-TC04"`

**Description:**  
Validate request body validation for missing or empty prompt.

**Steps:**

1. Authenticate as LEAD.
2. Call endpoint with `{}`, `{ prompt: "" }`, and `{ prompt: "   " }`.

**Expected Result:**

- Status `400 Bad Request`
- Validation error message
- No DB writes

---

### EP05-US01-TC05

- **Test name:** Prompt exceeding max length is rejected
- **Type:** API / Validation / Abuse
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-add-api.spec.ts`
  - Test name: `EP05-US01-TC05 — prompt too long`
  - Command:  
    `pnpm test:api -- -g "EP05-US01-TC05"`

**Description:**  
Ensure overly long prompts are rejected to prevent abuse.

**Steps:**

1. Authenticate as LEAD.
2. Submit prompt exceeding max allowed length.

**Expected Result:**

- Status `400` or `413`
- Clear error message
- No DB writes

---

### EP05-US01-TC06

- **Test name:** Malformed LLM output is rejected
- **Type:** API / AI Validation
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-add-api.spec.ts`
  - Test name: `EP05-US01-TC06 — malformed AI output`
  - Command:  
    `pnpm test:api -- -g "EP05-US01-TC06"`

**Description:**  
Ensure malformed or non-JSON AI output is safely rejected.

**Steps:**

1. Authenticate as LEAD.
2. Mock LLM to return invalid JSON.
3. Call `POST /api/kb/add`.

**Expected Result:**

- Status `400 Bad Request`
- Clear error message
- No KB or audit records created

---

### EP05-US01-TC07

- **Test name:** Schema-invalid AI output is rejected
- **Type:** API / AI Validation
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-add-api.spec.ts`
  - Test name: `EP05-US01-TC07 — schema invalid AI output`
  - Command:  
    `pnpm test:api -- -g "EP05-US01-TC07"`

**Description:**  
Validate strict schema enforcement on AI-generated output.

**Steps:**

1. Authenticate as LEAD.
2. Mock LLM to return JSON with invalid schema (e.g. `tags` not array).
3. Call endpoint.

**Expected Result:**

- Status `400 Bad Request`
- Schema validation error
- No DB writes

---

### EP05-US01-TC08

- **Test name:** Code-fenced JSON output is rejected
- **Type:** API / AI Validation
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-add-api.spec.ts`
  - Test name: `EP05-US01-TC08 — code fence rejection`
  - Command:  
    `pnpm test:api -- -g "EP05-US01-TC08"`

**Description:**  
Ensure AI responses wrapped in markdown/code fences are rejected.

**Steps:**

1. Authenticate as LEAD.
2. Mock LLM to return fenced JSON.
3. Call endpoint.

**Expected Result:**

- Status `400 Bad Request`
- No raw LLM output leaked
- No DB writes

---

### EP05-US01-TC09

- **Test name:** Audit record created on successful KB creation
- **Type:** API / Audit
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API / integration
  - Spec file: `tests/api/kb-add-api.spec.ts`
  - Test name: `EP05-US01-TC09 — audit create`
  - Command:  
    `pnpm test:api -- -g "EP05-US01-TC09"`

**Description:**  
Verify audit trail is created on successful KB creation.

**Steps:**

1. Authenticate as LEAD.
2. Create KB entry successfully.
3. Query audit storage.

**Expected Result:**

- Audit record exists
- `change_type = CREATE`
- Actor user ID matches Lead
- Snapshot contains created doc

---

### EP05-US01-TC10

- **Test name:** Atomicity enforced when audit insert fails
- **Type:** API / Consistency
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API (unit/mocked)
  - Spec file: `tests/api/kb-add-api.spec.ts`
  - Test name: `EP05-US01-TC10 — atomicity`
  - Command:  
    `pnpm test:api -- -g "EP05-US01-TC10"`

**Description:**  
Ensure KB entry is not persisted if audit write fails.

**Steps:**

1. Authenticate as LEAD.
2. Mock audit insert to throw error.
3. Call `POST /api/kb/add`.

**Expected Result:**

- Status `500 Internal Server Error`
- KB entry not persisted (or behavior explicitly documented)

### EP05-US01-TC11

- **Test name:** Lead can access KB management page
- **Type:** UI / Auth / Navigation
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI
  - Spec file: `tests/ui/kb-ui.spec.ts`
  - Test name: `EP05-US01-TC11 — lead can access /kb`

**Description:**  
Verify that a user with LEAD role can access the KB management UI.

**Steps:**

1. Login as LEAD user.
2. Navigate to `/kb`.

**Expected Result:**

- Page loads successfully
- KB prompt textarea is visible
- “Generate” / “Add” action button is visible
- No authorization or redirect errors

---

### EP05-US01-TC12

- **Test name:** Non-Lead user cannot access KB management page
- **Type:** UI / Security
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI
  - Spec file: `tests/ui/kb-ui.spec.ts`
  - Test name: `EP05-US01-TC12 — engineer blocked from /kb`

**Description:**  
Ensure only LEAD users can access the KB management UI.

**Steps:**

1. Login as ENGINEER user.
2. Navigate to `/kb`.

**Expected Result:**

- Access denied (403 UI, redirect, or protected-route behavior)
- KB management UI is not rendered
- User is redirected or shown authorization error

---

### EP05-US01-TC13

- **Test name:** Lead can add KB entry via UI (happy path)
- **Type:** UI / End-to-End
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI
  - Spec file: `tests/ui/kb-ui.spec.ts`
  - Test name: `EP05-US01-TC13 — lead add KB entry via UI`

**Description:**  
Verify that a LEAD user can successfully add a KB entry through the UI.

**Steps:**

1. Login as LEAD user.
2. Navigate to `/kb`.
3. Enter valid AI prompt in textarea.
4. Click “Generate” / “Add”.
5. Wait for successful response.

**Expected Result:**

- Success confirmation shown (toast or inline message)
- New KB entry appears in the KB list
- Entry title/text reflects generated content
- Page remains stable (no reload or crash)

---

### EP05-US01-TC14

- **Test name:** UI shows error when KB add fails
- **Type:** UI / Error Handling
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI
  - Spec file: `tests/ui/kb-ui.spec.ts`
  - Test name: `EP05-US01-TC14 — kb add error surfaced in UI`

**Description:**  
Ensure backend errors during KB creation are surfaced clearly in the UI.

**Steps:**

1. Login as LEAD user.
2. Navigate to `/kb`.
3. Mock `/api/kb/add` to return `400` or `500`.
4. Enter prompt and submit.

**Expected Result:**

- Clear error message displayed to user
- No KB entry added to list
- UI remains usable after error

---

## EP05-US02 — Update Knowledge Base Entry via AI (`POST /api/kb/update`)

---

### EP05-US02-TC01

- **Test name:** Unauthenticated update request is rejected
- **Type:** API / Auth
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-update-api.spec.ts`
  - Test name: `EP05-US02-TC01 — unauthenticated update rejected`
  - Command:  
    `pnpm test:api -- -g "EP05-US02-TC01"`

**Description:**  
Verify that unauthenticated users cannot update existing KB entries.

**Steps:**

1. Send `POST /api/kb/update` with `{ id, prompt }` and no auth cookies.

**Expected Result:**

- Status `401 Unauthorized`
- Error payload returned
- No KB changes
- No audit entry created

---

### EP05-US02-TC02

- **Test name:** Non-Lead user cannot update KB entry
- **Type:** API / Security
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-update-api.spec.ts`
  - Test name: `EP05-US02-TC02 — engineer forbidden`
  - Command:  
    `pnpm test:api -- -g "EP05-US02-TC02"`

**Description:**  
Ensure only users with LEAD role can update KB entries.

**Steps:**

1. Authenticate as ENGINEER.
2. Call `POST /api/kb/update` with valid `{ id, prompt }`.

**Expected Result:**

- Status `403 Forbidden`
- No KB changes
- No audit entry created

---

### EP05-US02-TC03

- **Test name:** Lead can update KB entry via AI (happy path)
- **Type:** API
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-update-api.spec.ts`
  - Test name: `EP05-US02-TC03 — lead happy path update`
  - Command:  
    `pnpm test:api -- -g "EP05-US02-TC03"`

**Description:**  
Verify that a Lead can successfully update an existing KB entry using AI-generated content.

**Preconditions:**

- Existing KB entry present
- Authenticated user with role `LEAD`
- LLM mocked to return valid updated JSON `{ title, text, tags[] }`

**Steps:**

1. Authenticate as Lead.
2. Send `POST /api/kb/update` with `{ id, prompt }`.
3. LLM returns valid updated JSON.

**Expected Result:**

- Status `200 OK`
- `kb_docs` updated with new content
- Audit record created with `change_type = UPDATE`
- Audit contains before/after snapshot

---

### EP05-US02-TC04

- **Test name:** Update with non-existent KB ID returns 404
- **Type:** API / Validation
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-update-api.spec.ts`
  - Test name: `EP05-US02-TC04 — non-existent KB id`
  - Command:  
    `pnpm test:api -- -g "EP05-US02-TC04"`

**Description:**  
Verify that updating a non-existent KB entry is handled gracefully.

**Steps:**

1. Authenticate as Lead.
2. Send `POST /api/kb/update` with invalid or non-existent `id`.

**Expected Result:**

- Status `404 Not Found`
- No DB updates
- No audit entry created

---

### EP05-US02-TC05

- **Test name:** Invalid AI output does not overwrite KB entry
- **Type:** API / Data Integrity
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/kb-update-api.spec.ts`
  - Test name: `EP05-US02-TC05 — invalid AI output`
  - Command:  
    `pnpm test:api -- -g "EP05-US02-TC05"`

**Description:**  
Ensure malformed or schema-invalid AI output does not corrupt existing KB data.

**Steps:**

1. Authenticate as Lead.
2. Mock LLM to return invalid or malformed JSON.
3. Call `POST /api/kb/update`.

**Expected Result:**

- Status `400 Bad Request`
- Original KB entry remains unchanged
- No audit entry created

---

### EP05-US02-TC06

- **Test name:** Audit record created on successful KB update
- **Type:** API / Audit
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API / integration
  - Spec file: `tests/api/kb-update-api.spec.ts`
  - Test name: `EP05-US02-TC06 — audit update`
  - Command:  
    `pnpm test:api -- -g "EP05-US02-TC06"`

**Description:**  
Verify audit trail integrity for KB updates.

**Steps:**

1. Perform successful KB update as Lead.
2. Query audit storage.

**Expected Result:**

- Audit record exists
- `change_type = UPDATE`
- Correct actor user ID
- Timestamp present
- Before/after snapshots stored

---

### EP05-US02-TC07

- **Test name:** Atomicity enforced when audit update fails
- **Type:** API / Consistency
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API (unit-level with mocks)
  - Spec file: `tests/api/kb-update-api.spec.ts`
  - Test name: `EP05-US02-TC07 — atomicity on update`
  - Command:  
    `pnpm test:api -- -g "EP05-US02-TC07"`

**Description:**  
Ensure KB update is not persisted if audit write fails.

**Steps:**

1. Authenticate as Lead.
2. Mock audit insert to throw error.
3. Call update endpoint.

**Expected Result:**

- Status `500 Internal Server Error`
- KB entry remains unchanged

---

### EP05-US02-TC08

- **Test name:** Lead can update KB entry via UI
- **Type:** UI / End-to-End
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI
  - Spec file: `tests/ui/kb-ui.spec.ts`
  - Test name: `EP05-US02-TC08 — lead update KB entry via UI`

**Description:**  
Verify that a LEAD user can update an existing KB entry using the UI.

**Preconditions:**

- At least one KB entry exists

**Steps:**

1. Login as LEAD user.
2. Navigate to `/kb`.
3. Select an existing KB entry.
4. Enter update prompt.
5. Click “Generate Update” / “Save”.

**Expected Result:**

- Update succeeds with confirmation message
- KB entry content reflects updated version
- Updated entry visible in list/detail view

---

### EP05-US02-TC09

- **Test name:** UI shows error when KB update fails
- **Type:** UI / Error Handling
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI
  - Spec file: `tests/ui/kb-ui.spec.ts`
  - Test name: `EP05-US02-TC09 — kb update error surfaced in UI`

**Description:**  
Ensure backend errors during KB update do not corrupt UI state.

**Steps:**

1. Login as LEAD user.
2. Navigate to `/kb`.
3. Select an existing KB entry.
4. Mock `/api/kb/update` to return `400` or `500`.
5. Attempt update.

**Expected Result:**

- Error message displayed clearly
- KB entry remains unchanged
- UI remains stable and usable
