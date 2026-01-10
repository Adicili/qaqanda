// tests/support/kb-api.ts
import { type APIRequestContext, expect } from '@playwright/test';

export const KB_ADD_ENDPOINT = '/api/kb/add';
export const KB_UPDATE_ENDPOINT = '/api/kb/update';

export type MockLLMMode = 'malformed' | 'schema_invalid' | 'code_fence' | 'throw' | 'ok';

export function llmMockHeader(mode: MockLLMMode) {
  return { 'x-mock-llm': mode };
}

export async function kbAdd(
  request: APIRequestContext,
  cookie: string | null,
  data: any,
  headers?: Record<string, string>,
) {
  return request.post(KB_ADD_ENDPOINT, {
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(headers ?? {}),
    },
    data,
  });
}

export async function kbUpdate(
  request: APIRequestContext,
  cookie: string | null,
  data: any,
  headers?: Record<string, string>,
) {
  return request.post(KB_UPDATE_ENDPOINT, {
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(headers ?? {}),
    },
    data,
  });
}

export async function expectErrorJson(res: any) {
  const json = await res.json();
  expect(json).toHaveProperty('error');
  expect(typeof (json as any).error).toBe('string');
  expect((json as any).error.length).toBeGreaterThan(0);
  return json as { error: string; details?: any };
}
