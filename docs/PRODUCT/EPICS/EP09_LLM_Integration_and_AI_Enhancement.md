# EP09 — LLM Integration & AI Enhancement

## Epic Description

This epic integrates a Large Language Model (LLM) into QAQ&A to enhance the knowledge base and question-answering capabilities.  
It replaces the placeholder AI logic used in previous epics with a real model connection and strict JSON schema validation.  
The LLM will assist QA Leads in creating and updating KB entries, and will also generate improved answers on the Ask page.

### Epic Completion Criteria

- LLM integrated via `lib/llm.ts`
- AI used for `/api/kb/add`, `/api/kb/update`, and `/api/ask`
- Responses strictly validated against JSON schema
- Invalid or malformed AI output handled safely
- Configurable model and temperature settings via environment variables
- Test coverage for success and failure scenarios

---

## EP09-US01 — LLM Client & Config (3 pts)

### Description

As a developer, I need a reusable LLM client that supports configurable prompts, error handling, and response validation, so all AI features can use a unified interface.

### Acceptance Criteria

- `lib/llm.ts` provides a single `callLLM(prompt, schema)` function
- Uses `OPENAI_API_KEY` and `OPENAI_MODEL` from environment
- Returns parsed JSON output only if valid
- Catches and logs errors gracefully

### Tasks

- **EP09-US01-T01 — Implement LLM client**
  1. File: `lib/llm.ts`
  2. Use `fetch()` to call OpenAI API (or compatible endpoint)
  3. Include headers + payload for `gpt-4-turbo` model
  4. Enforce max tokens and temperature from `.env`
  5. Parse and validate JSON response

- **EP09-US01-T02 — Add schema validation helper**
  - File: `lib/validators/llmOutput.ts`
  - Validate structure for:
    ```json
    { "title": "string", "text": "string", "tags": ["string"] }
    ```

- **EP09-US01-T03 — Add LLM config to environment**
  - Update `.env.example`:
    ```bash
    OPENAI_API_KEY=
    OPENAI_MODEL=gpt-4-turbo
    OPENAI_TEMPERATURE=0.2
    ```

- **EP09-US01-T04 — Add unit tests**
  - Mock API responses
  - Validate parsing + error handling

### Deliverables

```
lib/llm.ts
lib/validators/llmOutput.ts
tests/unit/llm.spec.ts
.env.example
```

---

## EP09-US02 — LLM Integration in `/api/ask` (5 pts)

### Description

As a user, I want my questions to return LLM-enhanced answers using the knowledge base context, so I receive richer and more accurate responses.

### Acceptance Criteria

- `/api/ask` combines TF-IDF results with LLM summarization
- Request to LLM includes top 3 docs as context
- Response includes both AI-generated answer and context
- Fallback: if AI call fails, return TF-IDF-only answer
- Latency recorded and logged

### Tasks

- **EP09-US02-T01 — Extend `/api/ask` logic**
  1. Add call to `callLLM()` after TF-IDF results
  2. Prompt format:
     ```
     You are an AI QA assistant. Based on the following documents, answer the question briefly.
     Context: [...]
     Question: ...
     Output JSON: { "answer": "..." }
     ```
  3. Validate and parse AI response
  4. Merge answer + context into final API response

- **EP09-US02-T02 — Update tests**
  - Mock LLM success → valid JSON answer
  - Mock LLM failure → fallback answer
  - Validate latency tracking

### Deliverables

```
app/api/ask/route.ts (extended)
tests/api/ask-llm.spec.ts
```

---

## EP09-US03 — AI-Assisted KB Operations (5 pts)

### Description

As a QA Lead, I want AI to automatically draft and improve KB entries based on prompts, ensuring quality and consistency.

### Acceptance Criteria

- `/api/kb/add` and `/api/kb/update` use real LLM output
- Output validated using JSON schema
- Invalid responses trigger 400 with explicit message
- Audit log includes LLM model and timestamp

### Tasks

- **EP09-US03-T01 — Update `/api/kb/add` and `/api/kb/update`**
  - Replace placeholder logic with real `callLLM()`
  - Validate result before DB write
  - Add metadata (`llm_model`, `llm_latency`) to `kb_audit` table

- **EP09-US03-T02 — Add AI metrics logging**
  - File: `lib/logger.ts`
  - Store latency and token count (if available)

- **EP09-US03-T03 — Tests**
  - Valid AI response → 200 + saved doc
  - Invalid response → 400
  - Missing permission → 403

### Deliverables

```
app/api/kb/add/route.ts
app/api/kb/update/route.ts
lib/logger.ts (extended)
tests/api/kb-llm.spec.ts
```

---

## ✅ EP09 Epic Done When

- LLM client fully functional and tested
- AI enhances `/ask`, `/kb/add`, and `/kb/update`
- Validation strict and error-proof
- Logs include model, latency, and response quality
- Fallback logic works without LLM connection
