import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/roles';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ role: null }, { status: 200 });

  return NextResponse.json(
    {
      userId: user.userId,
      role: user?.role ?? null,
    },
    { status: 200 },
  );
}
