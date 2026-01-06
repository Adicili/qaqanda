// tests/support/admin-api.ts
import { expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const ADMIN_PROMOTE_ENDPOINT = `${BASE_URL}/api/admin/users/promote`;

export async function promoteUserRole(
  request: any,
  input: { email: string; role: 'ENGINEER' | 'LEAD' },
) {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    throw new Error('Missing ADMIN_SECRET. Put it into .env.local so Playwright can load it.');
  }

  const res = await request.post(ADMIN_PROMOTE_ENDPOINT, {
    headers: {
      'content-type': 'application/json',
      'x-admin-secret': adminSecret,
    },
    data: input,
  });

  expect(res.status(), 'admin promotion endpoint must return 200').toBe(200);

  const json = await res.json();
  expect(json).toHaveProperty('success', true);

  return json as { success: true; updated?: boolean; email?: string; role?: string };
}
