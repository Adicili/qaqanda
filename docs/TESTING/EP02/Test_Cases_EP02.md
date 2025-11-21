# QAQ&A — Test Cases for **EP02: Authentication & User Roles**

This document contains detailed **manual test cases** for EP02, following the same structure and formatting used in **EP01 Test Cases**, and aligned with the **QAQ&A Test Strategy**.

For each test case:

- Design it as a **manual check first**
- Use the **Automate** flag to indicate whether it **should be covered by automation** (Playwright API/UI, etc.)

---

## US01 — User Registration Flow

### EP02-US01-TC01

- **Test name:** EP02-US01-TC01 - Register with valid data
- **Type:** API
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/auth/register-api.spec.ts`
  - Test helper: `us()` + `tc()` from `tests/support/tags.ts`
  - Test name: `EP02-US01-TC01 — Register with valid data returns 200`
  - Command:  
     `sh
pnpm qa:api -- -g "EP02-US01-TC01"
`
    **Description:**  
     Validates the happy-path registration flow, creation of a new user with role `ENGINEER`, and sanitized API response.

**Preconditions:**

- Email `newuser+1@example.com` does not exist in the system.

**Steps:**

1. Send POST request to `/api/auth/register` with body:
   ```json
   {
     "email": "newuser+1@example.com",
     "password": "Passw0rd!",
     "confirmPassword": "Passw0rd!"
   }
   ```
2. Observe response status and body.
3. (If possible) Verify in DB or stub that the new user record exists.

**Expected Result:**

- Response status `200 OK`.
- Response body contains `{ "success": true }`.
- New user is created with role `ENGINEER`.
- No password or sensitive data is returned in the response.

---

### EP02-US01-TC02

- **Test name:** EP02-US01-TC02 - Register with existing email
- **Type:** API
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright
  - Spec file: `tests/api/auth/register-api.spec.ts`
  - Helper: `us()` + `tc()`
  - Test name: `EP02-US01-TC02 — register with existing email returns 409`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US01-TC02"
    ```

**Description:**  
Ensures that registration fails when an email is already in use.

**Preconditions:**

- User with email `engineer@example.com` already exists.

**Steps:**

1. Send POST `/api/auth/register` with:
   ```json
   {
     "email": "engineer@example.com",
     "password": "Passw0rd!",
     "confirmPassword": "Passw0rd!"
   }
   ```

**Expected Result:**

- Response status `409 Conflict`.
- Error message indicates that the email is already in use.
- No duplicate user created.

---

### EP02-US01-TC03

- **Test name:** EP02-US01-TC03 - Invalid email format rejected
- **Type:** API
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright
  - Spec file: `tests/api/auth/register-api.spec.ts`
  - Test name: `EP02-US01-TC03 — invalid email format returns 400`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US01-TC03"
    ```

**Description:**  
Validates backend email format rules.

**Steps:**

1. Send POST `/api/auth/register` with:
   ```json
   {
     "email": "user@invalid",
     "password": "Passw0rd!",
     "confirmPassword": "Passw0rd!"
   }
   ```

**Expected Result:**

- Response status `400 Bad Request`.
- Error payload indicates invalid email format.

---

### EP02-US01-TC04

- **Test name:** EP02-US01-TC04 - Password must contain special char
- **Type:** API
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright
  - Spec file: `tests/api/auth/register-api.spec.ts`
  - Test name: `EP02-US01-TC04 — password must contain special char returns 400`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US01-TC04"
    ```

**Description:**  
Ensures password policy for special characters is enforced.

**Steps:**

1. Send POST `/api/auth/register` with:
   ```json
   {
     "email": "weakpass@example.com",
     "password": "weakpass1",
     "confirmPassword": "weakpass1"
   }
   ```

**Expected Result:**

- Response status `400 Bad Request`.
- Error describes password policy violation (special char).

---

### EP02-US01-TC05

- **Test name:** EP02-US01-TC05 - Password must contain number
- **Type:** API
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Spec file: `tests/api/auth/register-api.spec.ts`
  - Test name: `EP02-US01-TC05 — password must contain a number returns 400`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US01-TC05"
    ```

**Description:**  
Ensures passwords missing digits fail validation.

**Steps:**

1. Send POST `/api/auth/register` with:
   ```json
   {
     "email": "weakpass@example.com",
     "password": "weakpass!",
     "confirmPassword": "weakpass!"
   }
   ```

**Expected Result:**

- Response status `400 Bad Request`.
- Error describes password policy violation (number).

---

### EP02-US01-TC06

- **Test name:** EP02-US01-TC06 - Password must contain be at least 8 chars
- **Type:** API
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Spec file: `tests/api/auth/register-api.spec.ts`
  - Test name: `EP02-US01-TC06 — password must be at least 8 chars long returns 400`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US01-TC06"
    ```

