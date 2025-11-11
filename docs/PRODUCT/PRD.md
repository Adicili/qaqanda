# PRD — QAQ&A (v1.3)

## 1. Overview

QAQ&A is a role-based web application that enables authenticated users to query, manage, and analyze an internal knowledge base. The system supports two roles: **QA Engineer** (read-only) and **QA Lead** (read + manage). All application data is stored in Databricks and accessed through the Databricks SQL Warehouse REST API.  
All knowledge base modifications are processed through an AI model that converts freeform text into structured data.

---

## 2. Problem Statement

QA information is often fragmented across multiple tools, documents, and communication channels, slowing down decision-making and test execution.  
QA Engineers require fast and consistent access to validated knowledge.  
QA Leads require the ability to maintain and update that knowledge without developer intervention.

---

## 3. Product Goals

- Provide fast, natural-language querying over internal QA knowledge.
- Centralize documentation in a single, structured, editable knowledge base.
- Enforce role-based access for content management.
- Maintain full audit history of knowledge changes.
- Support production-grade authentication, API design, and database architecture.

---

## 4. Roles & Permissions

| Capability                 | QA Engineer | QA Lead |
| -------------------------- | ----------- | ------- |
| Login / Register           | ✅          | ✅      |
| Ask questions              | ✅          | ✅      |
| View reports               | ✅          | ✅      |
| Add new KB entries         | ❌          | ✅      |
| Update existing KB entries | ❌          | ✅      |
| View audit history         | ❌          | ✅      |

Default role after registration: `QA Engineer`  
Role upgrades to `QA Lead` are handled manually via database or admin script (not via UI in MVP).

---

## 5. Core Features

### F1 — Authentication & Authorization

- Registration via email + password
- Passwords stored as bcrypt hashes
- Login sets HTTP-only session cookie
- Middleware enforces:
  - authenticated access
  - role access for restricted pages and APIs

### F2 — Knowledge Querying

- User enters a natural-language question
- System retrieves top KB docs via TF-IDF retrieval (v1)
- Response includes:
  answer: string
  context: KB entries[]
  latency_ms: number
- Every query logged to Databricks

### F3 — Knowledge Management (Lead only)

- Lead enters freeform prompt describing a new or updated document
- AI model converts prompt → `{ title, text, tags[] }`
- Result stored in `kb_docs`
- Previous value stored in `kb_audit`
- All changes linked to user ID

### F4 — Reports

- All authenticated users can view usage analytics:
- total queries
- top questions
- most referenced KB docs
- average latency

---

## 6. Non-Functional Requirements

| Category          | Requirement                                                |
| ----------------- | ---------------------------------------------------------- |
| Session Security  | HTTP-only cookie, SameSite=Lax                             |
| Password Policy   | Min 8 chars, 1 number, 1 special character                 |
| Database          | All queries executed through Databricks SQL REST API       |
| Auditability      | All KB changes must have diff record in `kb_audit`         |
| Max Query Latency | ≤ 1500ms without LLM                                       |
| Availability      | App must work without LLM; only KB edit depends on it      |
| Error Handling    | API responses must use explicit status codes and JSON body |
| Testing           | UI (Playwright) + API (Playwright request)                 |
| CI/CD             | Tests must execute in headless environment                 |
| Data Limits       | Max KB entry text: 5000 chars; max 10 tags per entry       |

---

## 7. Database Schema (Databricks)

````sql
CREATE TABLE users (
id STRING PRIMARY KEY,
email STRING UNIQUE NOT NULL,
password_hash STRING NOT NULL,
role STRING NOT NULL, -- 'ENGINEER' or 'Lead'
created_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE kb_docs (
id STRING PRIMARY KEY,
title STRING NOT NULL,
text STRING NOT NULL,
tags ARRAY<STRING>,
updated_by STRING NOT NULL,  -- FK users.id
updated_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE kb_audit (
id STRING PRIMARY KEY,
doc_id STRING NOT NULL,
old_value STRING,
new_value STRING,
updated_by STRING NOT NULL, -- FK users.id
updated_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE queries (
id STRING PRIMARY KEY,
user_id STRING NOT NULL, -- FK users.id
question STRING NOT NULL,
top_context_ids ARRAY<STRING>,
latency_ms INT,
created_at TIMESTAMP DEFAULT current_timestamp()
);

## 8. API Endpoints

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | - | Register new user |
| POST | `/api/auth/login` | ❌ | - | Issue session cookie |
| POST | `/api/auth/logout` | ✅ | All | Clear session |
| POST | `/api/ask` | ✅ | All | Query knowledge base |
| POST | `/api/kb/add` | ✅ | Lead | Add KB entry (AI required) |
| POST | `/api/kb/update` | ✅ | Lead | Update KB entry (AI required) |
| GET | `/api/reports/summary` | ✅ | All | Aggregated stats |

---

## 9. Application Routes

| Route | Auth Required | Role |
|--------|--------------|------|
| `/login` | No | - |
| `/register` | No | - |
| `/` (Ask page) | Yes | Engineer, Lead |
| `/reports` | Yes | Engineer, Lead |
| `/kb` | Yes | Lead |

---

## 10. LLM Requirements

- Required for all knowledge base operations (add/update)
- Model must output strict JSON in the format:

```json
{
  "title": "...",
  "text": "...",
  "tags": ["...", "..."]
}
````

- Invalid or ambiguous output must be rejected with validation error

- AI-generated data must not overwrite existing data without audit logging

## 11. Release Plan

| Phase   | Deliverables                                             |
| ------- | -------------------------------------------------------- |
| Phase 1 | Auth, Ask page, TF-IDF retrieval, query logging          |
| Phase 2 | KB add/update with AI, audit logging, Databricks storage |
| Phase 3 | Reports page with live analytics                         |
| Phase 4 | Playwright UI + API test suite                           |
| Phase 5 | CI/CD pipeline integration                               |

---

## 12. Risks & Mitigations

| Risk                | Mitigation                                       |
| ------------------- | ------------------------------------------------ |
| Databricks latency  | Reduce round-trips, batch writes                 |
| LLM hallucination   | Strict schema validation + enforced types        |
| Poor prompt quality | UI guidance + backend validation                 |
| Session fixation    | Regenerate session ID on login                   |
| Retrieval scaling   | Replace TF-IDF with embeddings in future release |

---

## 13. Future Enhancements (Not in MVP)

- Vector similarity search (embeddings)
- Administrator role (user + role management UI)
- Bulk KB import/export tools
- Model selection per tenant
- Webhooks for external analytics pipelines
