// tests/api/kb-update-api.spec.ts
import crypto from 'node:crypto';

import { test, expect, type APIRequestContext } from '@playwright/test';

import { ensureUser, loginAndGetSessionCookie } from '../support/auth-api';
import { promoteUserRole } from '../support/admin-api';
import { kbAdd, kbUpdate, expectErrorJson, llmMockHeader } from '../support/kb-api';
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

function expectJsonResponse(res: any) {
  const ct = res.headers()?.['content-type'] ?? '';
  expect(ct, 'response must be JSON').toContain('application/json');
}

async function readDb() {
  return await readLocalDb();
}

async function getLeadCookie(request: APIRequestContext) {
  const leadUser = await ensureUser(request, 'LEAD');
  await promoteUserRole(request, { email: leadUser.email, role: 'LEAD' });
  return loginAndGetSessionCookie(request, 'LEAD');
}

function uniqueMarker(prefix: string) {
  return `${prefix}__${crypto.randomUUID()}`;
}

function findKbDoc(db: any, kbId: string) {
  return (db.kb ?? []).find((d: any) => String(d?.id ?? '') === kbId) ?? null;
}

function findAuditsForKb(db: any, kbId: string) {
  return (db.audit ?? []).filter((a: any) => String(a?.kbId ?? a?.kb_id ?? '') === kbId);
}

function getAuditChangeType(a: any) {
  return String(a?.changeType ?? a?.change_type ?? '');
}

function getAuditActor(a: any) {
  return a?.actorUserId ?? a?.actor_user_id ?? null;
}

function getAuditBeforeJson(a: any) {
  return String(a?.beforeJson ?? a?.before_json ?? '');
}

function getAuditAfterJson(a: any) {
  return String(a?.afterJson ?? a?.after_json ?? '');
}

function docSnapshot(doc: any) {
  return {
    id: String(doc?.id ?? ''),
    title: String(doc?.title ?? ''),
    text: String(doc?.text ?? ''),
    tags: Array.isArray(doc?.tags) ? doc.tags.map(String) : [],
    // in localdb row it might be updatedAt (ISO string) or null
    updatedAt: doc?.updatedAt ?? null,
  };
}

async function createKbAsLead(request: APIRequestContext) {
  const leadCookie = await getLeadCookie(request);

  // Put a marker into the prompt. Your mock LLM uses the prompt to generate text for ADD.
  const marker = uniqueMarker('KB_UPDATE_BASELINE');

  const res = await kbAdd(request, leadCookie, {
    prompt: `Generate KB entry baseline for update tests ${marker}`,
  });

  expect(res.status()).toBe(200);
  expectJsonResponse(res);

  const json = await res.json();
  expect(json).toMatchObject({ success: true });
  expect(typeof json.id).toBe('string');

  return { leadCookie, kbId: json.id as string, marker };
}

