// src/app/api/kb/audit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireLead } from '@/lib/roles';
import { listKbAuditByKbId } from '@/lib/db.audit';

const QuerySchema = z.object({
  kbId: z.string().trim().min(1, 'kbId is required'),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

function toNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toNullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v);
  return s.trim() ? s : null;
}

export async function GET(req: NextRequest) {
  const auth = await requireLead();
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    kbId: url.searchParams.get('kbId'),
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { kbId, limit } = parsed.data;
  const rows = await listKbAuditByKbId(kbId, limit ?? 50);

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      actorUserId: r.actorUserId,
      changeType: r.changeType,
      kbId: r.kbId,
      beforeJson: r.beforeJson,
      afterJson: r.afterJson,
      createdAt: r.createdAt,

      // ✅ normalize types to be stable for API + tests
      llmModel: toNullableString((r as any).llmModel),
      llmLatencyMs: toNullableNumber((r as any).llmLatencyMs),
      llmTotalTokens: toNullableNumber((r as any).llmTotalTokens),
    })),
    { status: 200 },
  );
}
