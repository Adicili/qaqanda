// src/app/api/kb/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireLead } from '@/lib/roles';
import { addDoc } from '@/lib/db.kb';
import { generateKbEntryFromPrompt } from '@/lib/llm';
import { insertKbAudit } from '@/lib/db.audit';

const AddKbSchema = z.object({
  prompt: z.string().trim().min(1, 'prompt is required').max(10_000, 'prompt too long'),
});

export async function POST(req: NextRequest) {
  // RBAC: Lead-only (API-level, ne UI)
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

  try {
    // 1) LLM -> strict schema validation happens inside lib/llm.ts (KbEntrySchema.parse)
    const kbEntry = await generateKbEntryFromPrompt(prompt);

    // 2) Persist doc
    const kbId = await addDoc(kbEntry.title, kbEntry.text, kbEntry.tags);

    // 3) Audit
    // NOTE: ako nemaš tabelu kb_audit još uvek, ovo će failovati — to je očekivano dok ne dodaš migraciju.
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

    return NextResponse.json({ id: kbId }, { status: 200 });
  } catch {
    // Ne leakuj detalje (LLM dump / DB token / stack)
    return NextResponse.json({ error: 'KB add failed' }, { status: 500 });
  }
}
