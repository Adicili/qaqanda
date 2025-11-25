// app/api/ask/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const session = verifySessionToken(raw);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 🔐 From this line forward, user is AUTHENTICATED
  return NextResponse.json(
    {
      answer: 'Stub ask response',
      userId: session.userId,
      role: session.role,
    },
    { status: 200 },
  );
}
