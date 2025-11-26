import { executeQuery } from '@/lib/databricksClient';

export async function getUserByEmail(email: string) {
  const rows = await executeQuery(
    `SELECT id, email, password_hash, role FROM users WHERE email = :email`,
    { email },
  );
  return rows[0] || null;
}

export async function createUser(user: {
  id: string;
  email: string;
  passwordHash: string;
  role: 'ENGINEER' | 'LEAD';
}) {
  await executeQuery(
    `
    INSERT INTO users(id, email, password_hash, role, created_at)
    VALUES(:id, :email, :passwordHash, :role, current_timestamp())
    `,
    user,
  );
}
