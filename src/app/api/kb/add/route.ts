// app/api/kb/add/route.ts
import { NextResponse } from 'next/server';

import { requireLead } from '@/lib/roles';

export async function POST(request: Request) {
  const result = await requireLead();

  if (result instanceof Response) {
    return result;
  }

  const { userId, role } = result;

  const body = await request.json().catch(() => ({}));
  const title = body?.title ?? 'Untitled';

  return NextResponse.json(
    {
      success: true,
      createdBy: userId,
      role,
      title,
    },
    { status: 200 },
  );
}