test.describe('EP05-US02 — Update Knowledge Base Entry via AI (API)', () => {
  test('EP05-US02-TC01 — unauthenticated update rejected', async ({ request }) => {
    annotate('EP05-US02-TC01', 'EP05-US02');

    const before = await readDb();

    const res = await kbUpdate(request, null, { id: 'kb_does_not_matter', prompt: 'Update it' });

    expect(res.status()).toBe(401);
    expectJsonResponse(res);

    const json = await expectErrorJson(res);
    expect(json.error.toLowerCase()).toMatch(/unauth|auth|login|session|token/);

    // No DB writes (global) — only safe if tests aren't racing.
    const after = await readDb();
    expect((after.kb ?? []).length).toBe((before.kb ?? []).length);
    expect((after.audit ?? []).length).toBe((before.audit ?? []).length);
  });

  test('EP05-US02-TC02 — engineer forbidden', async ({ request }) => {
    annotate('EP05-US02-TC02', 'EP05-US02');

    const before = await readDb();

    const engineerCookie = await loginAndGetSessionCookie(request, 'ENGINEER');

    const res = await kbUpdate(request, engineerCookie, {
      id: 'kb_fake',
      prompt: 'Update it',
    });

    expect(res.status()).toBe(403);
    expectJsonResponse(res);

    const json = await expectErrorJson(res);
    expect(json.error.toLowerCase()).toMatch(/forbidden|lead|role|permission|access/);

    // No DB writes (global) — only safe if tests aren't racing.
    const after = await readDb();
    expect((after.kb ?? []).length).toBe((before.kb ?? []).length);
    expect((after.audit ?? []).length).toBe((before.audit ?? []).length);
  });

  test('EP05-US02-TC03 — lead happy path update', async ({ request }) => {
    annotate('EP05-US02-TC03', 'EP05-US02');

    const { leadCookie, kbId } = await createKbAsLead(request);

    const before = await readDb();
    const beforeDoc = findKbDoc(before, kbId);
    expect(beforeDoc, 'precondition: KB doc must exist').toBeTruthy();

    const beforeSnap = docSnapshot(beforeDoc);
    const beforeAudits = findAuditsForKb(before, kbId);

    // Marker goes into prompt; your mockUpdate appends update instruction into text.
    const updateMarker = uniqueMarker('KB_UPDATE_HAPPY');

    const res = await kbUpdate(request, leadCookie, {
      id: kbId,
      prompt: `Append notes about Playwright retries. ${updateMarker}`,
    });

    expect(res.status()).toBe(200);
    expectJsonResponse(res);

    const json = await res.json();
    expect(json).toMatchObject({ success: true, id: kbId });

    const after = await readDb();
    const afterDoc = findKbDoc(after, kbId);
    expect(afterDoc, 'KB doc must still exist after update').toBeTruthy();

    const afterSnap = docSnapshot(afterDoc);

    // ✅ Must NOT change identity
    expect(afterSnap.id).toBe(beforeSnap.id);

    // ✅ Must change content (text should change in mockUpdate)
    expect(afterSnap.text).not.toBe(beforeSnap.text);
    expect(afterSnap.text.toLowerCase()).toContain(updateMarker.toLowerCase());

    // ✅ Title should remain non-empty
    expect(afterSnap.title.length).toBeGreaterThan(0);

    // ✅ Tags must remain array-like
    expect(Array.isArray(afterSnap.tags)).toBe(true);

    // ✅ Should create an UPDATE audit for this kbId (at least one new record)
    const afterAudits = findAuditsForKb(after, kbId);
    expect(afterAudits.length).toBeGreaterThan(beforeAudits.length);

    const newest = afterAudits[afterAudits.length - 1];
    expect(getAuditChangeType(newest)).toMatch(/UPDATE/i);
    expect(getAuditActor(newest), 'actor user id must be present').toBeTruthy();

    const beforeJson = getAuditBeforeJson(newest);
    const afterJson = getAuditAfterJson(newest);

    // Must reference kbId
    expect(beforeJson).toMatch(new RegExp(kbId));
    expect(afterJson).toMatch(new RegExp(kbId));

    // Should contain snapshots
    expect(beforeJson).toMatch(/"title"|title/i);
    expect(afterJson).toMatch(/"title"|title/i);

    // Ideally: before contains old text, after contains new marker
    expect(beforeJson).toMatch(beforeSnap.text.slice(0, Math.min(20, beforeSnap.text.length)));
    expect(afterJson.toLowerCase()).toContain(updateMarker.toLowerCase());
  });

  test('EP05-US02-TC04 — non-existent KB id', async ({ request }) => {
    annotate('EP05-US02-TC04', 'EP05-US02');

    const leadCookie = await getLeadCookie(request);
    const before = await readDb();

    const res = await kbUpdate(request, leadCookie, {
      id: `kb_non_existent_${crypto.randomUUID()}`,
      prompt: 'Update it',
    });

    expect(res.status()).toBe(404);
    expectJsonResponse(res);

    const json = await expectErrorJson(res);
    expect(json.error.toLowerCase()).toMatch(/not found|missing|kb doc/i);

    // No writes
    const after = await readDb();
    expect((after.kb ?? []).length).toBe((before.kb ?? []).length);
    expect((after.audit ?? []).length).toBe((before.audit ?? []).length);
  });

  test('EP05-US02-TC05 — invalid AI output', async ({ request }) => {
    annotate('EP05-US02-TC05', 'EP05-US02');

    const { leadCookie, kbId } = await createKbAsLead(request);

    const before = await readDb();
    const beforeDoc = findKbDoc(before, kbId);
    expect(beforeDoc).toBeTruthy();

    const beforeSnap = docSnapshot(beforeDoc);
    const beforeAuditsForKb = findAuditsForKb(before, kbId).length;
    const beforeAuditGlobal = (before.audit ?? []).length;

    const res = await kbUpdate(
      request,
      leadCookie,
      { id: kbId, prompt: 'This update should fail due to AI output' },
      llmMockHeader('schema_invalid'),
    );

    expect(res.status()).toBe(400);
    expectJsonResponse(res);

    const json = await expectErrorJson(res);
    expect(json.error.toLowerCase()).toMatch(/ai|llm|schema|invalid|validation/i);

    const after = await readDb();
    const afterDoc = findKbDoc(after, kbId);
    expect(afterDoc).toBeTruthy();

    const afterSnap = docSnapshot(afterDoc);

    // ✅ Must NOT overwrite ANYTHING (title/text/tags/updatedAt)
    expect(afterSnap).toEqual(beforeSnap);

    // ✅ No new audit for this kbId
    const afterAuditsForKb = findAuditsForKb(after, kbId).length;
    expect(afterAuditsForKb).toBe(beforeAuditsForKb);

    // ✅ Also no global audit add (if no racing)
    expect((after.audit ?? []).length).toBe(beforeAuditGlobal);
  });

  test('EP05-US02-TC06 — audit update', async ({ request }) => {
    annotate('EP05-US02-TC06', 'EP05-US02');

    const { leadCookie, kbId } = await createKbAsLead(request);

    const before = await readDb();
    const beforeDoc = findKbDoc(before, kbId);
    expect(beforeDoc).toBeTruthy();
    const beforeSnap = docSnapshot(beforeDoc);

    const beforeAudits = findAuditsForKb(before, kbId);

    const marker = uniqueMarker('KB_AUDIT_UPDATE');

    const res = await kbUpdate(request, leadCookie, {
      id: kbId,
      prompt: `Update to verify audit trail works. ${marker}`,
    });

    expect(res.status()).toBe(200);
    expectJsonResponse(res);

    const json = await res.json();
    expect(json).toMatchObject({ success: true, id: kbId });

    const after = await readDb();
    const afterDoc = findKbDoc(after, kbId);
    expect(afterDoc).toBeTruthy();

    const afterSnap = docSnapshot(afterDoc);
    expect(afterSnap.text).not.toBe(beforeSnap.text);
    expect(afterSnap.text.toLowerCase()).toContain(marker.toLowerCase());

    const afterAudits = findAuditsForKb(after, kbId);

    // If you are in serial mode, this should be exactly +1.
    // If not, keep it >=.
    expect(afterAudits.length).toBeGreaterThan(beforeAudits.length);

    const newest = afterAudits[afterAudits.length - 1];
    expect(getAuditChangeType(newest)).toMatch(/UPDATE/i);
    expect(getAuditActor(newest)).toBeTruthy();

    const beforeJson = getAuditBeforeJson(newest);
    const afterJson = getAuditAfterJson(newest);

    expect(beforeJson).toMatch(new RegExp(kbId));
    expect(afterJson).toMatch(new RegExp(kbId));

    // Must represent before/after
    expect(beforeJson).toMatch(/"id"|id/i);
    expect(afterJson).toMatch(/"id"|id/i);

    // Should contain some evidence of content transition
    expect(beforeJson).toMatch(beforeSnap.text.slice(0, Math.min(20, beforeSnap.text.length)));
    expect(afterJson.toLowerCase()).toContain(marker.toLowerCase());
  });

  test.skip('EP05-US02-TC07 — atomicity on update', async ({ request }) => {
    annotate('EP05-US02-TC07', 'EP05-US02');

    // Same story as US01-TC10: needs audit failure hook + atomic semantics.
    test.fail(
      true,
      'Requires audit failure hook (e.g. x-mock-audit: throw) + atomic write semantics',
    );

    const { leadCookie, kbId } = await createKbAsLead(request);

    const before = await readDb();
    const beforeDoc = findKbDoc(before, kbId);
    expect(beforeDoc).toBeTruthy();

    const beforeSnap = docSnapshot(beforeDoc);
    const beforeAuditLen = (before.audit ?? []).length;

    const res = await kbUpdate(
      request,
      leadCookie,
      { id: kbId, prompt: 'Attempt update but audit will fail' },
      { 'x-mock-audit': 'throw' },
    );

    expect(res.status()).toBe(500);

    const after = await readDb();
    const afterDoc = findKbDoc(after, kbId);
    expect(afterDoc).toBeTruthy();

    const afterSnap = docSnapshot(afterDoc);

    // ✅ Doc unchanged
    expect(afterSnap).toEqual(beforeSnap);

    // ✅ No new audit
    expect((after.audit ?? []).length).toBe(beforeAuditLen);
  });
});
