# QAQandA App

Internal QA & Knowledge Management tool built with **Next.js (App Router)**, **TypeScript**, **TailwindCSS**, and **Playwright**.  
Project adheres to EP01 setup and follows strict linting, testing, and CI/CD standards.

---

## 🧰 Prerequisites

| Tool       | Version   |
| ---------- | --------- |
| Node.js    | >= 20.x   |
| pnpm       | >= 10.x   |
| TypeScript | >= 5.x    |
| Playwright | >= 1.48.x |

> Check your setup:
>
> ```bash
> node -v
> pnpm -v
> ```

---

## ⚙️ Setup & Run

### 1. Install dependencies

```bash
pnpm install
```

### 2. Run in development mode

```bash
pnpm dev
```

App starts on [http://localhost:3000](http://localhost:3000).

### 3. Build for production

```bash
pnpm build && pnpm start
```

---

## 🧪 Testing

### Run Playwright tests

```bash
pnpm playwright test
```

### Run TypeScript type check

```bash
pnpm tsc --noEmit
```

### Run ESLint & Prettier

```bash
pnpm lint
pnpm format
```

Pre-commit hook enforces lint + format automatically.

---

## ✔️ Quality Gates (EP02)

This project follows strict **EP02 Quality Criteria**.  
Every commit must pass the following automated checks:

### **1. ESLint (US02-TC01)**

```bash
pnpm lint
```

### **2. Prettier Formatting (US02-TC02)**

```bash
pnpm format
pnpm format:check
```

### **3. Pre-commit Enforcement (US02-TC03)**

Husky + lint-staged ensure:

- No lint violations
- No formatting violations
- Only clean staged files are allowed to commit

### **4. Required NPM Scripts (US02-TC04)**

Mandatory project quality scripts:

| Script              | Purpose               |
| ------------------- | --------------------- |
| `pnpm lint`         | Lint full codebase    |
| `pnpm format`       | Format code           |
| `pnpm test`         | Run Playwright suite  |
| `pnpm qa:test`      | Run QA quality checks |
| `pnpm format:check` | Check formatting only |

### **5. QA Meta Test Suite**

```bash
pnpm qa:test
```

Validates:

- Env schema
- No forbidden `process.env` usage
- Lint compliance
- Prettier compliance
- Pre-commit behavior
- Playwright config validity
- Required folder structure
- Smoke test must pass

---

## 🧱 Project Structure

```
/app       → Next.js App Router
/lib       → Utilities (env, session, db wrappers)
/schemas   → Zod schemas & DTO definitions
/tests     → Playwright tests
  /ui      → UI smoke & regression
  /api     → API & integration tests
  /pages   → Page Object Models (POM)
/public    → Static assets
```

---

## 🎨 Styling

TailwindCSS (utility-first).  
Edit styles in `app/globals.css` and configure paths in `tailwind.config.js`.

---

## 🧩 Tooling

| Tool        | Purpose                                    |
| ----------- | ------------------------------------------ |
| ESLint      | Code linting                               |
| Prettier    | Formatting                                 |
| Husky       | Git hooks (pre-commit)                     |
| Lint-Staged | Runs lint on staged files                  |
| Playwright  | End-to-end testing                         |
| CI/CD       | GitHub Actions integration planned in EP08 |

---

## 🧭 Runbook

| Command             | Description          |
| ------------------- | -------------------- |
| `pnpm install`      | Install dependencies |
| `pnpm dev`          | Run local dev server |
| `pnpm build`        | Production build     |
| `pnpm lint`         | Run ESLint           |
| `pnpm format`       | Format code          |
| `pnpm test`         | Run Playwright suite |
| `pnpm tsc --noEmit` | Type check only      |

---

## 🧾 Notes

- Env vars live in `.env.local` (ignored by Git).
- Git hooks enforce quality on every commit.
- Project is governed by EP01 + EP02 quality standards.
