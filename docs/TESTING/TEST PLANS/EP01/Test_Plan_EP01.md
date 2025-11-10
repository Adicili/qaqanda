# QAQ&A — Test Plan for **EP01: Project Foundation & Tooling**

## 1) Objective
Prove the foundation is solid: app boots, code style enforced, env validated, Playwright ready, structure + runbook in place.

## 2) Scope
**In:** EP01-US01..US04 only (repo/init, lint/format, env validation, Playwright setup).  
**Out:** Business features (auth/ask/kb/reports), CI/CD, Databricks/LLM runtime.

## 3) Approach
Build/config verification + minimal UI smoke via Playwright. Fully scriptable checks, no manual guesswork.

## 4) Environment
- Node 20.x, pnpm
- Next.js 14 (App Router), Tailwind
- Playwright (browsers installed with `--with-deps`)
- OS: Win/macOS/Linux

## 5) Entry / Exit
**Entry:** repo cloned, deps installed.  
**Exit:** all scenarios below pass; README/runbook present; hooks enforce style; Playwright runs green.

---

## 6) Scenarios to Cover (no step detail)

### US01 — Initialize repository & Next.js project
1. Repo initialized (git present, `.gitignore` includes Node/Next/Playwright/env).
2. Next.js boots locally on `http://localhost:3000` (TypeScript + App Router).
3. Tailwind compiles and applies styles (visible class effect on page).
4. Base folders exist:
   ```
   /app /lib /schemas /tests (/tests/pages /tests/ui /tests/api) /public
   ```
5. README contains runbook: install, run, tech stack, Node + pnpm versions.

### US02 — Linting & Formatting
6. ESLint config present (`next/core-web-vitals`), repo lints clean on fresh checkout.
7. Prettier config present; format check passes on clean repo.
8. Husky + lint-staged pre-commit hook blocks bad code (lint/format violations are rejected).
9. `package.json` scripts exist and runnable: `"lint"`, `"format"`.

### US03 — Environment validation
10. `.env.local.example` exists, documents required/optional vars.
11. Env loader (`lib/env.ts`) validates and **fails fast** on missing required vars at runtime.
12. No direct `process.env.*` usage outside the env module (codebase scan clean).

### US04 — Playwright base test structure
13. Playwright installed; `playwright.config.ts` present; browsers installed with `--with-deps`.
14. Test folders exist: `/tests/ui`, `/tests/api`, `/tests/pages`.
15. Smoke spec runs and passes; HTML report generated (either using local dev server or `webServer` in config).

---

## 7) Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Node version drift | Document Node 20.x; optionally add `.nvmrc`/Volta. |
| Hooks not firing (Windows) | Ensure `npm run prepare`; verify `.husky` path and Git core.hooksPath. |
| Tailwind misconfig | Validate PostCSS + `globals.css` imports. |
| Playwright deps missing | Always run `npx playwright install --with-deps`. |

## 8) Evidence to Collect
- Screenshots: home page (Tailwind effect), Playwright HTML report.
- Terminal logs: `pnpm dev`, `pnpm lint`, failed/success pre-commit, env validation error on missing var.
- Snippets: `.eslintrc.*`, `.prettierrc`, `.husky/pre-commit`, `package.json` scripts, `.env.local.example`, project tree.

## 9) Commands (Quick Sheet)
```bash
pnpm install
pnpm dev

pnpm lint
pnpm format
pnpm run prepare   # husky

npx playwright install --with-deps
pnpm test
pnpm test:report   # if defined
```

## 10) Acceptance & Sign-off
- **Pass** when all 15 scenarios above are green with evidence attached.
- **Sign-off:** Tech Lead + QA Lead.
