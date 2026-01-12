// src/app/api/kb/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireLead } from '@/lib/roles';
import { getById, updateDoc } from '@/lib/db.kb';
import { updateKbEntryFromPrompt, isLlmOutputError } from '@/lib/llm';
import { insertKbAudit } from '@/lib/db.audit';
import { logLLMMetrics, logError } from '@/lib/logger';
import { ENV } from '@/lib/env';

const UpdateKbSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
  prompt: z.string().trim().min(1, 'prompt is required').max(10_000, 'prompt too long'),
});

function allowTestHooks(): boolean {
  return ENV.NODE_ENV === 'test';
}

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

  // ✅ Allow mock header only in tests
  const mockMode = allowTestHooks() ? req.headers.get('x-mock-llm') : null;

  try {
    const existing = await getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'KB doc not found' }, { status: 404 });
    }

    const updated = await updateKbEntryFromPrompt(
      {
        id: existing.id,
        title: existing.title,
        text: existing.text,
        tags: existing.tags ?? [],
      },
      prompt,
      { mockMode },
    );

    // ✅ Metrics logging (no prompt/raw output)
    logLLMMetrics({
      route: '/api/kb/update',
      model: updated._meta.model,
      latency_ms: updated._meta.latency_ms,
      success: true,
      total_tokens: updated._meta.total_tokens,
    });

    await updateDoc(id, {
      title: updated.title,
      text: updated.text,
      tags: updated.tags,
    });

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

      // ✅ EP09-US03 audit fields
      llmModel: updated._meta.model,
      llmLatencyMs: updated._meta.latency_ms,
      llmTotalTokens: updated._meta.total_tokens,
    });

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (err: any) {
    if (isLlmOutputError(err)) {
      logLLMMetrics({
        route: '/api/kb/update',
        model: null,
        latency_ms: 0,
        success: false,
        total_tokens: null,
        error: err instanceof Error ? err.message : String(err),
      });

      return NextResponse.json({ error: 'Invalid AI output' }, { status: 400 });
    }

    logError('KB update failed', { error: err?.message ?? String(err) });
    return NextResponse.json({ error: 'KB update failed' }, { status: 500 });
  }
}
