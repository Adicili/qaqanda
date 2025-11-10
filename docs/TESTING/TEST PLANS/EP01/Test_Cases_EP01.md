# QAQ&A — Test Cases for EP01: Project Foundation & Tooling

---

## US01 — Initialize Repository & Next.js Project

### EP01-US01-TC01
- **Title:** Git repository initialized and first commit exists  
- **Type:** Process / Repo  
- **Priority:** P0  
- **Automate:** No  
- **Notes:** One-time setup verification.  
- **Steps:**
  1. Run `git rev-parse --is-inside-work-tree` in project root.
  2. Run `git branch --show-current` — should return `main`.
  3. Run `git log --oneline -n 1` — verify initial commit exists.
  4. Confirm `.git/` folder is present.

---

### EP01-US01-TC02
- **Title:** `.gitignore` contains Node/Next/Playwright/env patterns  
- **Type:** Config  
- **Priority:** P1  
- **Automate:** No  
- **Steps:**
  1. Open `.gitignore`.
  2. Confirm it includes: `node_modules`, `.next`, `.env*`, `playwright-report`, `test-results`.
  3. Create temporary `.env.local` and `node_modules/test.tmp` → run `git status` → both should be ignored.

---

### EP01-US01-TC03
- **Title:** Next.js app boots successfully on http://localhost:3000  
- **Type:** Build / Run  
- **Priority:** P0  
- **Automate:** Yes  
- **Steps:**
  1. Run `pnpm install`.
  2. Start app with `pnpm dev`.
  3. Open http://localhost:3000.
  4. Verify page renders without console errors or failed network requests.

---

### EP01-US01-TC04
- **Title:** TypeScript enabled and builds cleanly  
- **Type:** Static Analysis  
- **Priority:** P0  
- **Automate:** Yes  
- **Steps:**
  1. Run `pnpm tsc --noEmit`.
  2. Verify process exits with code 0 (no TS errors).

---

### EP01-US01-TC05
- **Title:** Tailwind compiles and styles apply correctly  
- **Type:** UI Smoke  
- **Priority:** P0  
- **Automate:** Yes  
- **Steps:**
  1. Add `<p className="text-red-500">Test</p>` in `app/page.tsx`.
  2. Run `pnpm dev`.
  3. Verify text is visually red (manual or automated check via Playwright locator style assertion).

---

### EP01-US01-TC06
- **Title:** Base folder structure exists as expected  
- **Type:** Config  
- **Priority:** P1  
- **Automate:** No  
- **Steps:**
  1. Display project structure (`tree -L 2` or similar).
  2. Confirm presence of:
     ```
     /app
     /lib
     /schemas
     /tests (with /ui /api /pages)
     /public
     ```

---

### EP01-US01-TC07
- **Title:** README contains setup, run instructions, and tool versions  
- **Type:** Documentation  
- **Priority:** P2  
- **Automate:** No  
- **Steps:**
  1. Open `README.md`.
  2. Verify it documents install/run instructions and required Node/pnpm versions.

---

## US02 — Linting & Formatting

### EP01-US02-TC01
- **Title:** ESLint configured and passes cleanly  
- **Type:** Static Analysis  
- **Priority:** P0  
- **Automate:** Yes  
- **Steps:**
  1. Run `pnpm lint`.
  2. Verify 0 errors; ensure config includes `"next/core-web-vitals"`.

---

### EP01-US02-TC02
- **Title:** Prettier configured and enforces formatting  
- **Type:** Static Analysis  
- **Priority:** P1  
- **Automate:** Yes  
- **Steps:**
  1. Run `prettier --check .`
  2. Ensure “All matched files use Prettier code style!” output.
  3. Run `prettier --write .` if violations are found.

---

### EP01-US02-TC03
- **Title:** Pre-commit hook blocks lint/format violations  
- **Type:** Process / Hook  
- **Priority:** P0  
- **Automate:** Yes  
- **Steps:**
  1. Introduce a linting error (e.g., unused import).
  2. Stage file and try to commit.
  3. Commit must fail due to Husky hook.
  4. Fix issue → re-commit → must succeed.

---

### EP01-US02-TC04
- **Title:** Lint and Format scripts exist in `package.json`  
- **Type:** Config  
- **Priority:** P1  
- **Automate:** Yes  
- **Steps:**
  1. Open `package.json`.
  2. Verify `"lint": "eslint . --ext .ts,.tsx"` and `"format": "prettier --write ."` scripts exist.

---

## US03 — Environment Variable Validation

### EP01-US03-TC01
- **Title:** `.env.local.example` exists and includes placeholders  
- **Type:** Config  
- **Priority:** P0  
- **Automate:** Yes  
- **Steps:**
  1. Verify `.env.local.example` file exists.
  2. Ensure it includes DATABRICKS_HOST, DATABRICKS_TOKEN, and OPENAI_API_KEY placeholders.

---

### EP01-US03-TC02
- **Title:** App fails fast if required env vars are missing  
- **Type:** Runtime / Guard  
- **Priority:** P0  
- **Automate:** Yes  
- **Steps:**
  1. Temporarily remove `.env.local`.
  2. Run `pnpm dev`.
  3. App should fail to start and output descriptive validation error from `lib/env.ts`.

---

### EP01-US03-TC03
- **Title:** No direct `process.env` usage outside `lib/env.ts`  
- **Type:** Static Analysis  
- **Priority:** P1  
- **Automate:** Yes  
- **Steps:**
  1. Run code search for `process.env.`.
  2. Verify all occurrences are inside `lib/env.ts` only.

---

## US04 — Playwright Base Test Structure

### EP01-US04-TC01
- **Title:** Playwright browsers installed successfully  
- **Type:** Setup  
- **Priority:** P0  
- **Automate:** Yes  
- **Steps:**
  1. Run `npx playwright install --with-deps`.
  2. Verify installation completes without error.

---

### EP01-US04-TC02
- **Title:** `playwright.config.ts` exists and loads correctly  
- **Type:** Config  
- **Priority:** P0  
- **Automate:** Yes  
- **Steps:**
  1. Verify `playwright.config.ts` file exists.
  2. Run a dry test (`npx playwright test --list`) to ensure config loads without exception.

---

### EP01-US04-TC03
- **Title:** Folder structure for tests exists (`/tests/ui`, `/tests/api`, `/tests/pages`)  
- **Type:** Config  
- **Priority:** P1  
- **Automate:** Yes  
- **Steps:**
  1. Verify directories exist within `/tests/`.
  2. Ensure each folder is tracked by git.

---

### EP01-US04-TC04
- **Title:** Smoke spec runs and passes with HTML report generated  
- **Type:** UI Smoke  
- **Priority:** P0  
- **Automate:** Yes  
- **Steps:**
  1. Ensure local server or webServer config is active.
  2. Run `pnpm test` (or `npx playwright test`).
  3. Verify test passes and `playwright-report/index.html` is generated.

---

## Summary

| US | # of Tests | Automated | Focus |
|----|-------------|------------|--------|
| US01 | 7 | 4 | Project + UI setup |
| US02 | 4 | 4 | Lint + Hooks |
| US03 | 3 | 3 | Env validation |
| US04 | 4 | 4 | Playwright setup |

**Total:** 18 test cases  
**Automation coverage:** 83%  
**Responsible:** QA Engineer (setup verification), Lead for final sign-off.

---
