// src/app/api/kb/get/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireLead } from '@/lib/roles';
import { getById } from '@/lib/db.kb';

const QuerySchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
});

export async function GET(req: NextRequest) {
  const auth = await requireLead();
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ id: url.searchParams.get('id') });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const doc = await getById(parsed.data.id);
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      id: doc.id,
      title: doc.title,
      text: doc.text,
      tags: doc.tags ?? [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
    { status: 200 },
  );
}
