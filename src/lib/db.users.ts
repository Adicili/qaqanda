// src/lib/db.users.ts
import crypto from 'crypto';

import { ENV } from '@/lib/env';
import { executeQuery } from '@/lib/databricksClient';
import { readLocalDb, updateLocalDb } from '@/lib/localdb';

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

async function updateRoleByEmailDatabricks(email: string, role: UserRole): Promise<boolean> {
  await executeQuery(
    `
      UPDATE ${SCHEMA}.users
      SET role = :role
      WHERE email = :email
    `,
    { email, role },
  );

  const after = await getUserByEmailDatabricks(email);
  return after?.role === role;
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

/**
 * -------------------------
 * File-based local storage
 * -------------------------
 */

type LocalUserRow = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string; // ISO
};

function toDbUser(row: LocalUserRow): DbUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    createdAt: new Date(row.createdAt),
  };
}

async function getUserByEmailLocal(email: string): Promise<DbUser | null> {
  const db = await readLocalDb();
  const target = email.toLowerCase().trim();

  const found = (db.users as unknown as LocalUserRow[]).find(
    (u) => (u.email ?? '').toLowerCase().trim() === target,
  );

  return found ? toDbUser(found) : null;
}

async function createUserLocal(input: {
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<DbUser> {
  const email = input.email.trim();

  const created = await updateLocalDb<LocalUserRow>((db) => {
    const users = db.users as unknown as LocalUserRow[];
    const target = email.toLowerCase();

    const exists = users.find((u) => (u.email ?? '').toLowerCase() === target);
    if (exists) {
      throw new Error(`User already exists for email: ${email}`);
    }

    const row: LocalUserRow = {
      id: crypto.randomUUID(),
      email,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: new Date().toISOString(),
    };

    users.push(row);
    return row;
  });

  return toDbUser(created);
}

async function updateRoleByEmailLocal(email: string, role: UserRole): Promise<boolean> {
  const target = email.toLowerCase().trim();

  return updateLocalDb<boolean>((db) => {
    const users = db.users as unknown as LocalUserRow[];
    const idx = users.findIndex((u) => (u.email ?? '').toLowerCase().trim() === target);
    if (idx === -1) return false;

    users[idx] = { ...users[idx], role };
    return true;
  });
}

async function listAllLocal(): Promise<DbUser[]> {
  const db = await readLocalDb();
  const users = (db.users as unknown as LocalUserRow[]).slice();

  users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return users.map(toDbUser);
}

/**
 * -------------------------
 * Public API
 * -------------------------
 */

async function getUserByEmail(email: string): Promise<DbUser | null> {
  if (useDatabricks) return getUserByEmailDatabricks(email);
  return getUserByEmailLocal(email);
}

async function create(input: {
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<DbUser> {
  if (useDatabricks) return createUserDatabricks(input);
  return createUserLocal(input);
}

async function updateRoleByEmail(email: string, role: UserRole): Promise<boolean> {
  if (useDatabricks) return updateRoleByEmailDatabricks(email, role);
  return updateRoleByEmailLocal(email, role);
}

async function listAll(): Promise<DbUser[]> {
  if (useDatabricks) return listAllDatabricks();
  return listAllLocal();
}

export const dbUsers = {
  getUserByEmail,
  create,
  updateRoleByEmail,
  listAll,
};

export { getUserByEmail, create, updateRoleByEmail, listAll };
