# QAQandA App

Internal QA & Knowledge Management tool built with **Next.js (App Router)**, **TypeScript**, **Databricks SQL Warehouse**, **Vitest**, and **Playwright**.  
Project follows strict QA-driven development (EP01–EP03) and is structured for CI/CD expansion (EP08).

---

# 🧰 Prerequisites

| Tool       | Version   |
| ---------- | --------- |
| Node.js    | >= 20.x   |
| pnpm       | >= 10.x   |
| TypeScript | >= 5.x    |
| Playwright | >= 1.48.x |

Verify:

```bash
node -v
pnpm -v
```

---

# ⚙️ Setup & Run

## 1. Install dependencies

```bash
pnpm install
```

## 2. Local Development (Databricks optional)

```bash
pnpm dev
```

App starts at:

> http://localhost:3000

If Databricks env vars aren’t provided → repositories fallback to **in-memory storage**.

## 3. Production build

```bash
pnpm build && pnpm start
```

---

# 🧪 Testing

## Unit tests (fast)

Database repositories and Databricks client API wrapper:

```bash
pnpm test:unit
```

Uses Vitest, mocks Databricks API, no external dependencies.

---

## E2E / UI tests (Playwright)

```bash
pnpm playwright test
```

---

## Canary DB tests (real Databricks)

**⚠️ Disabled by default. Runs only with valid DEV/STAGING credentials.**

```bash
pnpm test:canary
```

- Executes against actual SQL Warehouse
- Inserts/updates KB documents
- Validates schema, permissions
- Blocks release when failing

---

# ✔️ EP02 — Quality Gates

Every commit must pass:

- ESLint
- Prettier
- TypeScript strict mode
- Playwright smoke
- Folder structure
- Env schema validation

## Required scripts

| Script              | Purpose                        |
| ------------------- | ------------------------------ |
| `pnpm lint`         | ESLint                         |
| `pnpm format`       | Format code                    |
| `pnpm format:check` | Formatting validation only     |
| `pnpm test:unit`    | Unit + contract tests          |
| `pnpm playwright`   | UI/E2E                         |
| `pnpm qa:test`      | Meta suite for EP02 compliance |

---

# 🧱 Project Structure

```
/app                   → Next.js App Router
/lib                   → Core utilities
  ├ databricksClient   → SQL wrapper (EP03)
  ├ db.users.ts        → Users repository (CRUD)
  ├ db.kb.ts           → Knowledge Base repository
  ├ db.queries.ts      → Query Log repository
/schemas               → DTOs, Zod validation
/tests
  /unit                → Repository + client + logging tests
  /integration         → Canary DB tests (EP03-US04)
  /ui                  → Playwright
  /api                 → API controller tests (future EP04)
```

---

# 🧩 Databricks Integration (EP03)

Project integrates a **typed Databricks Client**:

- SQL wrapper:
  - named parameters (`:email`, `:id`)
  - secure escaping
  - timeout & retry strategy
- Inline JSON result parsing
- Mapping array-of-arrays → typed records

## Safe Querying

- `executeQuery(sql, params)`
- No raw string interpolation
- No unescaped input
- No sensitive logs

---

# 🗄️ Database Repositories (EP03-US03)

Each domain has its own module:

- `db.users.ts`
  - `getUserByEmail(email)`
  - `create(user)`
  - `listAll()`

- `db.kb.ts`
  - `getById(id)`
  - `addDoc(title, text, tags)`
  - `updateDoc(id, newText)`
  - `listAll()`

- `db.queries.ts`
  - `insertQuery(userId, question, latency)`
  - `getRecentByUser(userId)`

**No repository talks to Databricks directly — everything goes through `databricksClient`.**

Fallback:

- When ENV is not configured → in-memory storage

---

# 🧪 EP03 — Tests

## Unit / Contract coverage

- Repository CRUD
- Parameterized SQL usage
- Databricks wrapper behaviors
- Retry / Timeout / HTTP errors
- Mapping result schema
- Sensitive logging check

Everything mocks the Databricks network and ENV.

---

# 🛡️ Canary Testing (EP03-US04)

Canary suite hits **real SQL Warehouse**:

- Insert KB doc
- Read back
- Update KB doc
- Read updated
- Validate column types
- Validate permission boundaries
  - READ-ONLY → fails on INSERT/UPDATE
  - READ-WRITE → succeeds

**Skipped on PR CI. Run manually or scheduled.**

---

# 🔐 Environment

## `.env.local` or `.env.development`

```
SESSION_SECRET="---"
DATABRICKS_HOST="https://XXX.databricks.cloud"
DATABRICKS_TOKEN="dapiXXXX"
DATABRICKS_WAREHOUSE_ID="XXXX"
```

If missing → repositories switch to in-memory mode.

> No credentials in repo. No logs of SQL or secrets.

---

# 💡 Runbook

| Command             | Description              |
| ------------------- | ------------------------ |
| `pnpm dev`          | Local dev server         |
| `pnpm build`        | Production build         |
| `pnpm test:unit`    | Unit + repositories      |
| `pnpm playwright`   | UI regression suite      |
| `pnpm test:canary`  | 🔥 LIVE Databricks tests |
| `pnpm lint`         | ESLint                   |
| `pnpm format`       | Format code              |
| `pnpm tsc --noEmit` | Strict typing            |

---

# 📘 Notes

- Code is QA-led, not “feature led”.
- Databricks access layer is fully typed and segregated.
- Canary tests block unsafe releases.
- EP08 will integrate CI/CD pipelines with gated stages.
