# QAQ&A — Test Tagging & Traceability Standard

This document defines how QAQ&A ensures full traceability between:

- EPIC → User Story (US) → Test Case (TC)
- Automated test code
- Test case documentation
- Test execution reports

The goal is to guarantee that every automated test is directly linked to a functional requirement, and every test failure is traceable back to a specific TC ID and documentation source.

---

## 1. ID Structure: EP / US / TC

Every test case uses a unified identifier:

`EPxx-USyy-TCzz`

Where:

- **EPxx** — Epic ID
- **USyy** — User Story inside the epic
- **TCzz** — Test Case ordinal

Example IDs:

- `EP01-US03-TC01`
- `EP02-US01-TC03`
- `EP02-US01-TC09`

This ID appears consistently in:

- Test_Cases documents
- Automated test names
- JSDoc headers in spec files
- Test reports
- CLI filtering (`-g "EP02-US01-TC03"`)

---

## 2. Code-Level Tagging

### 2.1 Vitest (Quality / Unit / Config tests)

```ts
import { describe, it } from 'vitest';

export function us(id: string, name: string, fn: () => void) {
  return describe(`${id} — ${name}`, fn);
}

export function tc(
  id: string,
  name: string,
  fn: () => unknown | Promise<unknown>,
  timeout?: number,
) {
  const fullName = `${id} — ${name}`;
  if (timeout !== undefined) return it(fullName, fn, timeout);
  return it(fullName, fn);
}
```

---

### 2.2 Playwright (API & UI tests)

```ts
import { test } from '@playwright/test';

export function us(id: string, name: string, fn: () => void) {
  return test.describe(`${id} — ${name}`, fn);
}

export function tc(id: string, name: string, fn: (args: any, testInfo: any) => any) {
  return (test as any)(`${id} — ${name}`, fn);
}
```

---

## 3. Required JSDoc Header Above Every Automated TC

```ts
/**
 * @testcase EP02-US01-TC09
 * @doc docs/TESTING/EP02/Test_Cases_EP02.md
 *
 * Covers:
 * - Inline validation on /register
 * - Blocking invalid submission
 * - Preventing premature API calls
 */
tc('EP02-US01-TC09', 'Register form UI validations', async ({ page }) => {
  // test code...
});
```

---

## 4. Test Case Documentation Linkage

Every TC must include:

- Spec file path
- Helper used
- CLI command
- Human-readable test name

---

## 5. CLI Targeting

### Vitest:

```bash
pnpm qa:test -- --t "EP01-US03-TC01"
```

### Playwright:

```bash
pnpm test:api -- -g "EP02-US01-TC03"
pnpm test:ui  -- -g "EP02-US01-TC09"
```

---

## 6. Reporting

Each entry in the report links:

- Test result
- Evidence
- Automated test
- Documentation

---
