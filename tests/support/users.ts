// tests/support/users.ts
import { expect } from '@playwright/test';

import { ENV } from '@/lib/env';

const BASE_URL = ENV.BASE_URL ?? 'http://localhost:3000';

export async function ensureEngineerUser(request: any) {
  const email = 'engineer@example.com';
  const password = 'Passw0rd!';

  const r = await request.post(`${BASE_URL}/api/auth/register`, {
    data: { email, password, confirmPassword: password },
  });

  expect([200, 409]).toContain(r.status());
  return { email, password };
}

export async function getLeadCredentials() {
  return {
    email: 'lead@example.com',
    password: 'Passw0rd!',
  };
}
