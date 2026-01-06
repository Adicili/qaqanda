// src/lib/db.users.ts
import crypto from 'crypto';

import { ENV } from '@/lib/env';
import { executeQuery } from '@/lib/databricksClient';

export type UserRole = 'ENGINEER' | 'LEAD';

export type DbUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
};

const SCHEMA = 'workspace.qaqanda';

const forceDatabricksMock = !!ENV.USE_DATABRICKS_MOCK;

const hasDatabricksEnv =
  !!ENV.DATABRICKS_HOST && !!ENV.DATABRICKS_TOKEN && !!ENV.DATABRICKS_WAREHOUSE_ID;

const useDatabricks = hasDatabricksEnv || forceDatabricksMock;

/**
 * -------------------------
 * Databricks-backed storage
 * -------------------------
 */

async function getUserByEmailDatabricks(email: string): Promise<DbUser | null> {
  const rows = await executeQuery<{
    id: string;
    email: string;
    password_hash: string;
    role: string;
    created_at: string;
  }>(
    `
      SELECT
        id,
        email,
        password_hash,
        role,
        created_at
      FROM ${SCHEMA}.users
      WHERE email = :email
      LIMIT 1
    `,
    { email },
  );

  if (!rows.length) return null;

  const row = rows[0];

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as UserRole,
    createdAt: new Date(row.created_at),
  };
}

async function createUserDatabricks(input: {
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<DbUser> {
  const id = crypto.randomUUID();

  await executeQuery(
    `
      INSERT INTO ${SCHEMA}.users (id, email, password_hash, role, created_at)
      VALUES (:id, :email, :passwordHash, :role, current_timestamp())
    `,
    {
      id,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
    },
  );

  const created = await getUserByEmailDatabricks(input.email);
  if (!created) {
    throw new Error('Failed to read back user after INSERT');
  }

  return created;
}

async function listAllDatabricks(): Promise<DbUser[]> {
  const rows = await executeQuery<{
    id: string;
    email: string;
    password_hash: string;
    role: string;
    created_at: string;
  }>(
    `
      SELECT
        id,
        email,
        password_hash,
        role,
        created_at
      FROM ${SCHEMA}.users
      ORDER BY created_at DESC
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as UserRole,
    createdAt: new Date(row.created_at),
  }));
}

async function updateRoleByEmailDatabricks(email: string, role: UserRole): Promise<void> {
  await executeQuery(
    `
      UPDATE ${SCHEMA}.users
      SET role = :role
      WHERE email = :email
    `,
    { email, role },
  );
}

/**
 * -------------------------
 * In-memory fallback storage
 * -------------------------
 */

const memoryUsers = new Map<string, DbUser>();
let memoryIdCounter = 1;

async function getUserByEmailMemory(email: string): Promise<DbUser | null> {
  const target = email.toLowerCase();

  for (const user of memoryUsers.values()) {
    if (user.email.toLowerCase() === target) {
      return user;
    }
  }

  return null;
}

async function createUserMemory(input: {
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<DbUser> {
  const user: DbUser = {
    id: String(memoryIdCounter++),
    email: input.email,
    passwordHash: input.passwordHash,
    role: input.role,
    createdAt: new Date(),
  };

  memoryUsers.set(user.id, user);
  return user;
}

async function listAllMemory(): Promise<DbUser[]> {
  return Array.from(memoryUsers.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

async function updateRoleByEmailMemory(email: string, role: UserRole): Promise<void> {
  const target = email.toLowerCase();

  for (const [id, user] of memoryUsers.entries()) {
    if (user.email.toLowerCase() === target) {
      memoryUsers.set(id, { ...user, role });
      return;
    }
  }
}

/**
 * -------------------------
 * Public API
 * -------------------------
 */

async function getUserByEmail(email: string): Promise<DbUser | null> {
  if (useDatabricks) {
    return getUserByEmailDatabricks(email);
  }
  return getUserByEmailMemory(email);
}

async function create(input: {
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<DbUser> {
  if (useDatabricks) {
    return createUserDatabricks(input);
  }
  return createUserMemory(input);
}

async function listAll(): Promise<DbUser[]> {
  if (useDatabricks) {
    return listAllDatabricks();
  }
  return listAllMemory();
}

async function updateRoleByEmail(email: string, role: UserRole): Promise<void> {
  if (useDatabricks) {
    return updateRoleByEmailDatabricks(email, role);
  }
  return updateRoleByEmailMemory(email, role);
}

export const dbUsers = {
  getUserByEmail,
  create,
  listAll,
  updateRoleByEmail,
};

export { getUserByEmail, create, listAll, updateRoleByEmail };
