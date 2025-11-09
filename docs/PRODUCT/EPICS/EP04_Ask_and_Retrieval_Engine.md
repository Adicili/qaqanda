# EP04 — Ask & Retrieval Engine

## Epic Description
This epic implements the core “Ask” functionality — allowing users to submit a question and retrieve relevant answers from the knowledge base using a TF-IDF search engine.  
It also covers the `/api/ask` endpoint, query logging, and UI integration for the Ask page.  
This is the central feature of QAQ&A that connects the frontend UI, database layer, and (later) optional LLM layer.

### Epic Completion Criteria
- User can submit a question via UI and receive an answer + context list
- TF-IDF retrieval implemented and deterministic
- `/api/ask` endpoint fully functional and validated
- Queries logged in Databricks `queries` table
- Ask page accessible only to authenticated users
- Playwright tests verify both UI and API flow

---

## EP04-US01 — TF-IDF Retrieval Service (3 pts)

### Description
As a developer, I need to implement a TF-IDF-based retrieval engine that can score knowledge base documents by relevance so that user questions return meaningful results.

### Acceptance Criteria
- Tokenization and normalization handle punctuation and case
- Stopword removal optional but supported
- Scores are deterministic for same corpus/query
- Returns top-k documents with normalized relevance scores

### Tasks
- **EP04-US01-T01 — Create retrieval module**
  1. File: `lib/retrieval.ts`
  2. Implement tokenizer (lowercase, remove punctuation)
  3. Compute term frequency and inverse document frequency
  4. Support optional stopword filter

- **EP04-US01-T02 — Implement scoring function**
  - Function: `rankDocuments(query: string, docs: KBEntry[], topK: number)`  
  - Return sorted array of `{ id, title, text, score }`

- **EP04-US01-T03 — Add unit tests**
  - Deterministic ranking
  - Handles case insensitivity
  - Empty query returns empty result

### Deliverables
```
lib/retrieval.ts
tests/unit/retrieval.spec.ts
```

---

## EP04-US02 — `/api/ask` Endpoint (3 pts)

### Description
As an authenticated user, I want to send a question to the `/api/ask` endpoint and get back the best-matching knowledge base entries with a generated answer and performance metrics.

### Acceptance Criteria
- Validates input using Zod: `{ question: string }`
- Returns `{ answer, context[], latency_ms }`
- Logs query to Databricks `queries` table
- Returns 400 on invalid input
- Returns 401 if user not authenticated

### Tasks
- **EP04-US02-T01 — Create endpoint**
  1. File: `app/api/ask/route.ts`
  2. Validate JSON body with Zod
  3. Load KB docs from Databricks using `db.kb.listAll()`
  4. Call `rankDocuments()` from retrieval module
  5. Construct answer (for now, top doc summary text only)
  6. Measure latency and log to DB

- **EP04-US02-T02 — Add logging helper**
  - `lib/logger.ts`: `logQuery(userId, question, latency)`

- **EP04-US02-T03 — API Tests**
  - Valid query returns 200 + context
  - Empty question → 400
  - Unauthorized request → 401

### Deliverables
```
app/api/ask/route.ts
lib/logger.ts
tests/api/ask.spec.ts
```

---

## EP04-US03 — Ask UI Page (`/`) (3 pts)

### Description
As a logged-in user, I want to ask a question and see relevant answers and document context directly in the web interface.

### Acceptance Criteria
- Input field for question, submit button
- Loading indicator during request
- Displays answer text and context list of KB docs
- Error messages for invalid input or network failure
- Accessible with keyboard and screen readers

### Tasks
- **EP04-US03-T01 — Create Ask page UI**
  1. File: `app/page.tsx`
  2. Form with text input and submit button
  3. Show “Loading...” indicator while waiting for response
  4. Display returned `answer` and context titles

- **EP04-US03-T02 — Add basic styling**
  - Use Tailwind for responsive layout
  - Include minimal colors and spacing

- **EP04-US03-T03 — Add UI tests**
  - Enter query → see response
  - Empty input → error validation
  - Simulate 500 → shows error message

### Deliverables
```
app/page.tsx
tests/ui/ask.spec.ts
```

---

## ✅ EP04 Epic Done When
- TF-IDF retrieval works and returns deterministic results
- `/api/ask` endpoint handles queries correctly and logs them
- Ask page is functional and styled
- Tests confirm API + UI flow works end-to-end
