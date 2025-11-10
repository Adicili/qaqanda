# QAQ&A — Test Strategy (v1.0)

## 1. Purpose & Scope
This document defines the end-to-end testing approach for **QAQ&A**: levels, tools, quality gates, ownership, environments, data, and CI/CD integration.

**In scope**
- Web app (Next.js, App Router)
- API routes (auth, ask, kb, reports)
- Databricks SQL Warehouse integration
- LLM integration (OpenAI) for KB editing and answer refinement

**Out of scope (for now)**
- Mobile clients
- External SSO/IdP
- Full performance & security pentesting (only smoke/guardrails here)

---

## 2. Quality Objectives & Targets
| Area | Objective | Target |
|------|-----------|--------|
| Functional correctness | Critical flows work across UI & API | 100% of P0 flows green |
| Reliability | CI runs consistently | Flake rate < 2% on main |
| Speed | Ask flow (no LLM) | p95 < 1500 ms |
| Security basics | AuthN/Z correctness | 0 auth bypass, cookies secure |
| Coverage | Automation scope of P0+P1 | ≥ 80% of defined P0+P1 test cases automated |
| Accessibility | Key pages pass automated checks | No critical axe violations on /, /login, /kb, /reports |

---

## 3. Test Levels & Types
- **Unit** (fast, isolated): TF-IDF, env loader, validators, role guards, session utils, LLM adapters, Databricks client helpers (HTTP mock).
- **Contract/Component**: API handlers with mocked dependencies (DB/LLM).
- **Integration**: Thin slices against **Databricks dev** (canary only).
- **API** (black-box): `/api/auth/*`, `/api/ask`, `/api/kb/*`, `/api/reports/summary`.
- **E2E UI** (Playwright + POM): Auth, Ask, KB add/update (Lead), Reports.
- **Non-functional (smoke)**: performance timings on Ask; basic security checks (headers/cookies); accessibility (axe).

Automation pyramid emphasis: Unit > API > UI.

---

## 4. Tooling & Frameworks
| Purpose | Tool |
|--------|------|
| UI/E2E/API | **Playwright Test** (UI + API + tracing) |
| POM | Custom classes in `tests/pages/*` |
| Unit/Component | Playwright test runner (node), or Vitest (optional) |
| Assertions | Playwright `expect` |
| Lint/Format | ESLint, Prettier |
| Accessiblity | `@axe-core/playwright` |
| Performance smoke | Playwright timing + custom metrics (optional k6 later) |
| Reports | Playwright HTML report, CI artifacts |
| Contracts/Schema | Zod schemas shared between app and tests |

---

## 5. Environments & Data
### 5.1 Environments
| Env | Purpose | Data | LLM |
|-----|--------|------|-----|
| **Local** | Dev & debugging | Seed users + KB fixtures | Optional |
| **CI** | PR validation | Ephemeral seeded data | Disabled for `/ask` (fallback) |
| **Staging** | Pre-release | Managed seed + manual fixtures | Enabled (rate-limited) |

### 5.2 Test Data Management
- **Seed script** (`scripts/seedDatabricks.ts`) creates:
  - Users: `lead@example.com`, `engineer@example.com`
  - KB docs: 2–3 deterministic entries
- **Isolation**: Prefix IDs with run UID; cleanup optional.
- **LLM tests**: Mock by default. Real LLM only in staging “gated” suite.

---

## 6. Test Selection & Prioritization
Risk-based matrix (Impact × Frequency × Detectability):

**P0 (must automate)**
- Register, Login, Logout
- Route protection & RBAC (Lead vs Engineer)
- Ask flow (TF-IDF) + fallback when LLM unavailable
- KB Add/Update via AI (Lead only) with audit logs
- Reports summary API + UI load

**P1 (should automate)**
- Form validations, error banners
- Empty states & pagination (if added)
- Basic accessibility checks

**P2 (nice-to-have)**
- Edge UI states, toasts, minor UX

---

## 7. Test Design Standards
### 7.1 IDs & Naming
- **Suites**: `tests/ui/*.spec.ts`, `tests/api/*.spec.ts`, `tests/unit/*.spec.ts`
- **POM**: `tests/pages/{LoginPage,AskPage,KBPage,ReportsPage}.ts`
- **Selectors**: `data-test-id="login-email"`, no brittle text/css selectors.

### 7.2 Tags
- `@smoke` (P0 happy paths)
- `@regression` (P0+P1)
- `@api`, `@ui`, `@unit`, `@a11y`, `@perf`
- CI uses `--grep` to select subsets.

---

