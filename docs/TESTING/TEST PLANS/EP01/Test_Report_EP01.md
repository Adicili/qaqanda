# QAQ&A — Test Report for EP01: Project Foundation & Tooling

---

## US01 — Initialize Repository & Next.js Project

### EP01-US01-TC01 - **Title:** Git repository initialized and first commit exists

**Result:** ✅ PASS  
**Evidence:**

````bash
PS C:\Users\adier\Documents\QAQandA> git rev-parse --is-inside-work-tree
true
PS C:\Users\adier\Documents\QAQandA> git branch --show-current
main
PS C:\Users\adier\Documents\QAQandA> git log --oneline -n 1
cafa807 (HEAD -> main) reverted test changes

Notes: Repository successfully initialized, default branch is main, initial commit present.

### EP01-US01-TC02 - **Title:** `.gitignore` contains Node/Next/Playwright/env patterns


**Result:** ✅ PASS

**Evidence:**
```bash
$ cat .gitignore | grep -E "node_modules|.next|.env|playwright|test-results"
node_modules
.next
.env*
playwright-report
test-results

$ echo TEST > .env.local
$ echo TEST > node_modules/test.tmp
$ git status
On branch main
nothing to commit, working tree clean

Notes: All critical ignore patterns present. Environment and build/test outputs properly excluded from Git tracking.

### EP01-US01-TC03 —- **Title:** Next.js app boots successfully on http://localhost:3000
**Result:** ✅ PASS

**Evidence:**
```bash
PS C:\Users\adier\Documents\QAQandA> pnpm install
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 604ms using pnpm v10.21.0
PS C:\Users\adier\Documents\QAQandA> pnpm dev

> qaqanda@0.1.0 dev C:\Users\adier\Documents\QAQandA
> next dev

   ▲ Next.js 16.0.1 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://192.168.68.51:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1149ms
 GET / 200 in 1823ms (compile: 1737ms, render: 86ms)

Browser Output:
Landing page renders successfully with title “To get started, edit the page.tsx file.
Looking for a starting point or more instructions? Head over to Templates or the Learning center.”.
No console errors or failed network requests.

Notes:
Next.js dev server runs cleanly, hot reload verified.
Environment validated on Node v20.x, pnpm v10.x, Windows 11 + Git Bash.

**Automation Debt:**
- **Ticket:** `EP07-TC03-AUTO` — Playwright spec `tests/ui/app-boot.spec.ts`
- **Automation Acceptance:**
  - Captures console errors and fails on any `error` event.
  - Fails on any HTTP response `status >= 400`.
  - Verifies page title/body are rendered and visible.
- **Definition of Done:** Runs headless in CI, HTML report stored, tag `@us01 @tc03`.

#### EP01-US01-TC04 - **Title:** TypeScript enabled and builds cleanly
**Result:** ✅ PASS

**Evidence:**
```bash
$ pnpm tsc --noEmit
Found 0 errors.

**Automation Debt:**
- **Ticket:** `EP07-TC04-AUTO` — Node shell test `tests/pages/tsc-build.spec.ts`
- **Automation Acceptance:**
  - Executes `pnpm tsc --noEmit`.
  - Fails the test on non-zero exit code.
- **Definition of Done:** Runs in CI with log artifacts, tag `@us01 @tc04`.


#### EP01-US01-TC05 — Tailwind compiles and styles apply correctly

**Result:** ✅ PASS

**Evidence:**
UI Check:
Text “Test” rendered in red

Notes:
Tailwind successfully compiled via PostCSS pipeline.
Global CSS imports and Tailwind directives resolved without errors.

**Automation Debt:**
- **Ticket:** `EP07-TC05-AUTO` — Playwright spec `tests/ui/tailwind-style.spec.ts`
- **Automation Acceptance:**
  - Uses `data-test-id="tw-red"` selector.
  - Asserts computed CSS color equals `rgb(239, 68, 68)`.
- **Definition of Done:** Stable selector, no flakiness in CI, tag `@us01 @tc05`.

#### EP01-US01-TC06 — Base folder structure exists as expected

**Result:** ✅ PASS

**Evidence:**
```bash
$ tree -L 2
.
├── src
     |--app
         ├── layout.tsx
         └── page.tsx
├── lib
├── schemas
├── tests
│   ├── ui
│   ├── api
│   └── pages
├── public
├── package.json
└── tsconfig.json

Notes:
All base folders exist and match EP01 structure definition.
No legacy /pages directory detected.
Directory setup aligned with Next.js App Router

#### EP01-US01-TC07 — README contains setup, run instructions, and tool versions

**Result:** ✅ PASS

**Evidence:**
```bash
PS C:\Users\adier\Documents\QAQandA> cat README.md | head -n 20
# QAQandA App

Internal QA & Knowledge Management tool built with **Next.js (App Router)**, **TypeScript**, **TailwindCSS**, and **Playwright**.
Project adheres to EP01 setup and follows strict linting, testing, and CI/CD standards.

---

## ???? Prerequisites

| Tool | Version |
|------|----------|
| Node.js | >= 20.x |
| pnpm | >= 10.x |
| TypeScript | >= 5.x |
| Playwright | >= 1.48.x |

> Check your setup:
> ```bash
> node -v
> pnpm -v
````
