// tests/api/kb-add-api.spec.ts
import crypto from 'node:crypto';

import { test, expect, type APIRequestContext } from '@playwright/test';

import { ensureUser, loginAndGetSessionCookie } from '../support/auth-api';
import { promoteUserRole } from '../support/admin-api';
import { kbAdd, expectErrorJson, llmMockHeader } from '../support/kb-api';
import { readLocalDb } from '../../src/lib/localdb';

function annotate(tc: string, us: string) {
  test
    .info()
    .annotations.push(
      { type: 'testcase', description: tc },
      { type: 'doc', description: 'docs/TESTING/EP05/Test_Cases_EP05.md' },
      { type: 'us', description: us },
    );
}

async function getLeadCookie(request: APIRequestContext) {
  const leadUser = await ensureUser(request, 'LEAD');
  await promoteUserRole(request, { email: leadUser.email, role: 'LEAD' });
  return loginAndGetSessionCookie(request, 'LEAD');
}

function expectJsonResponse(res: any) {
  const ct = res.headers()?.['content-type'] ?? '';
  expect(ct, 'response must be JSON').toContain('application/json');
}

function findAuditForKb(db: any, kbId: string) {
  return (db.audit ?? []).filter((a: any) => a?.kbId === kbId);
}

function findKbDoc(db: any, kbId: string) {
  return (db.kb ?? []).find((d: any) => d?.id === kbId) ?? null;
}

function uniqueMarker(prefix: string) {
  return `${prefix}__${crypto.randomUUID()}`;
}

async function assertNoKbOrAuditContains(marker: string) {
  const db = await readLocalDb();

  const kbHit = (db.kb ?? []).some((d: any) =>
    JSON.stringify(d ?? {})
      .toLowerCase()
      .includes(marker.toLowerCase()),
  );

  const auditHit = (db.audit ?? []).some((a: any) =>
    JSON.stringify(a ?? {})
      .toLowerCase()
      .includes(marker.toLowerCase()),
  );

  expect(kbHit, 'DB must not contain KB write for failed request').toBe(false);
  expect(auditHit, 'DB must not contain audit write for failed request').toBe(false);
}

