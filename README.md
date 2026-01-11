# QAQandA App

![CI Status](https://github.com/<USER>/<REPO>/actions/workflows/ci.yml/badge.svg)

## Internal QA & Knowledge Management tool built with **Next.js (App Router)**, **TypeScript**, **Databricks SQL Warehouse**, **Vitest**, and **Playwright**.

---

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

If Databricks env vars aren’t provided → repositories fallback to **local file-based DB** (dev-safe, no external dependency).

## 3. Production build

pnpm build && pnpm start

---

# 🧪 Testing

## Unit tests (fast)

pnpm test:unit

- Vitest
- Deterministic execution
- Databricks fully mocked
- No network / infra dependency

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
- Unit tests
- Playwright smoke tests
- Env schema validation
- Repository contract tests

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

A failing step **blocks merging**.

CI configuration file:

.github/workflows/ci.yml

---

# 🧱 Project Structure

/app → Next.js App Router  
/lib → Core utilities  
 ├ databricksClient → SQL wrapper (EP03)  
 ├ db.users.ts → Users repository  
 ├ db.kb.ts → Knowledge Base repository  
 ├ db.queries.ts → Query Log repository  
 ├ retrieval → TF-IDF ranking engine (EP04)  
 ├ llm → LLM abstraction layer (EP05)  
/schemas → Zod validation  
/tests  
 /unit → Repository + client + engine tests  
 /integration → Canary DB tests  
 /ui → Playwright E2E tests  
 /api → Route-level tests

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

All repositories share the same contract.  
If ENV is missing → **local file-based DB fallback** (safe for dev & tests).

---

# 🧪 EP03 — Tests Overview

- CRUD repository tests
- SQL parameterization validation
- Retry + timeout handling
- Schema mapping correctness
- Sensitive logging prevention

All tests are deterministic and infra-free.

---

# 🧠 EP04 — Ask & Retrieval Engine

### Scope

EP04 introduces a **deterministic retrieval layer** used by the Ask pipeline.

### Implemented Features

- TF-IDF based ranking
- Case-insensitive tokenization
- Optional stopword filtering
- Deterministic ordering with tie-breakers
- Score normalization (0..1)
- Empty query short-circuit

### Test Coverage

- Tokenization behavior
- Ranking determinism
- Edge cases (empty input)
- Score boundaries

---

# 🤖 EP05 — Ask Pipeline & LLM Abstraction

EP05 introduces the **question answering pipeline**, integrating retrieval with a pluggable LLM layer.

### Architecture

Ask flow:

1. Authenticated request hits `/api/ask`
2. Question validated via schema
3. KB documents retrieved & ranked (EP04)
4. Prompt assembled (question + context)
5. LLM adapter invoked
6. Answer + context returned
7. Query logged with latency

### LLM Abstraction

The LLM layer is **fully isolated** behind an interface:

- `mock` mode (default)
- `real` mode (OpenAI-compatible)
- Fault injection supported for tests

Switching is controlled via ENV:

LLM_MODE=mock | real
MOCK_LLM_BAD=true | false

### Guarantees

- No LLM calls in unit tests
- No external dependency in CI
- Deterministic answers in mock mode
- Generic error handling (no leakage)

---

# 🧪 EP05 — Test Coverage

- Route-level tests for `/api/ask`
- Auth enforcement
- Validation errors (400)
- Internal failures (500)
- Empty KB handling
- Latency measurement
- Query logging side-effects

LLM behavior is mocked → zero flakiness.

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
DB_MODE="local | databricks"

DATABRICKS_HOST="https://XXX.databricks.cloud"  
DATABRICKS_TOKEN="dapiXXXX"  
DATABRICKS_WAREHOUSE_ID="XXXX"

LLM_MODE="mock | real"  
OPENAI_API_KEY="sk-..."

Missing ENV → safe local fallback.  
No credentials are ever logged.

---

# 💡 Runbook

pnpm dev — Local server  
pnpm build — Production build  
pnpm test:unit — Unit + repository tests  
pnpm test:ui — Full UI suite  
pnpm test:canary — Live Databricks tests  
pnpm lint — ESLint  
pnpm format — Prettier  
pnpm tsc --noEmit — Strict TypeScript checking

---

# 📘 Notes

- Architecture is **QA-first**, not feature-first
- Deterministic by default
- Infra isolated behind contracts
- CI-safe, audit-friendly
- Designed as a **serious QA Automation portfolio project**
