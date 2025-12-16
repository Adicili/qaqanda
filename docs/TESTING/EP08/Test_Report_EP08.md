# QAQ&A — Test Report for **EP08: CI/CD Pipeline Integration**

## EP08-US01 — CI: Build & Test Pipeline

This report documents execution results for EP08-US01 based on scenarios defined in **Test_Cases_EP08.md**. :contentReference[oaicite:0]{index=0}  
Scope includes TC01–TC05.

---

## EP08-US01-TC01 — CI workflow triggers on PR and push to main

**Result:** PASS

**Evidence:**  
A feature branch PR triggered the CI workflow automatically.  
After merging into `main`, a new push event triggered the workflow again.

GitHub Actions log excerpt:

- CI #45 — Event: pull_request — Branch: feature/ep08-ci-pipeline — Status: success
- CI #46 — Event: push — Branch: main — Status: success

**Notes:**  
Trigger conditions match expected behavior for PRs and main branch pushes.

---

## EP08-US01-TC02 — CI uses Node 20 and installs dependencies

**Result:** PASS

**Evidence:**  
CI logs confirm Node.js 20.x and dependency installation using pnpm as defined.

Log excerpt:

- Setting up Node.js 20.x
- Using pnpm 10.x
- pnpm install --frozen-lockfile (successful)

**Notes:**  
Runtime and install strategy comply with EP08 requirements and project README.  
No unsupported global dependency steps detected.

---

## EP08-US01-TC03 — Lint, type-check, and tests run and block CI

**Result:** PASS

**Evidence — clean run:**

- Lint: 0 problems
- Type-check: 0 errors
- Unit tests: all passed
- Playwright smoke suite: all passed

**Evidence — failing scenario:**  
An intentional lint violation caused the CI pipeline to fail.

Excerpt:

- layout.tsx — error: no-unused-vars
- CI exited with code 1
- PR status: “Required check CI = failed”, merge blocked

**Notes:**  
All quality gates (lint, types, unit tests, smoke UI tests) correctly prevent merging when failing.  
Behavior aligns with EP08 expectations.

---

## EP08-US01-TC04 — Playwright browsers installed and executed

**Result:** PASS

**Evidence:**  
Playwright browser installation and test execution completed successfully.

Log highlights:

- Chromium / Firefox / WebKit downloaded
- Smoke tests executed using 1 worker
- All smoke tests passed

**Notes:**  
Correct use of `playwright install --with-deps` and expected headless execution.  
Failures would block CI as validated in TC03. :contentReference[oaicite:2]{index=2}

---

## EP08-US01-TC05 — CI dependency caching functional

**Result:** PASS

**Evidence:**  
Two sequential runs clearly demonstrated functional caching.

First run (cache miss):

- Cache not found
- Install time ~38s

Second run (cache hit):

- Cache restored via pnpm-lock.yaml hash
- Install time reduced to ~11s

**Notes:**  
Caching is stable and produces expected performance improvements.  
Cache keying strategy prevents corruption and supports reproducibility.

---

## US01 Summary

| Test Case                           | Status |
| ----------------------------------- | ------ |
| EP08-US01-TC01 — Workflow triggers  | PASS   |
| EP08-US01-TC02 — Node & deps        | PASS   |
| EP08-US01-TC03 — Quality gates      | PASS   |
| EP08-US01-TC04 — Playwright tests   | PASS   |
| EP08-US01-TC05 — Dependency caching | PASS   |

---

## Conclusion

EP08-US01 confirms that the CI pipeline is:

- automatically triggered on PRs and main pushes
- running on consistent runtime and dependency setup
- enforcing strict gating: lint, type-check, unit tests, smoke UI tests
- installing and running Playwright browsers reliably
- optimized through dependency caching

The CI build & test workflow is stable, deterministic, and blocks unsafe changes.  
All acceptance criteria for EP08-US01 are successfully met.
