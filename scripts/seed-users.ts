// scripts/seed-users.ts
import 'dotenv/config';
import bcrypt from 'bcryptjs';

import { dbUsers } from '@/lib/db.users';

async function ensureUser(email: string, password: string, role: 'ENGINEER' | 'LEAD') {
  const existing = await dbUsers.getUserByEmail(email);

  if (existing) {
    console.warn(`User already exists: ${email} (role=${existing.role})`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await dbUsers.create({
    email,
    passwordHash,
    role,
  });

  console.warn(`Created user: ${email} (role=${role})`);
}

async function main() {
  try {
    // ENGINEER default user
    await ensureUser('engineer@example.com', 'Passw0rd!', 'ENGINEER');

    // LEAD user for RBAC tests / demo
    await ensureUser('lead@example.com', 'Passw0rd!', 'LEAD');

    console.warn('✅ Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed', err);
    process.exit(1);
  }
}

main();
