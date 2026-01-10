// src/app/api/admin/users/promote/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { ENV } from '@/lib/env';
import { dbUsers, type UserRole } from '@/lib/db.users';

export async function POST(req: NextRequest) {
  // Never expose this in prod.
  if (ENV.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const adminSecret = ENV.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: 'ADMIN_SECRET is not configured' }, { status: 500 });
  }

  const headerSecret = req.headers.get('x-admin-secret') ?? '';
  if (headerSecret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim();
  const role = String(body.role ?? '').trim() as UserRole;

  if (!email || (role !== 'ENGINEER' && role !== 'LEAD')) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const existing = await dbUsers.getUserByEmail(email);
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await dbUsers.updateRoleByEmail(email, role);

  const after = await dbUsers.getUserByEmail(email);
  if (!after) {
    return NextResponse.json({ error: 'User disappeared after update' }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, updated: after.role === role, email, role: after.role },
    { status: 200 },
  );
}
