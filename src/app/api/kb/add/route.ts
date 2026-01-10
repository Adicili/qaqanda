// src/app/api/kb/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireLead } from '@/lib/roles';
import { addDoc } from '@/lib/db.kb';
import { generateKbEntryFromPrompt, isLlmOutputError } from '@/lib/llm';
import { insertKbAudit } from '@/lib/db.audit';

const AddKbSchema = z.object({
  prompt: z.string().trim().min(1, 'prompt is required').max(10_000, 'prompt too long'),
});

export async function POST(req: NextRequest) {
  const auth = await requireLead();
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = AddKbSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { prompt } = parsed.data;

  // ✅ Pass mock mode from tests via header
  const mockMode = req.headers.get('x-mock-llm');

  try {
    const kbEntry = await generateKbEntryFromPrompt(prompt, { mockMode });

    const kbId = await addDoc(kbEntry.title, kbEntry.text, kbEntry.tags);

    await insertKbAudit({
      actorUserId: auth.userId,
      changeType: 'CREATE',
      kbId,
      beforeJson: null,
      afterJson: JSON.stringify({
        id: kbId,
        title: kbEntry.title,
        text: kbEntry.text,
        tags: kbEntry.tags,
      }),
    });

    return NextResponse.json({ success: true, id: kbId }, { status: 200 });
  } catch (err) {
    // ✅ LLM/mock output problems are client-visible (400)
    if (isLlmOutputError(err)) {
      return NextResponse.json({ error: 'Invalid AI output' }, { status: 400 });
    }

    console.error('KB add failed:', err);
    return NextResponse.json({ error: 'KB add failed' }, { status: 500 });
  }
}
