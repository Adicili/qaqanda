# EP05 — Knowledge Base Management (Lead)

## Epic Description

This epic enables QA Leads to manage the application's knowledge base (KB).  
It includes adding and updating KB entries using AI (LLM), auditing all changes, and enforcing access control for the Lead role only.  
This feature expands the system’s core knowledge and ensures that QA Engineers can query an up-to-date KB.

### Epic Completion Criteria

- QA Lead can add and update KB entries via UI and API
- All operations validated and authorized (Lead role only)
- Each change generates an audit entry in Databricks
- Invalid or ambiguous AI output rejected gracefully
- Full test coverage for both happy and negative paths

---

## EP05-US01 — Add Knowledge Base Entry via AI (5 pts)

### Description

As a **QA Lead**, I want to create new KB entries using AI so that the system can expand its stored knowledge automatically.

### Acceptance Criteria

- Endpoint `/api/kb/add` requires Lead role
- Request body `{ prompt: string }` used to generate new KB entry
- LLM must return JSON with fields `{ title, text, tags[] }`
- Invalid or non-JSON LLM output rejected with clear validation error
- Each successful addition creates audit entry in `kb_audit`
- KB entry stored in `kb_docs` table

### Tasks

- **EP05-US01-T01 — Create `/api/kb/add` endpoint**
  1. File: `app/api/kb/add/route.ts`
  2. Auth check: role === 'LEAD' only
  3. Validate request `{ prompt }` with Zod
  4. Call `lib/llm.ts` to generate KB JSON
  5. Validate output using Zod schema `{ title, text, tags: string[] }`
  6. Insert into Databricks using `db.kb.addDoc()`
  7. Log audit entry (`change_type: 'CREATE'`)

- **EP05-US01-T02 — Implement LLM client**
  1. File: `lib/llm.ts`
  2. Use `OPENAI_API_KEY` and `fetch()` for `gpt-4-turbo` or similar model
  3. Force JSON output via prompt engineering (use JSON schema format)
  4. Handle invalid response with explicit error

- **EP05-US01-T03 — Create UI page `/kb` for KB management**
  1. Accessible only for Lead users
  2. Textarea input for AI prompt
  3. “Generate” button triggers `/api/kb/add`
  4. Display generated title/text before confirming save
  5. On success, show toast message “Entry added successfully”

- **EP05-US01-T04 — Add tests (API + UI)**
  - Lead user can add valid KB entry (200)
  - Non-Lead → 403 Forbidden
  - Invalid LLM output → 400 Bad Request
  - UI flow works (prompt → generate → confirm → success)

### Deliverables

```
app/api/kb/add/route.ts
app/kb/page.tsx
lib/llm.ts
tests/api/kb-add.spec.ts
tests/ui/kb-add.spec.ts
```

---

## EP05-US02 — Update Knowledge Base Entry via AI (5 pts)

### Description

As a **QA Lead**, I want to modify existing KB entries with AI assistance so that content remains accurate and up-to-date.

### Acceptance Criteria

- Endpoint `/api/kb/update` requires Lead role
- Request body `{ id, prompt }` used to generate updated entry
- LLM response must match strict JSON schema
- Original document preserved in `kb_audit` before update
- Update logged as `change_type: 'UPDATE'`
- Invalid output rejected without data overwrite

### Tasks

- **EP05-US02-T01 — Create `/api/kb/update` endpoint**
  1. File: `app/api/kb/update/route.ts`
  2. Validate input `{ id, prompt }`
  3. Fetch existing doc from DB
  4. Call LLM client to generate new version
  5. Validate new JSON response
  6. Write audit log entry with before/after snapshot
  7. Update `kb_docs` with new data

- **EP05-US02-T02 — Update UI `/kb` page**
  1. Add table or list view of existing KB docs
  2. Select doc → open edit modal with prompt box
  3. Preview updated version before saving
  4. Confirm updates visually

- **EP05-US02-T03 — Add tests (API + UI)**
  - Valid update → 200 and audit entry created
  - Missing/invalid ID → 404
  - Invalid LLM output → 400
  - Non-Lead → 403

### Deliverables

```
app/api/kb/update/route.ts
app/kb/page.tsx (extended with edit functionality)
tests/api/kb-update.spec.ts
tests/ui/kb-update.spec.ts
```

---

## ✅ EP05 Epic Done When

- Lead users can add and update KB entries
- AI outputs validated strictly (JSON schema enforced)
- All changes logged in audit table
- Unauthorized or invalid requests handled safely
- End-to-end flow tested through UI + API
