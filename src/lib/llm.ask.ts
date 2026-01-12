// src/lib/llm.ask.ts
import { z } from 'zod';

import { ENV } from '@/lib/env';

export type AskLlmMode = 'mock' | 'real';
export type MockAskMode = 'ok' | 'malformed' | 'schema_invalid' | 'code_fence' | 'throw';

class LlmOutputError extends Error {
  name = 'LlmOutputError';
}
export function isLlmOutputError(err: unknown): boolean {
  return err instanceof LlmOutputError;
}

const AskAnswerSchema = z
  .object({
    answer: z.string().min(1),
  })
  .strict();

function strictJsonParse(raw: string): unknown {
  const s = raw.trim();
  if (s.startsWith('```') || s.includes('```')) throw new LlmOutputError('LLM output code-fenced');
  try {
    return JSON.parse(s);
  } catch {
    throw new LlmOutputError('LLM output malformed');
  }
}

function normalizeMockMode(v: unknown): MockAskMode | undefined {
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  if (s === 'ok') return 'ok';
  if (s === 'malformed') return 'malformed';
  if (s === 'schema_invalid') return 'schema_invalid';
  if (s === 'code_fence') return 'code_fence';
  if (s === 'throw') return 'throw';
  return undefined;
}

export function buildAskPrompt(
  question: string,
  ctx: { id: string; title: string; text: string }[],
) {
  const top3 = ctx.slice(0, 3);

  return [
    'You are answering based on KB context.',
    'Return ONLY JSON with EXACT keys:',
    '{ "answer": "string" }',
    'Rules:',
    '- No markdown',
    '- No code fences',
    '- JSON only',
    '',
    `QUESTION:\n${question}`,
    '',
    'CONTEXT (top 3 docs):',
    ...top3.map((d, i) =>
      [`--- DOC ${i + 1} ---`, `id: ${d.id}`, `title: ${d.title}`, `text: ${d.text}`].join('\n'),
    ),
  ].join('\n');
}

async function callOpenRouter(prompt: string): Promise<string> {
  if (!ENV.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is missing');
  if (!ENV.OPENROUTER_MODEL) throw new Error('OPENROUTER_MODEL is missing');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': ENV.APP_URL,
      'X-Title': 'QAQ&A',
    },
    body: JSON.stringify({
      model: ENV.OPENROUTER_MODEL,
      temperature: ENV.OPENROUTER_TEMPERATURE,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: 'Return ONLY valid JSON. No markdown. No code fences. No extra text.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter HTTP error ${res.status}`);

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim())
    throw new Error('LLM response missing content');
  return content.trim();
}

function mockAskAnswer(mockMode?: MockAskMode): string {
  if (mockMode === 'throw') throw new Error('Mock LLM threw');
  if (mockMode === 'malformed') return 'NOT JSON';
  if (mockMode === 'code_fence') return '```json\n{"answer":"nope"}\n```';
  if (mockMode === 'schema_invalid') return JSON.stringify({ nope: 123 });

  // ✅ determinističan “OK” odgovor
  return JSON.stringify({ answer: 'MOCK_OK_ANSWER' });
}

export async function answerQuestionWithLLM(
  question: string,
  ctx: { id: string; title: string; text: string }[],
  opts?: { mockMode?: string | null },
): Promise<{ answer: string; promptUsed: string }> {
  const mode: AskLlmMode = ENV.LLM_MODE;
  const mockMode = normalizeMockMode(opts?.mockMode);

  const prompt = buildAskPrompt(question, ctx);

  const startedAt = Date.now();
  try {
    const raw = mode === 'mock' ? mockAskAnswer(mockMode) : await callOpenRouter(prompt);
    const parsed = strictJsonParse(raw);
    const out = AskAnswerSchema.parse(parsed);
    return { answer: out.answer, promptUsed: prompt };
  } catch (err) {
    console.error('[LLM ASK ERROR]', {
      provider: 'openrouter',
      model: ENV.OPENROUTER_MODEL,
      latency_ms: Date.now() - startedAt,
      error: err,
    });

    if (err instanceof LlmOutputError) throw err;
    throw new LlmOutputError('LLM output invalid');
  }
}
