// src/app/api/kb/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireLead } from '@/lib/roles';
import { getById, updateDoc } from '@/lib/db.kb';
import { updateKbEntryFromPrompt } from '@/lib/llm';
import { insertKbAudit } from '@/lib/db.audit';

const UpdateKbSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
  prompt: z.string().trim().min(1, 'prompt is required').max(10_000, 'prompt too long'),
});

export async function POST(req: NextRequest) {
  const auth = await requireLead();
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateKbSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id, prompt } = parsed.data;

  try {
    // 1) Fetch existing (BEFORE)
    const existing = await getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'KB doc not found' }, { status: 404 });
    }

    // 2) LLM update (strict schema validation happens inside lib/llm.ts)
    const updated = await updateKbEntryFromPrompt(
      {
        id: existing.id,
        title: existing.title,
        text: existing.text,
        tags: existing.tags ?? [],
      },
      prompt,
    );

    // 3) Persist update (MORA update title/text/tags)
    await updateDoc(id, {
      title: updated.title,
      text: updated.text,
      tags: updated.tags,
    });

    // 4) Audit (before/after)
    await insertKbAudit({
      actorUserId: auth.userId,
      changeType: 'UPDATE',
      kbId: id,
      beforeJson: JSON.stringify({
        id: existing.id,
        title: existing.title,
        text: existing.text,
        tags: existing.tags ?? [],
      }),
      afterJson: JSON.stringify({
        id,
        title: updated.title,
        text: updated.text,
        tags: updated.tags,
      }),
    });

    return NextResponse.json({ id }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'KB update failed' }, { status: 500 });
  }
}
