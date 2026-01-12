// src/app/api/kb/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireLead } from '@/lib/roles';
import { addDoc } from '@/lib/db.kb';
import { generateKbEntryFromPrompt, isLlmOutputError } from '@/lib/llm';
import { insertKbAudit } from '@/lib/db.audit';
import { logLLMMetrics, logError } from '@/lib/logger';
import { ENV } from '@/lib/env';

const AddKbSchema = z.object({
  prompt: z.string().trim().min(1, 'prompt is required').max(10_000, 'prompt too long'),
});

function allowTestHooks(): boolean {
  return ENV.NODE_ENV === 'test';
}

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

  // ✅ Allow mock header only in tests
  const mockMode = allowTestHooks() ? req.headers.get('x-mock-llm') : null;

  try {
    const kbEntry = await generateKbEntryFromPrompt(prompt, { mockMode });

    // ✅ Metrics logging (no prompt/raw output)
    logLLMMetrics({
      route: '/api/kb/add',
      model: kbEntry._meta.model,
      latency_ms: kbEntry._meta.latency_ms,
      success: true,
      total_tokens: kbEntry._meta.total_tokens,
    });

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

      // ✅ EP09-US03 audit fields
      llmModel: kbEntry._meta.model,
      llmLatencyMs: kbEntry._meta.latency_ms,
      llmTotalTokens: kbEntry._meta.total_tokens,
    });

    return NextResponse.json({ success: true, id: kbId }, { status: 200 });
  } catch (err: any) {
    // ✅ LLM/mock output problems are client-visible (400)
    if (isLlmOutputError(err)) {
      logLLMMetrics({
        route: '/api/kb/add',
        model: null,
        latency_ms: 0,
        success: false,
        total_tokens: null,
        error: String(err), // or sanitize, see below
      });

      return NextResponse.json({ error: 'Invalid AI output' }, { status: 400 });
    }

    logError('KB add failed', { error: err?.message ?? String(err) });
    return NextResponse.json({ error: 'KB add failed' }, { status: 500 });
  }
}
