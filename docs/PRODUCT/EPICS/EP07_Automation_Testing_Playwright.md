# EP07 — Automation Testing (Playwright)

## Epic Description

This epic sets up and expands the Playwright-based test automation framework for QAQ&A.  
It includes creating Page Object Models (POM) for UI, reusable helpers for authentication, and building complete test coverage for critical user flows across both UI and API.  
The result will be a maintainable automated test suite integrated with CI/CD.

### Epic Completion Criteria

- Base POM structure implemented
- Core UI pages covered by Page Objects
- API tests implemented for auth and core flows
- UI regression tests cover key user journeys
- All tests runnable locally and in CI
- HTML reports generated and archived

---

## EP07-US01 — Page Object Model (POM) Foundation (3 pts)

### Description

As a QA engineer, I need a Page Object Model structure so that UI tests are maintainable, reusable, and scalable.

### Acceptance Criteria

- Base POM folder structure created
- Each core page (Login, Register, Ask, KB, Reports) has its own class
- POM methods use `data-test-id` selectors
- Auth helper available for test login bypass

### Tasks

- **EP07-US01-T01 — Create BasePage and Page classes**
  1. Folder: `tests/pages/`
  2. Create `BasePage.ts` with common actions (goto, click, fill, wait)
  3. Create child classes:
     - `LoginPage`
     - `RegisterPage`
     - `AskPage`
     - `KBPage`
     - `ReportsPage`

- **EP07-US01-T02 — Add Auth helper**
  - File: `tests/helpers/auth.ts`
  - Function `loginViaAPI(role: 'engineer' | 'lead')`
  - Performs login by API and sets cookies in browser context

- **EP07-US01-T03 — Add smoke test to verify POM works**
  - Open homepage, check title, ensure AskPage loads

### Deliverables

```
tests/pages/BasePage.ts
tests/pages/LoginPage.ts
tests/pages/RegisterPage.ts
tests/pages/AskPage.ts
tests/pages/KBPage.ts
tests/pages/ReportsPage.ts
tests/helpers/auth.ts
tests/ui/pom-smoke.spec.ts
```

---

## EP07-US02 — Authentication Flow Tests (3 pts)

### Description

As a QA engineer, I need automated tests for registration and login flows to ensure the authentication system works correctly for both positive and negative cases.

### Acceptance Criteria

- Registration happy path test passes
- Duplicate registration fails with 409
- Login happy and invalid credentials cases covered
- Middleware protection verified (redirects unauthenticated users)

### Tasks

- **EP07-US02-T01 — Create registration flow tests**
  - File: `tests/ui/register-flow.spec.ts`
  - Covers success, duplicate, and invalid form cases

- **EP07-US02-T02 — Create login flow tests**
  - File: `tests/ui/login-flow.spec.ts`
  - Covers valid credentials, wrong password, and redirect after login

- **EP07-US02-T03 — Middleware redirect tests**
  - Access protected page unauthenticated → redirected to `/login`
  - Authenticated → access allowed

### Deliverables

```
tests/ui/register-flow.spec.ts
tests/ui/login-flow.spec.ts
tests/ui/middleware-redirect.spec.ts
```

---

## EP07-US03 — Core Application Flow Tests (5 pts)

### Description

As a QA engineer, I need end-to-end automation for the primary user journeys: asking a question, managing KB entries, and viewing reports.  
These tests ensure the core business flows remain functional after every release.

### Acceptance Criteria

- Ask flow tested: submit → receive answer → context shown
- KB add/update flows tested (Lead only)
- Reports UI loads and displays data
- Tests tagged for smoke vs regression
- CI runtime < 10 minutes

### Tasks

- **EP07-US03-T01 — Implement Ask flow test**
  - File: `tests/ui/ask-flow.spec.ts`
  - Steps: login, submit question, validate answer + context

- **EP07-US03-T02 — Implement KB add/update tests (Lead only)**
  - File: `tests/ui/kb-flows.spec.ts`
  - Steps:
    1. Login as Lead
    2. Open `/kb`
    3. Add new entry via prompt
    4. Update existing entry
    5. Verify audit logged

- **EP07-US03-T03 — Implement Reports test**
  - File: `tests/ui/reports-flow.spec.ts`
  - Steps: login, navigate `/reports`, validate charts render

- **EP07-US03-T04 — Add tagging + smoke config**
  - Use Playwright tags: `@smoke`, `@regression`
  - Configure `playwright.config.ts` to run subsets via `--grep`

### Deliverables

```
tests/ui/ask-flow.spec.ts
tests/ui/kb-flows.spec.ts
tests/ui/reports-flow.spec.ts
playwright.config.ts (updated with tags)
```

---

## ✅ EP07 Epic Done When

- POM classes exist and functional
- Auth flows fully automated
- Ask, KB, and Reports journeys covered
- Tags and Playwright config finalized
- Tests pass locally and in CI within target time
