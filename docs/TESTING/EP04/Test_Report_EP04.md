# QAQ&A — Test Report for **EP04: Ask & Retrieval Engine**

---

## Environment

- Local Development (`pnpm dev`)
- Node 20.x + pnpm 10.x
- Test frameworks:
  - Vitest (Unit)
  - Playwright (API + UI)
- Data layer:
  - In-memory fallback or Databricks (DEV), depending on environment
- Notes:
  - Report structure and level of detail follow the same format as EP01–EP03 test reports.

---

## US01 — TF-IDF Retrieval Service — Test Report

### EP04-US01-TC01 — Tokenization handles case and punctuation

**Result:** PASS

**Evidence:**  
Vitest unit test executed for tokenizer normalization.  
Lowercasing and punctuation stripping verified via automated assertions.

**Notes:**  
Tokenizer correctly normalizes input and produces stable token arrays.

---

### EP04-US01-TC02 — Optional stopword removal supported

**Result:** PASS

**Evidence:**  
Unit tests executed with and without stopword configuration.  
Token count and content differ as expected when stopwords are applied.

**Notes:**  
Stopword filtering is optional and does not affect default behavior.

---

### EP04-US01-TC03 — Deterministic ranking for same corpus/query

**Result:** PASS

**Evidence:**  
`rankDocuments()` executed multiple times with identical corpus and query.  
Returned order and scores were identical across runs.

**Notes:**  
Deterministic sorting verified using secondary and tertiary tie-breakers.

---

### EP04-US01-TC04 — Case-insensitivity for query and documents

**Result:** PASS

**Evidence:**  
Queries executed with varying casing produced identical rankings and scores.

**Notes:**  
Case normalization is applied consistently to both query and documents.

---

### EP04-US01-TC05 — Empty or whitespace-only query returns empty result

**Result:** PASS

**Evidence:**  
Unit tests confirmed empty string and whitespace-only input return empty array.

**Notes:**  
Prevents unnecessary computation and unsafe scoring.

---

### EP04-US01-TC06 — Scores normalized between 0 and 1

**Result:** PASS

**Evidence:**  
All returned document scores validated to be within inclusive range 0..1.

**Notes:**  
Score normalization simplifies UI usage and logging.

---

## US01 Summary

| Test Case | Description                  | Result |
| --------- | ---------------------------- | ------ |
| TC01      | Tokenization normalization   | PASS   |
| TC02      | Optional stopword filtering  | PASS   |
| TC03      | Deterministic TF-IDF ranking | PASS   |
| TC04      | Case-insensitive ranking     | PASS   |
| TC05      | Empty query handling         | PASS   |
| TC06      | Score normalization          | PASS   |

**US01 Status:** Completed — PASS
