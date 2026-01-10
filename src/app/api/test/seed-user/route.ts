// src/app/api/test/seed-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { dbUsers, type UserRole } from '@/lib/db.users';
import { ENV } from '@/lib/env';

const isProd = ENV.NODE_ENV === 'production';
const BCRYPT_SALT_ROUNDS = isProd ? 12 : 4;

export async function POST(request: NextRequest) {
  if (isProd) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '').trim();
  const role = String(body.role ?? '').trim() as UserRole;

  if (!email || !password || (role !== 'ENGINEER' && role !== 'LEAD')) {
    return NextResponse.json({ error: 'Invalid seed payload' }, { status: 400 });
  }

  const existing = await dbUsers.getUserByEmail(email);

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await dbUsers.create({ email, passwordHash, role });
    return NextResponse.json({ success: true, created: true }, { status: 200 });
  }

  if (existing.role !== role) {
    await dbUsers.updateRoleByEmail(email, role);
    return NextResponse.json({ success: true, created: false, updatedRole: true }, { status: 200 });
  }

  return NextResponse.json({ success: true, created: false, updatedRole: false }, { status: 200 });
}
