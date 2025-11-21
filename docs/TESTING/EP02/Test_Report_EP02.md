# QAQ&A — Test Report for **EP02: Authentication & User Roles**

## US01 — User Registration Flow

---

## **EP02-US01-TC01 — Register with valid data**

**Result:** ✅ PASS

**Evidence:**

```bash
$ pnpm qa:api -- -g "EP02-US01-TC01"

✓ EP02-US01 — User Registration Flow (API)
    ✓ EP02-US01-TC01 — Register with valid data returns 200 (512ms)
```

API response:

```json
{
  "success": true
}
```

Notes:  
The API successfully creates a new user with a unique email. Response is sanitized, no password or sensitive fields returned. Role defaults to `ENGINEER`.

---

## **EP02-US01-TC02 — Register with existing email**

**Result:** ✅ PASS

**Evidence:**

```bash
$ pnpm qa:api -- -g "EP02-US01-TC02"

✓ EP02-US01-TC02 — register with existing email returns 409 (431ms)
```

API response:

```json
{
  "errors": {
    "email": ["Email already in use"]
  }
}
```

Notes:  
API prevents duplicate registrations and returns proper 409 Conflict.

---

## **EP02-US01-TC03 — Invalid email format rejected**

**Result:** ✅ PASS

**Evidence:**

```bash
$ pnpm qa:api -- -g "EP02-US01-TC03"

✓ EP02-US01-TC03 — invalid email format returns 400 (298ms)
```

Payload:

```json
{
  "errors": {
    "email": ["Invalid email format"]
  }
}
```

---

## **EP02-US01-TC04 — Password must contain special char**

**Result:** ✅ PASS

```bash
$ pnpm qa:api -- -g "EP02-US01-TC04"

✓ EP02-US01-TC04 — password must contain special char returns 400
```

---

## **EP02-US01-TC05 — Password must contain number**

**Result:** ✅ PASS

```bash
$ pnpm qa:api -- -g "EP02-US01-TC05"

✓ EP02-US01-TC05 — password must contain a number returns 400
```

---

## **EP02-US01-TC06 — Password must be at least 8 chars**

**Result:** ✅ PASS

```bash
$ pnpm qa:api -- -g "EP02-US01-TC06"

✓ EP02-US01-TC06 — password must be at least 8 chars long returns 400
```

---

## **EP02-US01-TC07 — Password mismatch rejected**

**Result:** ✅ PASS

```bash
$ pnpm qa:api -- -g "EP02-US01-TC07"

✓ EP02-US01-TC07 — password mismatch returns 400
```

---

## **EP02-US01-TC08 — Empty or missing request body**

**Result:** ✅ PASS

```bash
$ pnpm qa:api -- -g "EP02-US01-TC08"

✓ EP02-US01-TC08 — empty body returns 400
```

---

## **EP02-US01-TC09 — Register form UI validations**

**Result:** ✅ PASS

```bash
$ pnpm test:ui -- -g "EP02-US01-TC09"

✓ EP02-US01-TC09 — Register form UI validations (1.8s)
```

Notes:  
Client-side validation works: empty submission blocked, email format validated, password mismatch enforced, and no API calls issued when invalid.

---

### **EP02-US01-TC10 — Home page renders and navigation to Register works**

**Result:** ✔ Passed

**Summary:**
The Home page (/) loads successfully and displays expected UI elements including the main hero title and the primary navigation CTA. Clicking the CTA correctly redirects the user to the Registration page.

**What Was Validated:**

- Successful page load (HTTP 200)
- Hero/landing UI visible
- "Register" button/link present
- Navigation to /register works
- Register page displays expected heading after navigation

**Result:**
All assertions passed. Home page is functional and correctly leads users into the onboarding flow.

---

## US01 Summary

All US02 registration test cases are automated and passing. Validation logic is consistent across backend and frontend. Playwright POM stable, selectors strong, and tagging integrated.

## **EP02-US02 — Login & Session Cookie**

## EP02-US02-TC01 — Login with valid credentials

**Result:** ✅ PASS

**Evidence:**

```bash
$ pnpm qa:api -- -g "EP02-US02-TC01"

✓ EP02-US02-TC01 — login with valid credentials returns 200
```

API response:

```json
{
  "success": true
}
```

Cookie headers:

```
Set-Cookie: qasession=...; HttpOnly; SameSite=Lax
```

**Notes:**  
Successful authentication returns 200, produces a signed session cookie with correct flags, and no sensitive information is exposed in the response body.

---

## EP02-US02-TC02 — Login with incorrect password

**Result:** ✅ PASS

**Evidence:**

```bash
$ pnpm qa:api -- -g "EP02-US02-TC02"

✓ EP02-US02-TC02 — login with incorrect password returns 401
```

API response:

```json
{
  "error": "Invalid email or password"
}
```

**Notes:**  
API correctly handles credential mismatch: generic message returned, no user-specific leaks, and **no session cookie set**.

---

## EP02-US02-TC03 — Login with non-existing email

**Result:** ✅ PASS

**Evidence:**

```bash
$ pnpm qa:api -- -g "EP02-US02-TC03"

✓ EP02-US02-TC03 — login with non-existing email returns 401
```

**Notes:**  
Unknown emails are treated identically to wrong passwords, preventing user enumeration.  
No cookie is sent in the response.

---

## EP02-US02-TC04 — Invalid login body (empty / missing fields)

**Result:** ✅ PASS

**Evidence:**

```bash
$ pnpm qa:api -- -g "EP02-US02-TC04"

✓ EP02-US02-TC04 — invalid login body returns 400
```

Payload example:

```json
{
  "errors": {
    "email": ["Required"],
    "password": ["Required"]
  }
}
```

**Notes:**  
Zod schema validation blocks malformed requests early. No authentication logic executed.

---

## EP02-US02-TC05 — Login form UI field validations

**Result:** ✔ Passed

**Evidence:**

```bash
$ pnpm test:ui -- -g "EP02-US02-TC05"

✓ EP02-US02-TC05 — Login form UI field validations (2.1s)
```

**What Was Validated:**

- Empty submit shows inline field errors
- Invalid email format produces page-level error
- Wrong password shows global error banner

**Notes:**  
Client-side validation prevents unnecessary backend load and ensures consistent UX.

---

## EP02-US02-TC06 — Successful login redirects to Home and unlocks protected routes

**Result:** ✔ Passed

**Evidence:**

```bash
$ pnpm test:ui -- -g "EP02-US02-TC06"

✓ EP02-US02-TC06 — Successful login redirects to home (2.9s)
```

**What Was Validated:**

- After login, browser redirects to `/`
- Home title (`home-title`) is visible
- Session cookie present inside Chromium context
- Navigating to `/reports` succeeds without redirect
- No error banner visible post-login

**Notes:**  
End-to-end login flow is stable. Authentication + middleware behavior consistent across UI and API.  
Protected pages respect session cookie and remain accessible post-login.

---

## US02 Summary

| Test Case                   | Result |
| --------------------------- | ------ |
| TC01 — Valid login          | PASS   |
| TC02 — Wrong password       | PASS   |
| TC03 — Non-existing email   | PASS   |
| TC04 — Invalid body         | PASS   |
| TC05 — UI field validations | PASS   |
| TC06 — UI successful login  | PASS   |

**All US02 login scenarios passed.**  
Session handling, cookie creation, redirect logic, and UI validation behave consistently and match the specification.
