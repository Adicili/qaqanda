// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { ENV } from '@/lib/env';
import { rankDocuments } from '@/lib/retrieval';
import { listAll as listAllKbDocs } from '@/lib/db.kb';
import { logQuery } from '@/lib/logger';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';
import { answerQuestionWithLLM, isLlmOutputError } from '@/lib/llm.ask';

const AskSchema = z.object({
  question: z.string().trim().min(1, 'Question is required'),
});

function safePreview(text: string, n = 300) {
  const t = String(text ?? '').trim();
  if (!t) return '';
  return t.length > n ? `${t.slice(0, n)}...` : t;
}

export async function POST(req: NextRequest) {
  // ✅ Auth from session cookie
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid ask payload', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { question } = parsed.data;
  const startedAt = Date.now();

  // ✅ test hooks
  const mockMode = req.headers.get('x-mock-llm'); // same contract as /kb
  const wantSpy = req.headers.get('x-test-spy-llm') === '1';

  // ✅ feature gate for EP09-US02
  // - default: ENV.ASK_USE_LLM (false in tests unless you turn it on)
  // - override: header x-use-llm: 1
  const forceLlm = req.headers.get('x-use-llm') === '1';
  const useLlm = Boolean(ENV.ASK_USE_LLM || forceLlm);

  try {
    const docs = await listAllKbDocs();
    const ranked = rankDocuments(question, docs, 3); // ✅ top 3 as per EP09

    const context = ranked.map((r) => ({
      id: r.id,
      title: r.title,
      text: r.text,
      score: r.score,
    }));

    // --- LLM path (feature-gated) ---
    if (useLlm) {
      try {
        const { answer, promptUsed } = await answerQuestionWithLLM(question, context, {
          mockMode,
        });

        const latency_ms = Date.now() - startedAt;
        await logQuery(session.userId, question, latency_ms);

        const res = NextResponse.json(
          { answer, context, latency_ms, used_llm: true },
          { status: 200 },
        );

        // ✅ spy prompt in header (base64)
        if (wantSpy) {
          const b64 = Buffer.from(promptUsed, 'utf8').toString('base64');
          res.headers.set('x-test-llm-prompt-b64', b64);
        }

        return res;
      } catch (err) {
        // ✅ fallback on ANY LLM failure
        if (!isLlmOutputError(err)) {
          console.error('[ASK LLM FAILOVER]', err);
        }
        // fall through to TF-IDF fallback
      }
    }

    // --- TF-IDF fallback (always available) ---
    const topText = ranked[0]?.text ?? '';
    const answer = topText ? safePreview(topText) : 'No relevant knowledge base entries found.';

    const latency_ms = Date.now() - startedAt;
    await logQuery(session.userId, question, latency_ms);

    return NextResponse.json({ answer, context, latency_ms, used_llm: false }, { status: 200 });
  } catch {
    const latency_ms = Date.now() - startedAt;
    try {
      await logQuery(session.userId, question, latency_ms);
    } catch {}

    return NextResponse.json({ error: 'Ask failed' }, { status: 500 });
  }
}
