# Test Cases – EP06

## EP06 — Reports & Analytics

This document defines test cases for EP06 using the **same structure and rigor as previous epics**.  
Each test exists to catch a real failure mode. If a test feels “obvious”, good — obvious bugs still ship.

---

## EP06-US01 — Reports Summary API

### EP06-US01-TC01

- **Test name:** Authorized user can fetch reports summary
- **Type:** API / Positive
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/reports-summary.spec.ts`
  - Test name: `EP06-US01-TC01 — authorized user gets summary data`

**Description:**  
Verify that an authenticated Engineer or Lead can retrieve aggregated report metrics.

**Steps:**

1. Authenticate as Engineer or Lead.
2. Send GET request to `/api/reports/summary`.
3. Inspect response.

**Expected Result:**

- HTTP status `200`
- Response body contains:
  - `total_queries` (number)
  - `top_questions` (array)
  - `top_docs` (array)
  - `avg_latency_ms` (number)
- No unexpected fields present

---

### EP06-US01-TC02

- **Test name:** Unauthorized user cannot access reports summary
- **Type:** API / Security
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/reports-summary.spec.ts`
  - Test name: `EP06-US01-TC02 — unauthorized access blocked`

**Description:**  
Ensure reports data is not exposed to unauthenticated or unauthorized users.

**Steps:**

1. Send GET request to `/api/reports/summary` without auth OR with invalid role.
2. Observe response.

**Expected Result:**

- HTTP status `401` or `403`
- No report data returned

If this fails, the entire analytics feature is a liability.

---

### EP06-US01-TC03

- **Test name:** Empty dataset returns default values
- **Type:** API / Edge Case
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API
  - Spec file: `tests/api/reports-summary.spec.ts`
  - Test name: `EP06-US01-TC03 — empty dataset handled correctly`

**Description:**  
Verify API behavior when no query or KB data exists.

**Steps:**

1. Ensure Databricks tables are empty.
2. Authenticate as Engineer or Lead.
3. Send GET request to `/api/reports/summary`.

**Expected Result:**

- HTTP status `200`
- `total_queries` = `0`
- `avg_latency_ms` = `0` (or defined fallback)
- `top_questions` = `[]`
- `top_docs` = `[]`

Returning garbage here means the aggregation logic is sloppy.

---

## EP06-US02 — Reports Dashboard UI

### EP06-US02-TC01

- **Test name:** Authenticated user can view reports dashboard
- **Type:** UI / Positive
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI
  - Spec file: `tests/ui/reports.spec.ts`
  - Test name: `EP06-US02-TC01 — reports dashboard renders for auth user`

**Description:**  
Ensure authenticated users can access and view analytics data.

**Steps:**

1. Login as Engineer or Lead.
2. Navigate to `/reports`.
3. Wait for data load.

**Expected Result:**

- Page loads successfully
- Total queries and average latency cards are visible
- Top questions and top docs lists are rendered

---

### EP06-US02-TC02

- **Test name:** Unauthorized user is redirected from reports page
- **Type:** UI / Security
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI
  - Spec file: `tests/ui/reports.spec.ts`
  - Test name: `EP06-US02-TC02 — unauthorized user blocked from reports`

**Description:**  
Prevent unauthorized access to analytics UI.

**Steps:**

1. Open `/reports` without logging in.
2. Observe navigation behavior.

**Expected Result:**

- User is redirected to login page OR shown access denied
- Reports data is not visible

If this fails, your UI security is fake.

---

### EP06-US02-TC03

- **Test name:** Reports page shows empty state when no data exists
- **Type:** UI / Edge Case
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI
  - Spec file: `tests/ui/reports.spec.ts`
  - Test name: `EP06-US02-TC03 — empty state displayed correctly`

**Description:**  
Ensure UI handles lack of data gracefully.

**Steps:**

1. Login as authorized user.
2. Mock `/api/reports/summary` to return empty values.
3. Navigate to `/reports`.

**Expected Result:**

- “No data available” message displayed
- No broken charts or empty components
- UI remains responsive

---

### EP06-US02-TC04

- **Test name:** Reports page handles API failure gracefully
- **Type:** UI / Error Handling
- **Priority:** P2
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI
  - Spec file: `tests/ui/reports.spec.ts`
  - Test name: `EP06-US02-TC04 — reports api error handled in UI`

**Description:**  
Verify UI behavior when reports API fails.

**Steps:**

1. Login as authorized user.
2. Mock `/api/reports/summary` to return `500`.
3. Navigate to `/reports`.

**Expected Result:**

- Clear error or fallback message shown
- No crash or infinite loading state
- Page remains usable

Silent failures here would destroy user trust.

---

## Notes

- All automated tests must be deterministic.
- Hard waits are forbidden.
- Any flaky test is a failed test, even if it “usually passes”.

If EP06 ships without these tests, it’s not a portfolio — it’s noise.
