// tests/support/api-tags.ts
import { test } from '@playwright/test';

export function usApi(id: string, name: string, fn: () => void) {
  return test.describe(`${id} — ${name}`, fn);
}

export function tcApi(id: string, name: string, fn: (args: any, testInfo: any) => any) {
  return (test as any)(`${id} — ${name}`, fn);
}
