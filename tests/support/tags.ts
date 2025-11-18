// tests/support/tags.ts
import { describe, it } from 'vitest';

// Tip za telo testa (dozvoljava i sync i async)
export type TestFn = () => unknown | Promise<unknown>;
// Tip za telo describe bloka
export type DescribeFn = () => void;

/**
 * Create a tagged US-level describe block.
 * Example:
 *   us('US03', 'Environment Variable Validation', () => { ... })
 * will produce describe name:
 *   "US03 — Environment Variable Validation"
 */
export function us(id: string, name: string, fn: DescribeFn) {
  return describe(`${id} — ${name}`, fn);
}

/**
 * Create a tagged TC-level test case.
 * Example:
 *   tc('EP01-US03-TC03', 'No direct process.env usage...', () => { ... })
 * will produce test name:
 *   "EP01-US03-TC03 — No direct process.env usage..."
 *
 *  * Optional 4th argument = timeout in ms.
 */
export function tc(id: string, name: string, fn: TestFn, timeout?: number) {
  const fullName = `${id} — ${name}`;
  if (timeout !== undefined) {
    return it(fullName, fn, timeout);
  }
  return it(fullName, fn);
}
