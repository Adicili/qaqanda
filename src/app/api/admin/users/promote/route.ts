// src/app/api/admin/users/promote/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { ENV } from '@/lib/env';
import { dbUsers, type UserRole } from '@/lib/db.users';

function requireAdminSecret(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret');
  const expected = ENV.ADMIN_SECRET;

  if (!expected) {
    // fail closed
    return NextResponse.json({ error: 'Admin secret not configured' }, { status: 500 });
  }

  if (!secret || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  // If you want this ONLY in non-prod, uncomment:
  // if (ENV.NODE_ENV === 'production') return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? '').trim();
  const role = String(body.role ?? '').trim() as UserRole;

  if (!email || (role !== 'ENGINEER' && role !== 'LEAD')) {
    return NextResponse.json(
      { error: 'Invalid payload. Expected: { email: string, role: "ENGINEER"|"LEAD" }' },
      { status: 400 },
    );
  }

  const user = await dbUsers.getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.role === role) {
    return NextResponse.json({ success: true, updated: false, email, role }, { status: 200 });
  }

  await dbUsers.updateRoleByEmail(email, role);

  return NextResponse.json({ success: true, updated: true, email, role }, { status: 200 });
}
