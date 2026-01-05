# Test Plan — EP05 (Knowledge Base Management)

## Epic

**EP05 — Knowledge Base Management (Lead)**

---

## Objective

The goal of EP05 testing is to verify that **QA Leads** can safely and reliably manage the Knowledge Base (KB) using AI assistance, while ensuring:

- Strict **role-based access control** (Lead-only)
- **LLM output validation** (schema-enforced JSON)
- **Auditability** of all changes
- **System stability** in the presence of invalid AI output or user input

This test plan focuses on **functional correctness**, **security**, and **data integrity** across API and UI layers.

---

## In Scope

- Adding new KB entries via AI (`EP05-US01`)
- Updating existing KB entries via AI (`EP05-US02`)
- Role enforcement (Lead vs non-Lead)
- LLM output validation and error handling
- Audit logging to Databricks
- UI flows for KB management

---

## Out of Scope

- LLM quality or semantic correctness of generated content
- Full accessibility (WCAG compliance)
- Performance/load testing of LLM calls
- Databricks infrastructure validation (covered elsewhere)

---

## Test Levels & Strategy

### 1. API Testing (Primary)

Focus:

- Authorization
- Input/output validation
- Database writes
- Audit logging

Approach:

- Playwright API tests
- LLM calls mocked or stubbed
- Databricks mocked where appropriate

---

### 2. UI Testing (Critical Flows)

Focus:

- Lead-only access to KB UI
- Prompt → generate → preview → confirm flows
- Error messaging for invalid AI output or permissions

Approach:

- Playwright UI tests
- API responses mocked for deterministic behavior

---

### 3. Negative & Security Testing

Focus:

- Non-Lead access attempts
- Invalid or malformed LLM output
- Missing or invalid request payloads
- Prevention of partial writes or silent failures

---

## Entry Criteria

- Authentication and role system fully operational
- Databricks mock or dev environment available
- LLM client stubbed or real key configured (test-safe)
- Existing KB repository layer tested and stable (EP03)

---

## Exit Criteria

- All P0 and P1 test cases passing
- No unauthorized access paths exist
- All successful KB mutations generate audit records
- Invalid AI output never persists data
- UI flows validated end-to-end

---

## Risks & Mitigations

| Risk                         | Mitigation                                 |
| ---------------------------- | ------------------------------------------ |
| Non-deterministic LLM output | Strict JSON schema validation + mocking    |
| Accidental data overwrite    | Audit-first, write-after-validate strategy |
| Role bypass via UI           | API-level role enforcement + UI guards     |
| Flaky UI tests               | API mocking + stable selectors             |

---

## Test Coverage Overview

### EP05-US01 — Add KB Entry via AI

| Area                | Covered |
| ------------------- | ------- |
| Lead authorization  | ✅      |
| Request validation  | ✅      |
| LLM JSON validation | ✅      |
| KB insert           | ✅      |
| Audit logging       | ✅      |
| UI happy path       | ✅      |
| Error handling      | ✅      |

---

### EP05-US02 — Update KB Entry via AI

| Area                | Covered |
| ------------------- | ------- |
| Lead authorization  | ✅      |
| Existing doc fetch  | ✅      |
| LLM JSON validation | ✅      |
| Before/after audit  | ✅      |
| Update persistence  | ✅      |
| UI edit flow        | ✅      |
| Error handling      | ✅      |

---

## Test Artifacts

Planned test deliverables:

```
tests/api/kb-add.spec.ts
tests/api/kb-update.spec.ts
tests/ui/kb-add.spec.ts
tests/ui/kb-update.spec.ts
```

---

## Responsibilities

- **Test Design & Automation:** QA Engineer
- **Review & Approval:** QA Lead
- **LLM Prompt Validation:** QA Lead
- **CI Integration:** QA Engineer

---

## Summary

EP05 testing ensures that **AI-assisted Knowledge Base management is safe, auditable, and Lead-controlled**.  
The emphasis is on **defensive validation**, **clear failure modes**, and **traceability of changes**, making this epic a critical foundation for long-term KB quality.

```

```
