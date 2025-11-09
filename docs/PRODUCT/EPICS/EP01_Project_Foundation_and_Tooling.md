# EP01 — Project Foundation & Tooling

## Epic Description
This epic establishes the technical foundation of the QAQ&A application.  
It covers repository setup, framework initialization, coding standards, environment handling, and test framework bootstrapping.  
All future development depends on this epic being completed.

### Epic Completion Criteria
- Project can be cloned,7 installed, built, and run locally
- Coding standards enforced (lint + format)
- Environment variables validated at runtime
- Playwright test framework installed and executable
- Base folder structure and commit rules established
- README contains setup instructions

---

## EP01-US01 — Initialize repository & Next.js project (3 pts)

### Description  
As a developer, I need the base application scaffolded so the project can run locally and other features can be developed on top of it.

### Acceptance Criteria
- Project runs via `pnpm dev`
- Next.js App Router enabled
- TypeScript enabled
- TailwindCSS compiled successfully
- Repo has initial `main` branch with commit history started

### Tasks
- **EP01-US01-T01 — Initialize project folder & git repo**  
  1. Create project root `qaqanda/`  
  2. Run `git init` → set default branch `main`  
  3. Add `.gitignore` (node, next, playwright, env, etc.)  
  4. Commit initial repo state  
  5. Add Conventional Commit rule to README  

- **EP01-US01-T02 — Install & bootstrap Next.js 14 with TypeScript**  
  1. Run `pnpm create next-app@latest --ts`  
  2. Select **App Router**, no example code  
  3. Validate `pnpm dev` starts server at `http://localhost:3000`

- **EP01-US01-T03 — Add TailwindCSS**  
  1. Install: `pnpm add -D tailwindcss postcss autoprefixer`  
  2. Run `npx tailwindcss init -p`  
  3. Add Tailwind imports to `globals.css`  
  4. Validate utility classes work in UI  

- **EP01-US01-T04 — Add base folder structure**
/app
/lib
/schemas
/tests
    /tests/pages
    /tests/ui
    /tests/api
/public


- **EP01-US01-T05 — Add base README**
- Include install, run, tech stack notes
- Specify Node + pnpm version  

### Deliverables
qaqanda/
.git/
.gitignore
README.md
package.json
pnpm-lock.yaml
app/page.tsx
tailwind.config.ts
postcss.config.js


---

## EP01-US02 — Linting & Formatting (3 pts)

### Description  
As a developer, I need enforced code style so the repo stays clean and consistent across contributors.

### Acceptance Criteria
- ESLint configured with `next/core-web-vitals`
- Prettier installed and integrated
- Pre-commit hook blocks bad code
- `pnpm lint` runs with 0 errors on clean repo

### Tasks
- **EP01-US02-T01 — Install lint + prettier + plugins**  
  1. Install:  
     ```
     pnpm add -D eslint prettier eslint-config-prettier eslint-plugin-import
     ```
  2. Create `.eslintrc.json` with Next rules  
  3. Add `.prettierrc` with standard config  

- **EP01-US02-T02 — Configure Husky + lint-staged**  
  1. Install: `pnpm add -D husky lint-staged`  
  2. Add `"prepare": "husky install"` to package.json  
  3. Create pre-commit hook that runs eslint + prettier  

- **EP01-US02-T03 — Add package scripts**
"lint": "eslint . --ext .ts,.tsx",
"format": "prettier --write ."

### Deliverables
.eslintrc.json
.prettierrc
.husky/pre-commit
package.json scripts: lint, format

---

## EP01-US03 — Environment variable validation (3 pts)

### Description  
As a developer, I need guaranteed validation of required environment variables so the app never boots with missing/broken config.

### Acceptance Criteria
- `.env.local.example` exists
- App crashes on startup if required env vars missing
- Zod schema validates env at runtime
- No direct `process.env.*` usage outside env loader

### Tasks
- **EP01-US03-T01 — Add Zod-based env validation module**  
  1. Create `lib/env.ts`  
  2. Define schema with Zod:  
     - `DATABRICKS_HOST?`  
     - `DATABRICKS_TOKEN?`  
     - `OPENAI_API_KEY?` (optional for now)  
  3. Export typed config object  

- **EP01-US03-T02 — Add `.env.local.example`**
  - Include placeholder values
  - Add comment headers and notes

### Deliverables
lib/env.ts
.env.local.example

---

## EP01-US04 — Install Playwright + base test structure (3 pts)

### Description  
As a QA engineer, I need test infrastructure ready so UI and API tests can be written without rework later.

### Acceptance Criteria
- `pnpm test` runs Playwright successfully
- HTML test report generated
- POM folder structure exists
- Example test runs and passes

### Tasks
- **EP01-US04-T01 — Install Playwright**
pnpm dlx playwright install --with-deps

Generate `playwright.config.ts`

- **EP01-US04-T02 — Setup folder structure**
/tests
/ui
/api
/pages (POM models)

- **EP01-US04-T03 — Add example smoke test**
- Create `tests/ui/smoke.spec.ts`
- Test that page `/` loads and contains expected title

- **EP01-US04-T04 — Add NPM scripts**
"test": "playwright test",
"test:report": "playwright show-report"

### Deliverables
playwright.config.ts
tests/ui/smoke.spec.ts
tests/pages/BasePage.ts
package.json test scripts


---

### ✅ EP01 Epic Done When:
- App boots and compiles
- Lint & format enforced by hooks
- Env validation working
- Playwright installed and runnable
- Repo structure and scripts in place
