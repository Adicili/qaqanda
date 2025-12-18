import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { rankDocuments } from '@/lib/retrieval';
import { listAll as listAllKbDocs } from '@/lib/db.kb';
import { logQuery } from '@/lib/logger';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

const AskSchema = z.object({
  question: z.string().trim().min(1, 'Question is required'),
});

export async function POST(req: NextRequest) {
  // ✅ Auth from session cookie (real system)
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

  try {
    const docs = await listAllKbDocs();
    const ranked = rankDocuments(question, docs, 5);

    const topText = ranked[0]?.text ?? '';
    const answer =
      topText.length > 0
        ? topText.length > 300
          ? `${topText.slice(0, 300)}...`
          : topText
        : 'No relevant knowledge base entries found.';

    const latency_ms = Date.now() - startedAt;

    await logQuery(session.userId, question, latency_ms);

    return NextResponse.json(
      {
        answer,
        context: ranked.map((r) => ({
          id: r.id,
          title: r.title,
          text: r.text,
          score: r.score,
        })),
        latency_ms,
      },
      { status: 200 },
    );
  } catch {
    const latency_ms = Date.now() - startedAt;

    try {
      await logQuery(session.userId, question, latency_ms);
    } catch {}

    return NextResponse.json({ error: 'Ask failed' }, { status: 500 });
  }
}
