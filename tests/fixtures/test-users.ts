// tests/fixtures/test-users.ts

export type TestUserRole = 'ENGINEER' | 'LEAD';

export type TestUser = {
  email: string;
  password: string;
  role: TestUserRole;
};

/**
 * Centralized test users (single source of truth).
 * Override via ENV in CI if needed.
 */
export const TEST_USERS: Record<TestUserRole, TestUser> = {
  ENGINEER: {
    email: process.env.QA_ENGINEER_EMAIL ?? 'engineer@example.com',
    password: process.env.QA_ENGINEER_PASSWORD ?? 'Passw0rd!',
    role: 'ENGINEER',
  },
  LEAD: {
    email: process.env.QA_LEAD_EMAIL ?? 'lead@example.com',
    password: process.env.QA_LEAD_PASSWORD ?? 'Passw0rd!',
    role: 'LEAD',
  },
};
