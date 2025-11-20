// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/session';
import { ENV } from '@/lib/env';
import { dbUsers } from '@/lib/db.users';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid login data', details: result.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password } = result.data;

  const user = await dbUsers.getUserByEmail(email);

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const sessionToken = createSessionToken({
    userId: user.id,
    role: user.role,
  });

  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: ENV.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
