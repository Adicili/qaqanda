// tests/support/tags-playwright.ts
import { test } from '@playwright/test';

export function us(id: string, name: string, fn: () => void) {
  return test.describe(`${id} — ${name}`, fn);
}

export function tc(id: string, name: string, fn: (args: any, testInfo: any) => any) {
  return (test as any)(`${id} — ${name}`, fn);
}

export function tcSkip(id: string, name: string, fn: (args: any, testInfo: any) => any) {
  return (test.skip as any)(`${id} — ${name}`, fn);
}