**Description:**  
Ensures backend enforces minimum password length.

**Steps:**

1. Send POST `/api/auth/register` with:
   ```json
   {
     "email": "weakpass@example.com",
     "password": "weak!1",
     "confirmPassword": "weak!1"
   }
   ```

**Expected Result:**

- Response status `400 Bad Request`.
- Error describes password policy violation (length).

---

### EP02-US01-TC07

- **Test name:** EP02-US01-TC07 - Password mismatch rejected
- **Type:** API
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Spec file: `tests/api/auth/register-api.spec.ts`
  - Test name: `EP02-US01-TC07 — password mismatch returns 400`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US01-TC07"
    ```

**Description:**  
Ensures that password confirmation is validated properly.

**Steps:**

1. Send POST `/api/auth/register` with:
   ```json
   {
     "email": "user2@example.com",
     "password": "Passw0rd!",
     "confirmPassword": "Pass123!"
   }
   ```

**Expected Result:**

- Response status `400 Bad Request`.
- Error message clearly states that passwords do not match.

---

### EP02-US01-TC08

- **Test name:** EP02-US01-TC08 - Missing or empty request body
- **Type:** API
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Spec file: `tests/api/auth/register-api.spec.ts`
  - Test name: `EP02-US01-TC08 — empty body returns 400`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US01-TC08"
    ```

**Description:**  
Ensures backend rejects empty or missing payloads.

**Steps:**

1. Send POST `/api/auth/register` with empty body `{}` or no body at all.

**Expected Result:**

- Response status `400 Bad Request`.
- Validation error indicating missing required fields.

---

### EP02-US01-TC09

- **Test name:** Register form UI validations
- **Type:** UI
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright (UI project)
  - Spec file: `tests/ui/register-ui.spec.ts`
  - Test name: `EP02-US01-TC09 — Register form UI validations`
  - Command:
    ```sh
    pnpm test:ui -- -g "EP02-US01-TC09"
    ```

**Description:**

Validate that the `/register` page enforces client-side form validation for email and password fields, and blocks obviously invalid submissions before they reach the API. This includes empty form submission, invalid email format, and mismatching passwords.

**Steps:**

1. Navigate to `/register`.
2. Leave all fields empty and attempt to submit the form.
3. Enter invalid email (e.g. `user@invalid`) and attempt to submit.
4. Enter mismatching passwords and attempt to submit.

**Expected Result:**

- Inline validation messages displayed for each invalid field.
- Submit button disabled or blocked while form invalid.
- No API call sent on obviously invalid input (optional but ideal).

---

### EP02-US01-TC10

- **Test name:** Home page renders and navigation to Register works
- **Type:** UI
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright (UI project)
  - Spec file: tests/ui/home-ui.spec.ts
  - Test helper: us() + tc() from tests/support/tags-playwright.ts
  - Test name: EP02-US01-TC10 — Home page loads and Register navigation works
  - Command:
    pnpm test:ui -- -g "EP02-US01-TC10"

**Description:**

Validates that the newly introduced Home page (/) renders correctly with expected UI elements and that navigation to /register works via the homepage link/button. Confirms that the application’s entry point is functional and provides proper routing into the Registration flow.

**Steps:**

1. Open the home page /.
2. Verify that the home page displays expected content (e.g., title, intro text, CTA button).
3. Click the "Create Account" / "Register" button or link.
4. Verify the browser navigates to /register.
5. Confirm that the Register page displays its main heading.

**Expected Result:**

- Home page renders without errors.
- Primary CTA for registration is visible and clickable.
- Clicking CTA navigates the user to /register.
- /register page displays the expected heading (“Create your QAQ&A account”).

---

## US02 — Login & Session Cookie

### EP02-US02-TC01

- **Test name:** Login with valid credentials (happy path)
- **Type:** API
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/login-api.spec.ts`
  - Test name: `EP02-US02-TC01 — Login with valid credentials (happy path)`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US02-TC01"
    ```

- **Description:**
  Validates the happy-path login flow for an existing `ENGINEER` user.  
  Ensures that valid credentials return `200 OK`, the JSON body `{ "success": true }`, and that a `qaqanda_session` cookie is issued with the correct security flags (`HttpOnly`, `SameSite=Lax`; `Secure` only in production).

