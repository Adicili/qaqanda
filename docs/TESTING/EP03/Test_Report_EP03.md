# QAQ&A — Test Report for **EP03: Databricks Integration**

## US01 — Databricks SQL REST Client Wrapper

---

## **EP03-US01-TC01 — Authenticated SELECT produces mapped rows**

**Result:** ✅ PASS

**Evidence:**

```bash
$ pnpm test:unit -- -t "EP03-US01-TC01"

✓ EP03-US01-TC01 — sends authenticated POST request and maps rows for SELECT
Mocked response:

json
Copy code
{
  "status": { "state": "FINISHED" },
  "result": {
    "schema": {
      "columns": [
        { "name": "id", "type_text": "STRING" },
        { "name": "email", "type_text": "STRING" }
      ]
    },
    "data_array": [
      ["1", "user1@example.com"],
      ["2", "user2@example.com"]
    ]
  }
}
Notes:
Result mapping correct.
Authorization + endpoint path validated.

EP03-US01-TC02 — Parameterized SQL escapes values safely
Result: ✅ PASS

Evidence:

bash
Copy code
$ pnpm test:unit -- -t "EP03-US01-TC02"

✓ EP03-US01-TC02 — replaces named params with escaped SQL values
Example:

Input:

java
Copy code
WHERE email = :email AND active = :active
Output:

java
Copy code
WHERE email = 'o''connor@example.com' AND active = TRUE
Notes:
Single quote escapes → ''.
Booleans mapped to uppercase SQL constants.

EP03-US01-TC03 — Missing parameter fails fast
Result: ✅ PASS

Evidence:

bash
Copy code
$ pnpm test:unit -- -t "EP03-US01-TC03"

✓ EP03-US01-TC03 — throws if a param in SQL has no value provided
Notes:
No silent fallback or null param injection.
Correct error type: DatabricksClientError.

EP03-US01-TC04 — Unused parameters cause error
Result: ✅ PASS

Evidence:

bash
Copy code
$ pnpm test:unit -- -t "EP03-US01-TC04"

✓ EP03-US01-TC04 — throws if there are unused params
Notes:
Prevents packing payload with extra fields → blocks SQL injection vectors.

EP03-US01-TC05 — Retry on transient 5xx
Result: ✅ PASS

Evidence:

bash
Copy code
$ pnpm test:unit -- -t "EP03-US01-TC05"

✓ EP03-US01-TC05 — retries on 5xx and eventually succeeds
Mock scenario:

Attempt 1: HTTP 500

Attempt 2: FINISHED

Notes:
Retry policy applies only to 5xx.
Stops when successful.

EP03-US01-TC06 — Timeout → DatabricksTimeoutError
Result: ✅ PASS

Evidence:

bash
Copy code
$ pnpm test:unit -- -t "EP03-US01-TC06"

✓ EP03-US01-TC06 — throws DatabricksTimeoutError on timeout and respects retries
Notes:
AbortController respected.
Invocations = maxRetries + 1.

EP03-US01-TC07 — Non-5xx → DatabricksClientError
Result: ✅ PASS

Evidence:

bash
Copy code
$ pnpm test:unit -- -t "EP03-US01-TC07"

✓ EP03-US01-TC07 — throws DatabricksClientError on non-5xx failure
Mock:

nginx
Copy code
HTTP 400 → DatabricksClientError
Notes:
No retries on client-side failures.
Correct error class.

EP03-US01-TC08 — Statements without result set return []
Result: ✅ PASS

Evidence:

bash
Copy code
$ pnpm test:unit -- -t "EP03-US01-TC08"

✓ EP03-US01-TC08 — returns empty array for statements without result set
Notes:
Non-query commands (INSERT/UPDATE/DELETE) → [].
Zero-return behavior is consistent.

EP03-US01-TC09 — Invalid ENV shuts down early
Result: ✅ PASS

Evidence:

bash
Copy code
$ pnpm test:unit -- -t "EP03-US01-TC09"

✓ EP03-US01-TC09 — fails fast when ENV is missing Databricks config
Notes:
No network call.
Fast-fail ensures host/token required.
Correct exception: DatabricksClientError.

US01 Summary
Test Case	Status
TC01	PASS
TC02	PASS
TC03	PASS
TC04	PASS
TC05	PASS
TC06	PASS
TC07	PASS
TC08	PASS
TC09	PASS

All EP03-US01 scenarios are passing.
Wrapper is safe, deterministic, and resilient to transient backend failures.
```
