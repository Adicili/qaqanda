# QAQandA App

![CI Status](https://github.com/<USER>/<REPO>/actions/workflows/ci.yml/badge.svg)

## Internal QA & Knowledge Management tool built with **Next.js (App Router)**, **TypeScript**, **Databricks SQL Warehouse**, **Vitest**, and **Playwright**.

# 🧰 Prerequisites

| Tool       | Version   |
| ---------- | --------- |
| Node.js    | >= 20.x   |
| pnpm       | >= 10.x   |
| TypeScript | >= 5.x    |
| Playwright | >= 1.48.x |

Verify:

node -v  
pnpm -v

---

# ⚙️ Setup & Run

## 1. Install dependencies

pnpm install

## 2. Local Development (Databricks optional)

pnpm dev

App runs at: http://localhost:3000

If Databricks env vars aren’t provided → repositories fallback to **in-memory storage**.

## 3. Production build

pnpm build && pnpm start

---

# 🧪 Testing

## Unit tests (fast)

pnpm test:unit

Uses Vitest, mocks Databricks API, no external dependencies.

---

## E2E / UI tests (Playwright)

pnpm test:ui
pnpm test:api

---

## Canary DB tests (real Databricks)

⚠️ Disabled by default. Runs only with valid DEV/STAGING credentials.

pnpm test:canary

---

# ✔️ EP02 — Quality Gates

Every commit must pass:

- ESLint
- Prettier
- TypeScript strict mode
- Playwright smoke tests
- Folder structure rules
- Env schema validation

### Required scripts

| Script            | Purpose                        |
| ----------------- | ------------------------------ |
| pnpm lint         | ESLint                         |
| pnpm format       | Format code                    |
| pnpm format:check | Formatting validation only     |
| pnpm test:unit    | Unit + contract tests          |
| pnpm test:ui      | UI/E2E                         |
| pnpm qa:test      | Meta suite for EP02 compliance |

---

# 🚦 EP08-US01 — Continuous Integration (CI Pipeline)

The project includes a **full CI pipeline** implemented using **GitHub Actions**.

CI runs automatically on:

- every **pull request**
- every **push** to `main`

### CI Pipeline Steps

1. Checkout repository
2. Setup Node.js 20 & pnpm
3. Install dependencies with caching
4. Run quality gates:
   - ESLint
   - TypeScript type-check
   - Unit tests
   - Playwright smoke suite
5. Upload artifacts on failure (screenshots, traces, videos)
6. Report final CI status (required for merge)

A failing step **blocks merging** to ensure stability and quality.

CI configuration file:

.github/workflows/ci.yml

This completes the implementation of **EP08-US01**.

---

# 🧱 Project Structure

/app → Next.js App Router  
/lib → Core utilities  
 ├ databricksClient → SQL wrapper (EP03)  
 ├ db.users.ts → Users repository  
 ├ db.kb.ts → Knowledge Base repository  
 ├ db.queries.ts → Query Log repository  
/schemas → Zod validation  
/tests  
 /unit → Repository + client tests  
 /integration → Canary DB tests  
 /ui → Playwright E2E tests  
 /api → Future API-level tests

---

# 🧩 Databricks Integration (EP03)

Typed Databricks client providing:

- SQL wrapper with named params
- Secure escaping
- Timeout & retry
- Inline JSON parsing
- Array-of-arrays → typed mapping

### Safe Querying Guarantees

- No raw SQL interpolation
- All params validated
- No secret exposure in logs

---

# 🗄️ Database Repositories (EP03-US03)

Domain-specific modules:

- Users
- Knowledge Base
- Query logs

All repositories use `databricksClient`.  
If ENV is missing → **automatic in-memory fallback**.

---

# 🧪 EP03 — Tests Overview

- CRUD repository tests
- SQL parameterization
- Retry + timeout handling
- Schema mapping
- Sensitive logging prevention

Mocks ensure deterministic execution.

---

# 🛡️ Canary Testing (EP03-US04)

Optional integration suite hitting real Databricks Warehouse:

- Insert → read → update KB docs
- Validate permissions
- Validate schema integrity

Skipped in CI; executed manually or scheduled.

---

# 🔐 Environment

SESSION_SECRET="---"  
DATABRICKS_HOST="https://XXX.databricks.cloud"  
DATABRICKS_TOKEN="dapiXXXX"  
DATABRICKS_WAREHOUSE_ID="XXXX"

Missing ENV → in-memory DB fallback.  
No credentials logged by design.

---

# 💡 Runbook

pnpm dev — Local server  
pnpm build — Production build  
pnpm test:unit — Unit + repository tests  
pnpm playwright — Full UI suite  
pnpm test:canary — Live Databricks tests  
pnpm lint — ESLint  
pnpm format — Prettier  
pnpm tsc --noEmit — Strict TypeScript checking

---

# 📘 Notes

- Architecture is **QA-first**, not feature-first
- Strong typing and DB abstraction
- Integrated CI pipeline ensures baseline quality
- Canary tests prevent DB contract regressions
- Ideal for **QA Automation Portfolio**