**Preconditions:**

- User `engineer@example.com` with password `Passw0rd!` exists.

**Steps:**

1. Send POST `/api/auth/login` with:
   ```json
   {
     "email": "engineer@example.com",
     "password": "Passw0rd!"
   }
   ```
2. Inspect response status, body, and `Set-Cookie` header.

**Expected Result:**

- Response status `200 OK`.
- Response body `{ "success": true }` (or equivalent success payload).
- Session cookie is set with flags: `HttpOnly`, `SameSite=Lax`, `Secure` in prod.

---

### EP02-US02-TC02

- **Test name:** Login with incorrect password
- **Type:** API
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/login-api.spec.ts`
  - Test name: `EP02-US02-TC02 — Login with incorrect password`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US02-TC02"
    ```

- **Description:**
  Ensures that logging in with a valid email but wrong password fails safely.  
  Expects `401 Unauthorized`, a generic error message (`"Invalid email or password"`) to avoid user enumeration, and confirms that **no** session cookie is set on failed authentication.

**Steps:**

1. Send POST `/api/auth/login` with correct email but wrong password.

**Expected Result:**

- Response status `401 Unauthorized`.
- Error message states invalid credentials.
- No session cookie set.

---

### EP02-US02-TC03

- **Test name:** Login with non-existing email
- **Type:** API
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/login-api.spec.ts`
  - Test name: `EP02-US02-TC03 — Login with non-existing email`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US02-TC03"
    ```

- **Description:**
  Validates that login attempts with an email that does not exist in the system are rejected with `401 Unauthorized`.  
  Confirms the backend returns the same generic error message as for wrong passwords to prevent user enumeration, and that no `Set-Cookie` header is present.

**Steps:**

1. Send POST `/api/auth/login` with email that does not exist.

**Expected Result:**

- Response status `401 Unauthorized`.
- Generic invalid credentials message (no user enumeration).
- No session cookie set.

---

### EP02-US02-TC04

- **Test name:** Invalid login body (empty / missing fields)
- **Type:** API
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright API tests
  - Spec file: `tests/api/login-api.spec.ts`
  - Test name: `EP02-US02-TC04 — Invalid login body (empty / missing fields)`
  - Command:
    ```sh
    pnpm qa:api -- -g "EP02-US02-TC04"
    ```

- **Description:**
  Covers validation behavior when the login request body is structurally invalid (e.g. `{}` with no `email` or `password`).  
  Expects `400 Bad Request` with a clear validation error (`"Invalid login data"`) and structured details payload, ensuring the API fails fast before any auth logic or session handling is executed.

**Steps:**

1. Send POST `/api/auth/login` with `{}` or only email or only password.

**Expected Result:**

- Response status `400 Bad Request`.
- Validation error describing missing fields.

---

### EP02-US02-TC05

- **Test name:** Login form UI field validations
- **Type:** UI
- **Priority:** P1
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI tests
  - Spec file: tests/ui/login-ui.spec.ts
  - Test name: EP02-US02-TC05 — Login form UI field validations
  - Command:
    pnpm qa:ui -- -g "EP02-US02-TC05"

**Description:**
Verifies that the /login page performs client-side validation and prevents submitting clearly invalid input. Ensures that empty fields and incorrectly formatted email values trigger inline validation errors and that no login API request is sent until the form becomes valid.

**Steps:**

1. Navigate to `/login`.
2. Leave fields empty and attempt to submit.
3. Enter invalid email string and attempt to submit.

**Expected Result:**

- Inline validation messages for required fields and email format.
- Form does not submit while invalid.

---

### EP02-US02-TC06

- **Test name:** Successful login redirects to home and unlocks protected routes
- **Type:** UI
- **Priority:** P0
- **Automate:** Yes
- **Automation:**
  - Framework: Playwright UI tests
  - Spec file: tests/ui/login-ui.spec.ts
  - Test name: EP02-US02-TC06 — Successful login redirects to home
  - Command:
    pnpm qa:ui -- -g "EP02-US02-TC06"

**Description:**
Validates the happy-path login flow. Ensures that a valid user can successfully authenticate through the UI, receive a session cookie, get redirected to the home page (/), and subsequently access protected routes without being redirected back to /login.

**Preconditions:**

- Valid user exists.

**Steps:**

