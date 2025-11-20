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

## Summary

All EP02 registration test cases are automated and passing. Validation logic is consistent across backend and frontend. Playwright POM stable, selectors strong, and tagging integrated.
