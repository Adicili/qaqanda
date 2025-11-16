# QAQ&A — Test Plan for **EP02: Authentication & User Roles**

## 1) Objective

Verify that the authentication system (registration, login, session handling) and role-based access control (RBAC) behave correctly, securely, and consistently across API and UI flows.  
Confirm that middleware blocks unauthorized access and enforces Lead-only restrictions.

---

## 2) Scope

**In scope:**  
EP02-US01..US03 only

- `/api/auth/register`
- `/api/auth/login`
- Session cookie creation
- Middleware-based route protection
- RBAC (Engineer vs Lead) for UI & API routes
- `/login` and `/register` pages

**Out of scope:**

- Databricks integration (EP03)
- Ask engine (EP04)
- Knowledge Base management (EP05)
- Reports & analytics (EP06)
- CI/CD execution (EP08)

---

## 3) Approach

Combination of:

- **API tests** using Playwright request context
  - Positive & negative scenarios
  - Status codes, error messages, cookie assertions

- **UI tests** using Playwright
  - Form validations
  - Login/register flows
  - Redirects on unauthorized access
  - Role-based access blocking

- **Middleware verification**
  - Redirects for protected UI routes
  - 401/403 handling for API routes

All tests fully scriptable and reproducible.  
No manual testing required except basic visual confirmation.

---

## 4) Environment

- Runtime: Node 20.x
- Framework: Next.js 14 (App Router)
- Authentication: custom session cookie + Zod validation
- Roles: `ENGINEER` (default), `LEAD`
- Browsers: Playwright (Chromium, Firefox, WebKit)
- OS: Win/macOS/Linux

Test users (for EP02 validation):

| Email                | Password  | Role     |
| -------------------- | --------- | -------- |
| lead@example.com     | Passw0rd! | LEAD     |
| engineer@example.com | Passw0rd! | ENGINEER |

---

## 5) Entry / Exit Criteria

### Entry

- EP01 foundation completed
- Register & login API endpoints implemented
- Middleware active for protected routes
- Test users available (static or seeded)

### Exit

- All EP02 scenarios below pass
- No open blocker/critical defects
- Login/register flows verified via API & UI
- Middleware protection validated
- RBAC enforcement verified on both UI & API level

---

## 6) Scenarios to Cover (high-level, no step detail)

### **US01 — User Registration**

1. **Register with valid data succeeds**
   - New unique email
   - Valid password rules
   - Returns 200 + success
   - User role defaults to `ENGINEER`

2. **Register with existing email fails**
   - Same email already in DB
   - Returns 409 Conflict

3. **Invalid email format rejected**
   - Missing @ symbol / domain
   - Returns 400

4. **Weak password rejected**
   - < 8 characters
   - No number OR no special character
   - Returns 400

5. **Password mismatch rejected**
   - `password !== confirmPassword`
   - Returns 400

6. **Missing or empty request body rejected**
   - Empty JSON
   - Missing fields
   - Returns 400

7. **UI: Register form validations appear correctly**
   - Inline messages
   - Disabled submit until valid
   - Form error banners displayed when API rejects

---

### **US02 — User Login**

8. **Login with valid credentials succeeds**
   - 200 OK
   - Session cookie set:
     - httpOnly
     - SameSite=Lax
     - Secure (prod)
   - Redirects to `/`

9. **Login with incorrect password fails**
   - 401 Unauthorized

10. **Login with non-existing email fails**

- 401 Unauthorized

11. **Invalid body (empty fields) rejected**

- Returns 400

12. **UI: Login page validates fields**

- Email format validation
- Error banner for invalid credentials

13. **UI: Successful login navigates to Home page**

- Cookie stored
- Protected pages accessible after login

---

### **US03 — Middleware & Role-Based Access Control**

#### Public Routes

14. **Public routes accessible without authentication**

- `/login`
- `/register`
- `/api/auth/*`

#### Protected Routes (Auth Required)

15. **Unauthenticated user accessing `/` is redirected to `/login`**
16. **Unauthenticated user accessing `/reports` is redirected to `/login`**
17. **Unauthenticated API call to `/api/ask` returns 401**

#### Role Enforcement (Engineer vs Lead)

18. **ENGINEER accessing `/kb` is blocked**

- UI → redirect or error
- API → 403 Forbidden

19. **ENGINEER accessing `/api/kb/*` returns 403**

20. **LEAD accessing `/kb` is allowed**

- UI → 200, page loaded
- API → 200

21. **LEAD accessing `/api/kb/*` succeeds**

#### Session Behavior

22. **Expired/invalid cookie → treated as unauthenticated**

- Redirect to `/login`
- API returns 401

23. **Logout clears session cookie (if logout implemented in EP02)**

- After logout → all protected routes blocked again

---

## 7) Risks & Mitigations

| Risk                                 | Mitigation                                        |
| ------------------------------------ | ------------------------------------------------- |
| Flaky UI auth tests                  | Use API login helper + cookie injection for setup |
| Session cookie not readable in tests | Use Playwright request context cookie handling    |
| Missing role data in local stub DB   | Use seeded fixed test users                       |
| Redirect detection flaky in CI       | Assert URL + status code, not visual timing       |

---

## 8) Evidence to Collect

- API test logs (Playwright request context output)
- UI screenshots for:
  - Login/register form errors
  - RBAC failures (403 pages)
- Playwright HTML report
- Traces on failure
- Console output verifying cookie presence
- Network tab logs for redirects (optional)

---

## 9) Commands (Quick Sheet)

```bash
pnpm dev
pnpm test          # full suite
npx playwright test --grep @auth
npx playwright show-report
```

---

## 10) Acceptance & Sign-off

- All scenarios executed & green
- No open blocker or critical EP02 defects
- Auth, sessions, middleware, and RBAC validated across UI and API
- Test evidence attached in test report
- Sign-off: Tech Lead + QA Lead
