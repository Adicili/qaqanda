# EP02 — Authentication & User Roles

## Epic Description

This epic delivers the core authentication and authorization system for the QAQ&A application.  
It includes user registration, login, secure session handling, role-based access control, and route protection.  
Two roles must exist: **QA Engineer (default)** and **QA Lead (elevated permissions)**.  
All future protected features depend on this epic.

### Epic Completion Criteria

- Users can register and log in via UI and API
- Session is stored in secure HTTP-only cookie
- User roles stored in database and enforced server-side
- Unauthorized access is blocked automatically via middleware
- Public vs protected vs role-restricted routes behave correctly
- Test coverage includes happy & negative paths for all auth flows

---

## EP02-US01 — User Registration Flow (3 pts)

### Description

As a **new user**, I want to register an account using email and password so I can authenticate and use the application.

### Acceptance Criteria

- Valid email + password (>=8 chars, contains number + symbol)
- Password stored **hashed** (bcrypt) in database
- Duplicate email returns `409 Conflict`
- Invalid body returns `400 Bad Request`
- On success, user role = `ENGINEER` by default
- Registration does **not** auto-login the user

### Tasks

- **EP02-US01-T01 — Create `/api/auth/register` endpoint**
  1. Create `app/api/auth/register/route.ts`
  2. Validate body with Zod `{ email, password, confirmPassword }`
  3. Reject mismatched passwords
  4. Hash password with bcrypt (saltRounds: 12)
  5. Insert user via Databricks wrapper `db.users.create()`
  6. Return `{ success: true }` with 200 status

- **EP02-US01-T02 — Add `/register` UI page**
  1. Form fields: email, password, confirm password
  2. Inline validation for weak or mismatched passwords
  3. On success -> redirect to `/login`

- **EP02-US01-T03 — Add API tests**
  - Valid registration returns 200
  - Duplicate email returns 409
  - Invalid email format returns 400
  - Weak password returns 400

- **EP02-US01-T04 — Add UI tests**
  - Valid form submits and redirects
  - Required fields missing -> validation messages
  - Weak password -> validation prevents submit

### Deliverables

app/api/auth/register/route.ts
app/register/page.tsx
schemas/auth.ts
lib/db.users.ts
tests/api/register.spec.ts
tests/ui/register.spec.ts

---

## EP02-US02 — Login & Session Cookie (3 pts)

### Description

As a **registered user**, I want to log in and receive a secure session so I can access protected features.

### Acceptance Criteria

- Valid credentials return 200 + secure cookie
- Cookie is `httpOnly`, `SameSite=Lax`, `Secure` (prod only)
- Invalid credentials return `401 Unauthorized`
- After login, redirect to `/`
- Session must include user `id` + `role`, signed or encrypted

### Tasks

- **EP02-US02-T01 — Create `/api/auth/login` endpoint**
  1. Validate body via Zod
  2. Fetch user by email
  3. Compare bcrypt password hash
  4. Generate signed or encrypted session token
  5. Write cookie to response headers

- **EP02-US02-T02 — Create `/login` UI page**
  1. Email + password form
  2. Show “invalid credentials” on 401 response
  3. On success -> redirect to `/`

- **EP02-US02-T03 — Add API + UI tests**
  - Success response sets cookie
  - Wrong password returns 401
  - Unknown email returns 401
  - UI login flow verified with Playwright

### Deliverables

app/api/auth/login/route.ts
app/login/page.tsx
lib/session.ts
tests/api/login.spec.ts
tests/ui/login.spec.ts

---

## EP02-US03 — Middleware & Role-Based Route Protection (3 pts)

### Description

As an authenticated user, I want restricted routes to be automatically protected so unauthorized users are blocked without extra code.

### Acceptance Criteria

- Public routes allowed: `/login`, `/register`, `/api/auth/*`
- Auth-only routes redirect to `/login` if missing session
- Role-restricted routes return 403 if role insufficient
- Middleware attaches user info (id, role) to request context

### Tasks

- **EP02-US03-T01 — Create `middleware.ts`**
  1. Define allowlist of public pages
  2. Parse session cookie
  3. Block or redirect unauthorized users
  4. Inject user object into request context

- **EP02-US03-T02 — Add role guard util**
  - Create `lib/roles.ts`
  - `requireLead()` helper for `/api/kb/*`

- **EP02-US03-T03 — Add tests**
  - No cookie => redirect or 401
  - Wrong role => 403
  - UI test: navigating to Lead-only page forces redirect

### Deliverables

middleware.ts
lib/roles.ts
tests/api/auth-guard.spec.ts
tests/ui/auth-guard.spec.ts

---

## ✅ EP02 Epic Done When

- Registration + login work (UI + API)
- Session cookie created and validated
- Authorization enforced via middleware
- Role permissions respected on all protected pages
- Test coverage includes success + failure paths
