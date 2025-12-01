# QAQ&A — EP08: CI/CD Pipeline Integration

## Test Plan — **Test_Plan_EP08.md**

---

# 1. Overview

EP08 introduces **continuous integration and continuous delivery (CI/CD)** using **GitHub Actions**.

Objectives:

- Every pull request and push to `main` automatically runs build + quality gates.
- Unit + API + UI tests are executed in CI.
- Test artifacts are uploaded automatically.
- Merges into `main` trigger a staging deployment.
- Sensitive credentials are handled via GitHub Secrets.

This plan defines scope, objectives, entry/exit criteria, risks, and responsibilities.

---

# 2. Objectives

- Validate that CI:
  - Executes lint, type-check, and test commands.
  - Runs Playwright UI tests on Linux runners.
  - Fails the PR if any step fails.

- Validate that CD:
  - Automatically deploys to staging after successful CI.
  - Uses GitHub Actions + Secrets for secured configuration.
  - Blocks deployments when CI is unstable.

- Validate reporting:
  - Playwright HTML reports uploaded on failures.
  - Summary and basic stats available in Actions UI.
  - Optional Slack/email notifications (can be deferred).

---

# 3. Scope

## In Scope

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `package.json` scripts (`lint`, `test`, `type-check`)
- GitHub secrets and environment usage in workflows
- Artifact upload and workflow summaries

## Out of Scope

- Production deployment
- Canary integration gating (belongs to EP03-US04)
- Infrastructure creation
- Load/performance tests

---

# 4. Test Items

## Workflows

- CI workflow (`ci.yml`)
- Deploy workflow (`deploy.yml`)

## Scripts

- `pnpm lint`
- `pnpm tsc --noEmit`
- `pnpm test:unit`
- `pnpm playwright test`

## Artifacts

- `playwright-report` directory
- screenshots / videos
- GitHub Actions run records

## Secrets

- `DATABRICKS_HOST`
- `DATABRICKS_TOKEN`
- `DATABRICKS_WAREHOUSE_ID`
- `OPENAI_API_KEY`

---

# 5. Test Levels & Types

### 5.1 Configuration validation

- Workflow YAML correctness
- Scripts must exist and run
- No hardcoded secrets

### 5.2 Functional CI tests

- Trigger via PR → pipeline is executed
- Lint / Type / Unit / UI must pass
- Pipeline fails early on errors

### 5.3 Deployment tests

- Deployment only after successful CI
- Staging deployment pipeline checks
- Fallback behavior when deploy fails

### 5.4 Reporting & notifications

- Artifact upload
- Job summary
- Optional Slack/email

---

# 6. Test Approach

- Run CI pipeline via PRs
- Validate workflow UI logs
- Create “bad” branches intentionally:
  - Break lint
  - Break type check
  - Break tests
- Verify pipeline blocks merge
- Isolate staging deployment to `main`

---

# 7. Test Data

- Minor README changes for PR CI tests
- Intentionally broken TypeScript or lint
- Small UI test failures for artifact validation

There is **no structured dataset**. All tests are pipeline-driven.

---

# 8. Environments

### CI Environment

- GitHub Actions Runner
- `ubuntu-latest`
- Node 20.x
- pnpm install

### Staging Environment

- Vercel / Azure / other target
- Configured with GitHub Secrets

---

# 9. Entry Criteria

- EP01–EP03 tests passing locally
- Playwright green locally
- Required scripts available (`lint`, `test`, `type-check`)
- GitHub repo Secret permissions active

---

# 10. Exit Criteria

- CI runs on PR + main push
- CI fails builds on quality gate breaks
- Playwright runs headless in CI
- Artifacts uploaded on failure
- Staging deploy triggers on main
- Secrets handled securely

---

# 11. Risks

- Browser dependency mismatch in CI vs local
- Cache corruption
- Staging vs production secrets confusion
- Notification tooling delayed

---

# 12. Mitigation

- Always use `playwright install --with-deps`
- Separate secret naming per environment
- Manual sanity check of first deployments
- Deferred Slack/email integration

---

# 13. Deliverables

- Test_Plan_EP08.md
- Test_Cases_EP08.md
- Test_Report_EP08.md
- Workflow screenshots / pipeline links

---

# 14. Responsibilities

**QA Automation:**

- Define test plan and test cases
- Validate behavior

**Developers / DevOps:**

- Implement workflows
- Configure staging

**Tech Lead / QA Lead:**

- Approve exit criteria

---

# 15. Summary

EP08 ensures all engineering work flows through a **strict CI/CD pipeline**.  
No green pipeline = no merge = no deploy.
