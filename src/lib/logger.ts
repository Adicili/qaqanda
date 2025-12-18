import { insertQuery } from '@/lib/db.queries';

export async function logQuery(userId: string, question: string, latencyMs: number) {
  await insertQuery(userId, question, latencyMs);
}
