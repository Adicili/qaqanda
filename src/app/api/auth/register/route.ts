import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { registerSchema } from '@/schemas/auth';
import { dbUsers } from '@/lib/db.users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};

      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || '_root';

        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }

        fieldErrors[path].push(issue.message);
      }

      return NextResponse.json(
        {
          errors: fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, password } = result.data;
    const existingUser = await dbUsers.getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        {
          errors: {
            email: ['Email already in use'],
          },
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await dbUsers.create({
      email,
      passwordHash,
      role: 'ENGINEER',
    });

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