test.describe('EP05-US01 — Add Knowledge Base Entry via AI (API)', () => {
  test('EP05-US01-TC01 — unauthenticated add rejected', async ({ request }) => {
    annotate('EP05-US01-TC01', 'EP05-US01');

    const marker = uniqueMarker('TC01_UNAUTH');
    const before = await readLocalDb();

    const res = await kbAdd(request, null, {
      prompt: `Generate KB entry ${marker}`,
    });

    expect(res.status()).toBe(401);
    expectJsonResponse(res);

    const json = await expectErrorJson(res);

    // keep it flexible: just ensure it's a sane auth error
    expect(json.error.toLowerCase()).toMatch(/unauth|auth|login|session|token/);
    await assertNoKbOrAuditContains(marker);
    const after = await readLocalDb();
    expect(after.kb.length).toBe(before.kb.length);
    expect(after.audit.length).toBe(before.audit.length);
  });

  test('EP05-US01-TC02 — engineer forbidden', async ({ request }) => {
    annotate('EP05-US01-TC02', 'EP05-US01');

    const marker = uniqueMarker('TC02_FORBIDDEN');
    const before = await readLocalDb();

    const engineerCookie = await loginAndGetSessionCookie(request, 'ENGINEER');

    const res = await kbAdd(request, engineerCookie, {
      prompt: `Generate KB entry ${marker}`,
    });

    expect(res.status()).toBe(403);
    expectJsonResponse(res);

    const json = await expectErrorJson(res);
    expect(json.error.toLowerCase()).toMatch(/forbidden|lead|role|permission|access/);
    await assertNoKbOrAuditContains(marker);
    const after = await readLocalDb();
    expect(after.kb.length).toBe(before.kb.length);
    expect(after.audit.length).toBe(before.audit.length);
  });

  test('EP05-US01-TC03 — lead happy path', async ({ request }) => {
    annotate('EP05-US01-TC03', 'EP05-US01');

    const leadCookie = await getLeadCookie(request);
    const marker = uniqueMarker('TC03_HAPPY');

    const res = await kbAdd(request, leadCookie, {
      prompt: `Generate KB entry ${marker}`,
    });

    expect(res.status()).toBe(200);
    expectJsonResponse(res);

    const json = await res.json();
    const kbId = json.id as string;

    // ✅ Contract
    expect(json).toMatchObject({ success: true });
    expect(json).toHaveProperty('id');
    expect(typeof json.id).toBe('string');

    // ✅ Basic ID sanity (your code uses "kb_" prefix)
    expect(json.id).toMatch(/^kb_[a-z0-9-]{10,}$/i);
    const db = await readLocalDb();
    const doc = (db.kb ?? []).find((d: any) => d?.id === kbId);
    expect(doc).toBeTruthy();
    expect(JSON.stringify(doc)).toContain(marker);

    const audits = (db.audit ?? []).filter((a: any) => a?.kbId === kbId);
    expect(audits.length).toBeGreaterThan(0);
    expect(String(audits[audits.length - 1]?.afterJson ?? '')).toContain(marker);
  });

  test('EP05-US01-TC04 — invalid prompt', async ({ request }) => {
    annotate('EP05-US01-TC04', 'EP05-US01');

    const leadCookie = await getLeadCookie(request);
    const before = await readLocalDb();

    const r1 = await kbAdd(request, leadCookie, {});
    expect(r1.status()).toBe(400);
    expectJsonResponse(r1);
    const j1 = await expectErrorJson(r1);
    // zod flatten -> often includes `fieldErrors`
    expect(JSON.stringify(j1.details ?? {})).toMatch(/prompt/i);

    const r2 = await kbAdd(request, leadCookie, { prompt: '' });
    expect(r2.status()).toBe(400);
    expectJsonResponse(r2);
    const j2 = await expectErrorJson(r2);
    expect(JSON.stringify(j2.details ?? {})).toMatch(/prompt/i);

    const r3 = await kbAdd(request, leadCookie, { prompt: '   ' });
    expect(r3.status()).toBe(400);
    expectJsonResponse(r3);
    const j3 = await expectErrorJson(r3);
    expect(JSON.stringify(j3.details ?? {})).toMatch(/prompt/i);
    const after = await readLocalDb();
    expect(after.kb.length).toBe(before.kb.length);
    expect(after.audit.length).toBe(before.audit.length);
  });

  test('EP05-US01-TC05 — prompt too long', async ({ request }) => {
    annotate('EP05-US01-TC05', 'EP05-US01');

    const marker = uniqueMarker('TC05_TOOLONG');
    const before = await readLocalDb();
    const leadCookie = await getLeadCookie(request);
    const longPrompt = `${marker} ` + 'A'.repeat(20_000);

    const res = await kbAdd(request, leadCookie, { prompt: longPrompt });

    expect([400, 413]).toContain(res.status());
    expectJsonResponse(res);

    const json = await expectErrorJson(res);

    // error može biti generički
    expect(json.error.toLowerCase()).toMatch(/invalid request body|invalid/i);

    // ali details moraju da pominju prompt/dužinu
    expect(JSON.stringify(json.details ?? {})).toMatch(/prompt/i);
    expect(JSON.stringify(json.details ?? {})).toMatch(/too long|max|10000|length/i);
    await assertNoKbOrAuditContains(marker);
    const after = await readLocalDb();
    expect(after.kb.length).toBe(before.kb.length);
    expect(after.audit.length).toBe(before.audit.length);
  });

  test('EP05-US01-TC06 — malformed AI output', async ({ request }) => {
    annotate('EP05-US01-TC06', 'EP05-US01');

    const marker = uniqueMarker('TC06_MALFORMED');
    const before = await readLocalDb();

    const leadCookie = await getLeadCookie(request);

    const res = await kbAdd(
      request,
      leadCookie,
      { prompt: `Generate KB entry ${marker}` },
      llmMockHeader('malformed'),
    );

    expect(res.status()).toBe(400);
    expectJsonResponse(res);

    const json = await expectErrorJson(res);
    expect(json.error.toLowerCase()).toMatch(/llm|ai|json|parse|malformed|invalid/);
    await assertNoKbOrAuditContains(marker);
    const after = await readLocalDb();
    expect(after.kb.length).toBe(before.kb.length);
    expect(after.audit.length).toBe(before.audit.length);
  });

  test('EP05-US01-TC07 — schema invalid AI output', async ({ request }) => {
    annotate('EP05-US01-TC07', 'EP05-US01');

    const leadCookie = await getLeadCookie(request);
    const marker = uniqueMarker('TC07_SCHEMA');
    const before = await readLocalDb();

    const res = await kbAdd(
      request,
      leadCookie,
      { prompt: `Generate KB entry ${marker}` },
      llmMockHeader('schema_invalid'),
    );

    expect(res.status()).toBe(400);
    expectJsonResponse(res);

    const json = await expectErrorJson(res);
    expect(json.error.toLowerCase()).toMatch(/schema|validation|zod|invalid/);
    await assertNoKbOrAuditContains(marker);
    const after = await readLocalDb();
    expect(after.kb.length).toBe(before.kb.length);
    expect(after.audit.length).toBe(before.audit.length);
  });

  test('EP05-US01-TC08 — code fence rejection', async ({ request }) => {
    annotate('EP05-US01-TC08', 'EP05-US01');

    const leadCookie = await getLeadCookie(request);
    const marker = uniqueMarker('TC08_FENCE');
    const before = await readLocalDb();

    const res = await kbAdd(
      request,
      leadCookie,
      { prompt: `Generate KB entry ${marker}` },
      llmMockHeader('code_fence'),
    );

    expect(res.status()).toBe(400);
    expectJsonResponse(res);

    const json = await expectErrorJson(res);
    expect(json.error.toLowerCase()).toMatch(/code|fence|json|format|invalid/);
    await assertNoKbOrAuditContains(marker);
    const after = await readLocalDb();
    expect(after.kb.length).toBe(before.kb.length);
    expect(after.audit.length).toBe(before.audit.length);
  });

  test('EP05-US01-TC09 — audit create', async ({ request }) => {
    annotate('EP05-US01-TC09', 'EP05-US01');

    const leadCookie = await getLeadCookie(request);

    const res = await kbAdd(request, leadCookie, {
      prompt: 'Generate KB entry about audit trail on create',
    });

    expect(res.status()).toBe(200);
    expectJsonResponse(res);

    const json = await res.json();
    expect(json).toMatchObject({ success: true });
    const kbId = json.id as string;

    const after = await readLocalDb();

    // ✅ KB doc exists
    const doc = findKbDoc(after, kbId);
    expect(doc, 'KB doc must exist in DB').toBeTruthy();

    // ✅ Audit exists for this kbId
    const audits = findAuditForKb(after, kbId);
    expect(audits.length, 'must create at least 1 audit record for this kbId').toBeGreaterThan(0);

    // ✅ newest audit for this kbId looks correct
    const a = audits[audits.length - 1];

    const changeType = String(a.changeType ?? a.change_type ?? '');
    expect(changeType).toMatch(/CREATE/i);

    const actor = a.actorUserId ?? a.actor_user_id;
    expect(actor, 'actor user id must be present').toBeTruthy();

    const afterJson = String(a.afterJson ?? a.after_json ?? '');
    expect(afterJson).toMatch(new RegExp(kbId));
  });

  test.skip('EP05-US01-TC10 — atomicity', async ({ request }) => {
    annotate('EP05-US01-TC10', 'EP05-US01');

    // 🚨 This test needs a backend hook, otherwise it's fake.
    // You MUST implement something like:
    // - if req.headers.get('x-mock-audit') === 'throw' then insertKbAudit throws
    test.fail(
      true,
      'Requires audit failure hook (e.g. x-mock-audit: throw) + atomic write semantics',
    );

    const leadCookie = await getLeadCookie(request);
    const before = await readLocalDb();

    const res = await kbAdd(
      request,
      leadCookie,
      { prompt: 'Generate KB entry but audit will fail' },
      { 'x-mock-audit': 'throw' },
    );

    expect(res.status()).toBe(500);

    const after = await readLocalDb();

    // ✅ No KB doc inserted
    expect((after.kb ?? []).length).toBe((before.kb ?? []).length);
    // ✅ No audit inserted
    expect((after.audit ?? []).length).toBe((before.audit ?? []).length);
  });
});
