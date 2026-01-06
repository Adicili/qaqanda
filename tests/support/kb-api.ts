// tests/support/kb-api.ts
import { expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export const KB_ADD_ENDPOINT = `${BASE_URL}/api/kb/add`;
export const KB_UPDATE_ENDPOINT = `${BASE_URL}/api/kb/update`;

export type MockLLMMode = 'malformed' | 'schema_invalid' | 'code_fence' | 'throw' | 'ok';

export function llmMockHeader(mode: MockLLMMode) {
  // You MUST implement support for this in the server routes.
  // Example: read request.headers.get('x-mock-llm')
  return { 'x-mock-llm': mode };
}

export async function kbAdd(
  request: any,
  cookie: string | null,
  data: any,
  headers?: Record<string, string>,
) {
  const res = await request.post(KB_ADD_ENDPOINT, {
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(headers ?? {}),
    },
    data,
  });
  return res;
}

export async function kbUpdate(
  request: any,
  cookie: string | null,
  data: any,
  headers?: Record<string, string>,
) {
  const res = await request.post(KB_UPDATE_ENDPOINT, {
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(headers ?? {}),
    },
    data,
  });
  return res;
}

export async function expectErrorJson(res: any) {
  const json = await res.json();
  expect(json).toHaveProperty('error');
  return json as { error: string };
}