## 8. LLM Testing Strategy
- **Determinism**: Use low `temperature` (e.g., 0.2) for staging; **mock** in CI.
- **Schema enforcement**: Zod validator in app + mirrored in tests.
- **Fallback**: If LLM call fails → TF-IDF answer must be returned (assert).
- **Prompt regression**: Version prompt templates; snapshot tests for shape, not literal wording.
- **Rate limiting**: Staging suite throttled; never call LLM from PR CI.

---

## 9. Databricks Testing Strategy
- **Unit/Contract**: Mock REST client; verify SQL strings & params (no interpolation).
- **Integration (canary)**: 1–2 tests on dev warehouse to catch auth/network issues.
- **Security**: Ensure tokens never logged; sanitize errors.

---

## 10. Flakiness Control
- Zero `waitForTimeout`; rely on auto-wait + `expect`.
- Retries: 1 retry on CI; `trace: on-first-retry`, `video: retain-on-failure`.
- Network: stub non-critical requests; explicit timeouts.
- Stable fixtures/IDs; no random sleeps.

---

## 11. Accessibility Strategy
- Automated checks with `@axe-core/playwright` on `/`, `/login`, `/kb`, `/reports`.
- Focus order and ARIA labels for inputs/buttons.
- Minimum color-contrast in Tailwind theme.

---

## 12. Performance & Security (Smoke)
- **Perf**: Capture `response.timing()` for `/api/ask`; assert p95 < 1500 ms (local/CI).
- **Headers**: Check `Set-Cookie` has `HttpOnly`, `Secure` (prod), `SameSite=Lax`.
- **Auth**: Attempt to access protected routes without cookie → 302/401; role downgrade → 403.

---

## 13. CI/CD Integration
- **CI gates**: `lint` → `type-check` → `build` → tests (`@smoke` always; `@regression` nightly).
- **Artifacts**: Upload Playwright HTML report, screenshots, videos.
- **Status badges** in `README.md`.
- **Branch rules**: PR required; green checks mandatory; squash merge.

---

## 14. Entry/Exit Criteria
**Entry**
- EP01 foundation done; Playwright installed
- ENV configured; seed data available
- Stable selectors in pages

**Exit (per release)**
- P0 suite green on PR + main
- No blocker/critical defects open
- Reports/Ask/KB basic flows pass on staging
- Artifacts retained ≥ 7 days

---

## 15. Defect Workflow
- Tool: GitHub Issues
- Severity: Blocker/Critical/Major/Minor/Trivial
- Triage within 24h; Blocker fix SLA < 24h
- Link issue ↔ failing test; add reproduction steps + artifacts

---

## 16. Roles & RACI
| Activity | DEV | QA | LEAD |
|----------|-----|----|------|
| Unit tests | R | C | I |
| API tests | C | R | I |
| UI E2E | C | R | I |
| Seed data | C | R | I |
| CI/CD config | R | C | I |
| Release sign-off | C | R | A |

R=Responsible, A=Accountable, C=Consulted, I=Informed

---

## 17. Maintenance & Versioning
- Tests live alongside features; refactor when routes/components change.
- Deprecate flaky tests immediately or quarantine under `@unstable`.
- Version prompt templates and LLM config; log model/latency in audit.

---

## 18. Reporting & Metrics
- Daily CI dashboard (GitHub Actions) with:
  - Pass/fail rate, duration, flake rate
  - Top failing specs, timeouts
- Weekly trend: defects by severity, MTTR, escaped defects.

---

## 19. Traceability
- Link PRD → Requirements (EP/US) → Test suites → CI runs.
- Each spec top comment references EP/US ID(s), e.g.:
  ```ts
  // Covers: EP02-US02, EP02-US03
  ```

---

## 20. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| LLM drift/instability | Mock in CI, low temp in staging, strict schema validation |
| Databricks latency | Cache reads in app layer for tests; canary only for integration |
| Selector brittleness | `data-test-id` only; POM encapsulation |
| Test data conflicts | Namespaced seeds per run; cleanup or unique IDs |
| CI cost/time | Split smoke vs regression; cache deps, headless |

---

## 21. Execution Plan (Initial)
1. Finalize seed + selectors (EP01/EP03).
2. Build **smoke**: login, ask, KB add/update, reports.
3. Expand **API** coverage for negative cases.
4. Add a11y/perf smoke.
5. Nightly regression @ `main`.

---

## 22. Appendix — Tags & CLI
- Run smoke: `npx playwright test --grep @smoke`
- Run UI only: `--grep @ui`
- Show report: `npx playwright show-report`
