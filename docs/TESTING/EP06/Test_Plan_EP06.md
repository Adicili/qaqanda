# Test Plan – EP06

## 1. Introduction

This document defines the testing strategy for **EP06** within the QA Playwright portfolio project.

EP06 is expected to represent a clear step up in quality and maturity compared to previous epics. If it does not introduce new risks, new testing depth, or better structure, then it fails as a portfolio artifact. This plan exists to prevent shallow, checkbox-style testing.

---

## 2. Testing Objectives

The primary objectives of EP06 testing are:

- Validate all functional requirements defined in the EP06 scope
- Detect integration and regression risks introduced by EP06 changes
- Demonstrate advanced Playwright usage (architecture, stability, readability)
- Prove understanding of _risk-based testing_, not just automation mechanics

Tests that only prove the happy path are considered weak and insufficient.

---

## 3. Scope of Testing

### In Scope

- All features and user flows explicitly defined in EP06 documentation
- UI behavior, state changes, and validations related to EP06
- Error handling and negative scenarios relevant to EP06 functionality
- Regression coverage of impacted areas from previous epics
- Playwright test structure, fixtures, hooks, and configuration related to EP06

### Out of Scope

- Backend logic not exposed through the UI
- Performance or load testing (unless explicitly stated in EP06 requirements)
- Third-party services outside project control
- Features not affected by EP06 changes

If something is “out of scope” but can easily break because of EP06, that’s a design flaw, not an excuse.

---

## 4. Test Types

The following test types will be executed:

- **Functional UI Tests** – core EP06 scenarios
- **Negative Tests** – invalid inputs, incorrect flows, edge cases
- **Regression Tests** – critical flows from previous epics
- **Smoke Tests** – basic validation to confirm EP06 stability
- **Exploratory Testing (manual)** – to uncover unexpected behavior automation may miss

If EP06 only relies on automated happy-path tests, it is incomplete.

---

## 5. Test Approach

### Automation Strategy

- Playwright is the primary automation framework
- Tests are written using a modular, maintainable structure
- Page Object Model or equivalent abstraction is used where justified
- Hard waits are forbidden; only explicit, meaningful waits are acceptable
- Tests must be deterministic and environment-agnostic

Flaky tests are worse than no tests. They destroy trust.

### Manual Testing

- Manual testing will focus on:
  - UX inconsistencies
  - Visual feedback
  - Unexpected user behavior
- Findings from manual testing should inform future automated coverage

---

## 6. Test Environment

- Browser(s): Chromium (mandatory), others optional if supported
- Environment: Local or test environment defined in project configuration
- Test data: Controlled, reusable, and resettable

If tests depend on “magic data” or manual setup, the design is broken.

---

## 7. Entry Criteria

Testing can start when:

- EP06 requirements are finalized and documented
- Application is deployable and accessible
- Test environment is stable
- No critical blockers exist from previous epics

Starting tests without clear requirements is amateur behavior.

---

## 8. Exit Criteria

Testing is considered complete when:

- All planned EP06 test cases are executed
- Critical and high-severity defects are resolved or formally accepted
- No blocking regressions remain
- Test results are documented and reproducible

“Works on my machine” is not an exit criterion.

---

## 9. Risks and Mitigation

### Identified Risks

- Poor test structure leading to unmaintainable code
- Over-automation of trivial scenarios
- Missing negative and edge cases
- Flaky tests caused by timing or environment dependency

### Mitigation

- Enforce code reviews for test code
- Prioritize risk-based scenarios
- Refactor aggressively when duplication appears
- Fail fast on instability instead of ignoring it

---

## 10. Deliverables

- Automated Playwright test suite for EP06
- Test execution results
- Documented defects (if any)
- Updated documentation reflecting EP06 coverage

If EP06 cannot clearly show _what_ is tested and _why_, it does not belong in a serious QA portfolio.

---

## 11. Approval

This test plan serves as the baseline for EP06 testing activities.  
Any deviation must be justified by scope change or risk reassessment, not laziness.
