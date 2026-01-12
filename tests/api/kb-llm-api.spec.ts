import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

// --- Helpers ----------------------------------------------------

function authLead() {
  return {
    'x-user-id': 'lead-1',
    'x-user-role': 'LEAD',
  };
}

function authEngineer() {
  return {
    'x-user-id': 'eng-1',
    'x-user-role': 'ENGINEER',
  };
}

async function kbAdd(request: any, prompt: string, headers?: Record<string, string>) {
  return request.post(`${BASE_URL}/api/kb/add`, {
    data: { prompt },
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

async function kbUpdate(
  request: any,
  id: string,
  prompt: string,
  headers?: Record<string, string>,
) {
  return request.post(`${BASE_URL}/api/kb/update`, {
    data: { id, prompt },
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

// ⚠️ Prilagodi ako ti endpoint nije ovakav:
async function kbGet(request: any, id: string) {
  return request.get(`${BASE_URL}/api/kb/get?id=${encodeURIComponent(id)}`, {
    headers: { ...authLead() },
  });
}

// ⚠️ Prilagodi ako ti endpoint nije ovakav:
async function auditList(request: any, kbId: string) {
  return request.get(`${BASE_URL}/api/kb/audit?kbId=${encodeURIComponent(kbId)}`, {
    headers: { ...authLead() },
  });
}

// --- Tests ------------------------------------------------------

test.describe('EP09-US03 — AI-Assisted KB Operations (Playwright API)', () => {
  test('EP09-US03-TC01 — kb add success with llm', async ({ request }) => {
    const res = await kbAdd(request, 'Create a KB entry about resetting passwords in the app.', {
      ...authLead(),
      'x-mock-llm': 'ok',
    });

    expect(res.status(), 'Expected 200 on kb add').toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(typeof json.id).toBe('string');
    const kbId = json.id as string;

    const getRes = await kbGet(request, kbId);
    expect(getRes.status(), 'Expected kb get 200').toBe(200);
    const doc = await getRes.json();

    expect(doc.id).toBe(kbId);
    expect(typeof doc.title).toBe('string');
    expect(typeof doc.text).toBe('string');
    expect(Array.isArray(doc.tags)).toBe(true);

    const aRes = await auditList(request, kbId);
    expect(aRes.status(), 'Expected audit list 200').toBe(200);
    const audits = await aRes.json();

    expect(Array.isArray(audits)).toBe(true);
    expect(audits.length).toBeGreaterThan(0);

    const latest = audits[0];
    expect(latest.createdAt ?? latest.created_at).toBeTruthy();
    expect(latest.llmModel ?? latest.llm_model).toBeTruthy();
  });

  test('EP09-US03-TC02 — kb update success with llm', async ({ request }) => {
    const addRes = await kbAdd(request, 'KB entry about CI pipeline retries.', {
      ...authLead(),
      'x-mock-llm': 'ok',
    });
    expect(addRes.status()).toBe(200);
    const addJson = await addRes.json();
    const kbId = addJson.id as string;

    const updRes = await kbUpdate(
      request,
      kbId,
      'Improve the KB entry with clearer steps and include common failure modes.',
      { ...authLead(), 'x-mock-llm': 'ok' },
    );

    expect(updRes.status(), 'Expected 200 on kb update').toBe(200);

    const getRes = await kbGet(request, kbId);
    expect(getRes.status()).toBe(200);
    const doc = await getRes.json();

    expect(doc.id).toBe(kbId);
    expect(typeof doc.title).toBe('string');
    expect(typeof doc.text).toBe('string');
    expect(Array.isArray(doc.tags)).toBe(true);

    const aRes = await auditList(request, kbId);
    expect(aRes.status()).toBe(200);
    const audits = await aRes.json();
    expect(audits.length).toBeGreaterThan(0);

    const latest = audits[0];
    const model = latest.llmModel ?? latest.llm_model;
    const latency = latest.llmLatencyMs ?? latest.llm_latency_ms;

    expect(model).toBeTruthy();
    expect(latency === null || typeof latency === 'number').toBe(true);
  });

  test('EP09-US03-TC03 — invalid llm output returns 400', async ({ request }) => {
    const res = await kbAdd(request, 'Make something invalid.', {
      ...authLead(),
      'x-mock-llm': 'schema_invalid',
    });

    expect(res.status(), 'Expected 400 on invalid AI output').toBe(400);
    const json = await res.json();
    expect(String(json.error).toLowerCase()).toContain('invalid');
  });

  test('EP09-US03-TC04 — invalid llm output blocks update', async ({ request }) => {
    const addRes = await kbAdd(request, 'KB entry about auth.', {
      ...authLead(),
      'x-mock-llm': 'ok',
    });
    expect(addRes.status()).toBe(200);
    const { id: kbId } = await addRes.json();

    const beforeRes = await kbGet(request, kbId);
    expect(beforeRes.status()).toBe(200);
    const before = await beforeRes.json();

    const updRes = await kbUpdate(request, kbId, 'Corrupt it with garbage output.', {
      ...authLead(),
      'x-mock-llm': 'schema_invalid',
    });

    expect(updRes.status(), 'Expected 400 on invalid AI output').toBe(400);

    const afterRes = await kbGet(request, kbId);
    expect(afterRes.status()).toBe(200);
    const after = await afterRes.json();

    expect(after.title).toBe(before.title);
    expect(after.text).toBe(before.text);
    expect(JSON.stringify(after.tags)).toBe(JSON.stringify(before.tags));
  });

  test('EP09-US03-TC05 — permissions enforced', async ({ request }) => {
    const resAdd = await kbAdd(request, 'Try create without permission', {
      ...authEngineer(),
      'x-mock-llm': 'ok',
    });
    expect(resAdd.status()).toBe(403);

    const resUpd = await kbUpdate(request, 'kb-does-not-matter', 'Try update without permission', {
      ...authEngineer(),
      'x-mock-llm': 'ok',
    });
    expect(resUpd.status()).toBe(403);
  });

  test('EP09-US03-TC06 — audit log contains llm metadata', async ({ request }) => {
    const addRes = await kbAdd(request, 'KB entry about Playwright flakiness and retries.', {
      ...authLead(),
      'x-mock-llm': 'ok',
    });
    expect(addRes.status()).toBe(200);
    const { id: kbId } = await addRes.json();

    const aRes = await auditList(request, kbId);
    expect(aRes.status()).toBe(200);
    const audits = await aRes.json();
    expect(audits.length).toBeGreaterThan(0);

    const latest = audits[0];

    const createdAt = latest.createdAt ?? latest.created_at;
    const model = latest.llmModel ?? latest.llm_model;
    const latency = latest.llmLatencyMs ?? latest.llm_latency_ms;
    const tokens = latest.llmTotalTokens ?? latest.llm_total_tokens;

    expect(createdAt).toBeTruthy();
    expect(model).toBeTruthy();
    expect(latency === null || typeof latency === 'number').toBe(true);

    // tokens are optional (provider may not return usage; mock mode has none)
    if (tokens !== undefined) {
      expect(tokens === null || typeof tokens === 'number').toBe(true);
    }
  });
});
