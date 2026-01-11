/* app/api/reports/summary/route.ts */

import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/roles';
import { readLocalDb } from '@/lib/localdb';

type QueryRow = {
  question?: string;
  latency_ms?: number;
};

type KbRow = {
  title: string;
  updated_at: string;
};

type LocalDbShape = {
  queries?: QueryRow[];
  kb?: KbRow[];
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user || !['ENGINEER', 'LEAD'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // FIX: readLocalDb returns Promise<LocalDb>
  const db = (await readLocalDb()) as unknown as LocalDbShape;

  const queries: QueryRow[] = db.queries ?? [];
  const kb: KbRow[] = db.kb ?? [];

  const totalQueries = queries.length;

  const avgLatencyMs =
    totalQueries === 0
      ? 0
      : Math.round(
          queries.reduce((sum: number, q: QueryRow) => {
            return sum + (q.latency_ms ?? 0);
          }, 0) / totalQueries,
        );

  const questionFrequency: Record<string, number> = {};
  for (const q of queries) {
    const question = q.question?.trim();
    if (!question) continue;
    questionFrequency[question] = (questionFrequency[question] ?? 0) + 1;
  }

  const topQuestions = Object.entries(questionFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([question]) => question);

  // Best-effort proxy until you actually log doc references from /api/ask:
  // pick 5 most recently updated KB docs by title
  const topDocs = [...kb]
    .filter((d) => d && typeof d.title === 'string' && typeof d.updated_at === 'string')
    .sort(
      (a: KbRow, b: KbRow) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 5)
    .map((doc: KbRow) => doc.title);

  return NextResponse.json({
    total_queries: totalQueries,
    avg_latency_ms: avgLatencyMs,
    top_questions: topQuestions,
    top_docs: topDocs,
  });
}
