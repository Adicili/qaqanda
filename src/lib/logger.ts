// src/lib/logger.ts
import { insertQuery } from '@/lib/db.queries';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogPayload = Record<string, unknown>;

function emit(level: LogLevel, message: string, payload?: LogPayload) {
  const line = {
    level,
    message,
    ...payload,
    ts: new Date().toISOString(),
  };

  if (level === 'error') console.error(JSON.stringify(line));
  else if (level === 'warn') console.warn(JSON.stringify(line));
  else console.warn(JSON.stringify(line));
}

export function logInfo(message: string, payload?: LogPayload) {
  emit('info', message, payload);
}

export function logWarn(message: string, payload?: LogPayload) {
  emit('warn', message, payload);
}

export function logError(message: string, payload?: LogPayload) {
  emit('error', message, payload);
}

/**
 * DB query logging for /api/ask
 */
export async function logQuery(userId: string, question: string, latencyMs: number) {
  await insertQuery(userId, question, latencyMs);
}

/**
 * LLM metrics logging (canonical name)
 */
export function logLlmMetrics(params: {
  route: string;
  model: string | null;
  latency_ms: number;
  success: boolean;
  total_tokens: number | null;
  error?: string;
}) {
  emit('info', 'llm.metrics', params as unknown as LogPayload);
}

/**
 * Backwards-compat alias (your routes import this typo-cased name)
 */
export const logLLMMetrics = logLlmMetrics;
