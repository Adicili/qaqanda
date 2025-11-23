// app/api/ask/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST(_request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    {
      answer: 'Stub ask response',
    },
    { status: 200 },
  );
}
