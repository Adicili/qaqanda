# QAQ&A — EP08: CI/CD Pipeline Integration

## Test Cases — **Test_Cases_EP08.md**

---

# Scope

Covers:

- US01 — CI build & testing pipeline
- US02 — Deployment pipeline
- US03 — Reporting & notifications

---

# EP08-US01 — CI: Build & Test Pipeline

## EP08-US01-TC01 — CI workflow triggers on PR and push to main

**Type:** Process / Config  
**Priority:** P0  
**Automation:** Manual validation via GitHub Actions

**Steps:**

1. Create a test PR.
2. Observe CI.
3. Push to `main`.
4. Confirm CI runs again.

**Expected:**

- Workflow auto-runs on PR.
- Workflow auto-runs on push to main.

---

## EP08-US01-TC02 — CI uses Node 20 and installs dependencies

**Type:** Config  
**Priority:** P0

**Steps:**

1. Inspect CI logs.
2. Verify Node version.
3. Confirm dependency install type.

**Expected:**

- Node v20.x
- pnpm/npm consistent with project
- No global hacks

---

## EP08-US01-TC03 — Lint, type-check, and tests run and block CI

**Type:** Pipeline  
**Priority:** P0

**Steps:**

1. Push clean branch → expect success.
2. Introduce:
   - lint violation
   - TS type error
   - failing unit test
3. Push each scenario.

**Expected:**

- Entire CI fails.
- PR blocked.

---

## EP08-US01-TC04 — Playwright browsers installed and executed

**Type:** Pipeline  
**Priority:** P1

**Steps:**

1. Inspect CI logs.
2. Confirm:
   - `playwright install --with-deps`
   - Playwright test execution

**Expected:**

- Install successful.
- Tests executed.
- Failures block PR.

---

## EP08-US01-TC05 — CI dependency caching functional

**Type:** Optimization  
**Priority:** P3

**Steps:**

1. Record first run install time.
2. Trigger CI again without lockfile changes.

**Expected:**

- Cache hit.
- Faster install.
- No corruption.

---

# EP08-US02 — Deployment Pipeline

## EP08-US02-TC06 — Deployment triggers on push to main

**Type:** Process  
**Priority:** P0

**Steps:**

1. Merge PR into main.
2. Observe GitHub Actions.

**Expected:**

- `deploy.yml` workflow starts.

---

## EP08-US02-TC07 — Deployment uses GitHub Secrets

**Type:** Security  
**Priority:** P0

**Steps:**

1. Review deploy.yml.
2. Check if secrets used.

**Expected:**

- All credentials use `${{ secrets.NAME }}`
- No hardcoded passwords/tokens.

---

## EP08-US02-TC08 — Deployment gated by CI success

**Type:** Pipeline  
**Priority:** P1

**Steps:**

1. Push failing PR → blocked merge → no deploy.
2. Push successful PR → merge → deploy.

**Expected:**

- No deployment with failing CI.
- Deploy after green CI.

---

## EP08-US02-TC09 — README displays CI/CD badges (optional)

**Type:** Documentation  
**Priority:** P3

**Steps:**

1. Open README.
2. Inspect badges.

**Expected:**

- Build badge present.
- Deployment badge optional.

---

# EP08-US03 — CI Reporting & Notifications

## EP08-US03-TC10 — Playwright HTML report uploaded as artifact

**Type:** Reporting  
**Priority:** P1

**Steps:**

1. Break a UI test.
2. Trigger CI.
3. Inspect artifacts.

**Expected:**

- `playwright-report` downloadable.
- Includes screenshots/videos.

---

## EP08-US03-TC11 — CI job summary displays key stats

**Type:** Reporting  
**Priority:** P2

**Steps:**

1. Trigger successful CI.
2. Inspect summary.

**Expected:**

- Total tests
- Failures
- Duration
- Commit info

---

## EP08-US03-TC12 — Slack/email notifications on failure (Deferred)

**Type:** Notification  
**Priority:** P3  
**Status:** Deferred

**Expected:**

- Document integration approach.
- Implement after EP08 baseline.

---

# Summary

| ID Range  | Area             | Priority | Status  |
| --------- | ---------------- | -------- | ------- |
| TC01–TC05 | CI test pipeline | P0–P3    | Planned |
| TC06–TC09 | Deployment       | P0–P3    | Planned |
| TC10–TC12 | Reporting/Notify | P1–P3    | Planned |

EP08 focuses on **pipeline reliability**, not just “CI exists”.
PRs must fail loudly, deployments must be gated, artifacts must be inspectable.
