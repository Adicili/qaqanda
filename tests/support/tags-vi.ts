// tests/support/tags-vitest.ts
import { describe, it } from 'vitest';

export type TestFn = () => unknown | Promise<unknown>;
export type DescribeFn = () => void;

export function us(id: string, name: string, fn: DescribeFn) {
  return describe(`${id} — ${name}`, fn);
}

export function tc(id: string, name: string, fn: TestFn, timeout?: number) {
  const fullName = `${id} — ${name}`;
  if (timeout !== undefined) {
    return it(fullName, fn, timeout);
  }
  return it(fullName, fn);
}
