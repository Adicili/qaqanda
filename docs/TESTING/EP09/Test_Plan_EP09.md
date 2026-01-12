# Test Plan – EP09

## 1. Introduction

This document defines the testing strategy for **EP09 — LLM Integration & AI Enhancement**.

EP09 is a **high-risk, high-value epic**. It introduces an external, non-deterministic dependency (LLM) into core product flows. If this epic is tested lazily, it will produce **silent failures, corrupted data, and false confidence**.

This plan is written to prevent that.

---

## 2. Testing Objectives

The primary objectives of EP09 testing are:

- Validate correct integration with a real LLM via a unified client
- Ensure **strict JSON schema validation** for all AI outputs
- Verify **safe failure and fallback behavior** when AI output is invalid or unavailable
- Confirm that AI usage does **not break existing core flows** (`/ask`, `/kb/add`, `/kb/update`)
- Ensure configuration via environment variables is respected and testable

If an invalid AI response can reach the database or the UI, EP09 has failed.

---

## 3. Scope of Testing

### In Scope

- `lib/llm.ts` client behavior
- Schema validation logic for LLM output
- `/api/ask` LLM-enhanced flow and fallback logic
- `/api/kb/add` and `/api/kb/update` AI-assisted operations
- Error handling, logging, and latency tracking
- Environment configuration handling (`OPENAI_*` variables)

### Out of Scope

- Model training or fine-tuning
- Prompt quality or semantic correctness of answers
- LLM provider uptime or SLA guarantees
- Cost optimization or token usage tuning (beyond logging)

Testing whether the AI is “smart” is irrelevant. Testing whether it is **safe** is mandatory.

---

## 4. Test Types

The following test types will be executed:

- **Unit Tests**
  - LLM client logic
  - JSON schema validation
  - Error and exception handling
- **API Integration Tests**
  - `/api/ask` with LLM success and failure
  - `/api/kb/add` and `/api/kb/update` with valid and invalid AI output
- **Negative & Security Tests**
  - Malformed AI responses
  - Missing or invalid permissions
  - Missing environment configuration
- **Regression Tests**
  - Ensure previous non-AI behavior still works via fallback paths

End-to-end UI testing is intentionally minimal here. This epic is backend-heavy.

---

## 5. Test Approach

### LLM Mocking Strategy

- All tests **must mock the LLM API**
- No real external calls in CI
- Mocked responses must include:
  - Valid JSON
  - Invalid JSON
  - Wrong schema
  - Timeouts / network errors

If tests rely on real OpenAI responses, the test suite is unprofessional.

### Validation Strategy

- AI output is accepted **only if schema validation passes**
- Any parsing or validation failure must:
  - Prevent DB writes
  - Return a clear, explicit error
  - Be logged

Silent coercion or partial parsing is forbidden.

---

## 6. Test Environment

- Environment variables provided via `.env.example` and test config
- LLM calls fully mocked at HTTP or client layer
- Deterministic test data for KB and queries
- Logging enabled for latency and model metadata

If a test depends on a real API key, it is invalid.

---

## 7. Entry Criteria

Testing can start when:

- EP09 requirements are finalized
- `lib/llm.ts` interface is defined
- JSON schema for AI output is agreed upon
- Existing `/ask` and KB flows are stable

Starting before schema definition guarantees rework.

---

## 8. Exit Criteria

Testing is considered complete when:

- All EP09 test cases pass
- Invalid AI output never reaches persistence or UI
- Fallback logic works reliably without LLM
- All AI-related errors are logged with context
- No regressions in existing non-AI flows

“AI usually works” is not an exit criterion.

---

## 9. Risks and Mitigation

### Identified Risks

- Non-deterministic AI output causing flaky tests
- Invalid or partial JSON corrupting KB data
- Hidden failures masked by fallback logic
- Environment misconfiguration causing runtime crashes
- Overconfidence in AI responses

### Mitigation

- Aggressive mocking and schema validation
- Explicit negative test cases
- Clear separation between AI logic and core logic
- Fail fast on validation errors
- Log everything related to AI execution

If AI breaks something silently, the tester failed.

---

## 10. Deliverables

- Unit tests for LLM client and validators
- API tests covering success, failure, and fallback scenarios
- Updated `.env.example`
- Logs verifying latency and model usage
- Documentation clarifying AI limitations and fallback behavior

EP09 should demonstrate **engineering discipline around AI**, not hype.

---

## 11. Approval

This test plan defines the minimum acceptable testing standard for EP09.  
Any shortcuts here will surface later as production incidents or data corruption.

AI does not excuse bad testing — it demands better testing.