1. Navigate to `/login`.
2. Enter valid credentials and submit.
3. Observe navigation and attempt to access `/` and `/reports`.

**Expected Result:**

- Browser redirected to `/` on success.
- Protected routes (`/`, `/reports`) now accessible without redirect.
- Session cookie present in browser.

---

## US03 — Middleware & Role-Based Route Protection

### EP02-US03-TC01

- **Test name:** Public routes accessible without authentication
- **Type:** Middleware / UI / API
- **Priority:** P0
- **Automate:** Yes

**Steps:**

1. Open `/login` and `/register` in a clean browser context (no cookies).
2. Call `/api/auth/register` or `/api/auth/login` without cookie.

**Expected Result:**

- All public routes load/respond successfully.
- No redirect to `/login` for these routes.

---

### EP02-US03-TC02

- **Test name:** Unauthenticated access to `/` redirects to `/login`
- **Type:** Middleware / UI
- **Priority:** P0
- **Automate:** Yes

**Steps:**

1. In a clean browser (no session cookie), navigate to `/`.

**Expected Result:**

- User is redirected to `/login`.
- Final URL is `/login` and original content is not visible.

---

### EP02-US03-TC03

- **Test name:** Unauthenticated access to `/reports` redirects to `/login`
- **Type:** Middleware / UI
- **Priority:** P0
- **Automate:** Yes

**Steps:**

1. In a clean browser, navigate to `/reports`.

**Expected Result:**

- Immediate redirect to `/login`.

---

### EP02-US03-TC04

- **Test name:** Unauthenticated API call to `/api/ask` returns 401
- **Type:** API
- **Priority:** P0
- **Automate:** Yes

**Steps:**

1. Send POST `/api/ask` without any auth cookie.

**Expected Result:**

- Response status `401 Unauthorized`.
- Error payload clearly indicates missing authentication.

---

### EP02-US03-TC05

- **Test name:** ENGINEER accessing `/kb` is blocked
- **Type:** UI
- **Priority:** P0
- **Automate:** Yes

**Preconditions:**

- User `engineer@example.com` with role `ENGINEER` exists.

**Steps:**

1. Login as `engineer@example.com`.
2. Navigate to `/kb`.

**Expected Result:**

- Access is denied: redirect to another page or error state shown.
- No KB management UI available.

---

### EP02-US03-TC06

- **Test name:** ENGINEER accessing `/api/kb/*` receives 403
- **Type:** API
- **Priority:** P0
- **Automate:** Yes

**Steps:**

1. Authenticate as ENGINEER (via API).
2. Call `/api/kb/add` or `/api/kb/update`.

**Expected Result:**

- Response status `403 Forbidden`.

---

### EP02-US03-TC07

- **Test name:** LEAD accessing `/kb` is allowed
- **Type:** UI
- **Priority:** P0
- **Automate:** Yes

**Preconditions:**

- User `lead@example.com` with role `LEAD` exists.

**Steps:**

1. Login as `lead@example.com`.
2. Navigate to `/kb`.

**Expected Result:**

- Page loads successfully with KB management UI visible.

---

### EP02-US03-TC08

- **Test name:** LEAD accessing `/api/kb/*` is allowed
- **Type:** API
- **Priority:** P0
- **Automate:** Yes

**Steps:**

1. Authenticate as LEAD.
2. Call `/api/kb/add` or `/api/kb/update` with valid body (can be stubbed for now).

**Expected Result:**

- Response status `200 OK` (or 2xx).
- No 401/403 errors.

---

### EP02-US03-TC09

- **Test name:** Invalid/expired session treated as unauthenticated
- **Type:** Middleware / API
- **Priority:** P0
- **Automate:** Yes

**Steps:**

1. Set a fake/invalid session cookie in the browser or request context.
2. Access protected UI route `/` or `/reports`.
3. Call protected API `/api/ask` with the invalid cookie.

**Expected Result:**

- UI: redirect to `/login`.
- API: `401 Unauthorized`.
- System does not accept or trust invalid/expired tokens.

---

## Summary

| US   | # of Tests | Automated | Focus                       |
| ---- | ---------- | --------- | --------------------------- |
| US01 | 7          | 7         | Registration API + UI flows |
| US02 | 6          | 6         | Login, cookies, UI behavior |
| US03 | 9          | 9         | Middleware, RBAC, sessions  |

**Total:** 22 test cases  
**Automation coverage:** 100% planned (API + UI), executed via Playwright (request + browser) and aligned with Test Strategy.
