// lib/llm.ts
import { KbEntrySchema, type KbEntry } from '@/schemas/kb.schema';
import { ENV } from '@/lib/env';

export type LlmMode = 'mock' | 'real';

export type ExistingKbDoc = {
  id: string;
  title: string;
  text: string;
  tags: string[];
};

export type MockLLMMode = 'malformed' | 'schema_invalid' | 'code_fence' | 'throw' | 'ok';

class LlmOutputError extends Error {
  name = 'LlmOutputError';
}

export function isLlmOutputError(err: unknown): boolean {
  return err instanceof LlmOutputError;
}

function normalizeMockMode(v: unknown): MockLLMMode | undefined {
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  if (s === 'malformed') return 'malformed';
  if (s === 'schema_invalid') return 'schema_invalid';
  if (s === 'code_fence') return 'code_fence';
  if (s === 'throw') return 'throw';
  if (s === 'ok') return 'ok';
  return undefined;
}

function getMode(): LlmMode {
  return ENV.LLM_MODE;
}

function shouldReturnBadOutput(): boolean {
  return ENV.MOCK_LLM_BAD;
}

/**
 * Header-driven mock overrides:
 * - malformed: simulate non-JSON / unparsable output
 * - schema_invalid: return wrong shape (Zod must fail)
 * - code_fence: simulate ```json ... ``` (reject)
 * - throw: simulate provider crash
 * - ok: normal mock
 */
function applyMockModeOverride(mode: MockLLMMode | undefined): void {
  if (!mode || mode === 'ok') return;

  if (mode === 'throw') {
    throw new Error('Mock LLM threw');
  }

  if (mode === 'malformed') {
    throw new LlmOutputError('Mock LLM output malformed');
  }

  if (mode === 'code_fence') {
    throw new LlmOutputError('Mock LLM output code-fenced');
  }

  if (mode === 'schema_invalid') {
    return;
  }
}

function mockGenerate(prompt: string, mockMode?: MockLLMMode): unknown {
  applyMockModeOverride(mockMode);

  if (mockMode === 'schema_invalid' || shouldReturnBadOutput()) {
    return { title: 'x', text: 'y', tags: 'not-an-array' };
  }

  const cleanPrompt = prompt.trim().slice(0, 2000);

  return {
    title: inferTitleFromPrompt(cleanPrompt),
    text: `KB entry generated from prompt:\n\n${cleanPrompt}\n\n---\n\n(Generated in mock mode)`,
    tags: inferTagsFromPrompt(cleanPrompt),
  };
}

function mockUpdate(existing: ExistingKbDoc, prompt: string, mockMode?: MockLLMMode): unknown {
  applyMockModeOverride(mockMode);

  if (mockMode === 'schema_invalid' || shouldReturnBadOutput()) {
    return { title: 123, text: [], tags: ['ok'] };
  }

  const cleanPrompt = prompt.trim().slice(0, 2000);

  return {
    title: existing.title,
    text:
      `${existing.text}\n\n---\n\n` +
      `Update instruction:\n${cleanPrompt}\n\n(Updated in mock mode)`,
    tags: dedupeTags(existing.tags.concat(inferTagsFromPrompt(cleanPrompt))),
  };
}

/**
 * Public API: Add flow
 */
export async function generateKbEntryFromPrompt(
  prompt: string,
  opts?: { mockMode?: string | null },
): Promise<KbEntry> {
  const p = prompt?.trim() ?? '';
  if (!p) {
    throw new Error('Prompt is required');
  }

  const mode = getMode();
  const mockMode = normalizeMockMode(opts?.mockMode);

  if (mode === 'mock') {
    try {
      return KbEntrySchema.parse(mockGenerate(p, mockMode));
    } catch (err) {
      if (err instanceof LlmOutputError) throw err;
      throw new LlmOutputError('Mock LLM output failed schema validation');
    }
  }

  // REAL MODE (EP09): OpenRouter call + strict JSON parse + Zod validation
  const startedAt = Date.now();
  try {
    const raw = await callOpenRouter({
      prompt: buildKbAddPrompt(p),
    });

    const parsed = strictJsonParse(raw);
    return KbEntrySchema.parse(parsed);
  } catch (err) {
    console.error('[LLM ERROR]', {
      provider: 'openrouter',
      model: ENV.OPENROUTER_MODEL,
      latency_ms: Date.now() - startedAt,
      error: err,
    });

    // Any JSON/schema issue must be treated as invalid AI output (400 upstream)
    if (err instanceof LlmOutputError) throw err;
    throw new LlmOutputError('LLM output invalid');
  }
}

/**
 * Public API: Update flow
 */
export async function updateKbEntryFromPrompt(
  existing: ExistingKbDoc,
  prompt: string,
  opts?: { mockMode?: string | null },
): Promise<KbEntry> {
  const p = prompt?.trim() ?? '';
  if (!p) throw new Error('Prompt is required');

  const mode = getMode();
  const mockMode = normalizeMockMode(opts?.mockMode);

  if (mode === 'mock') {
    try {
      return KbEntrySchema.parse(mockUpdate(existing, p, mockMode));
    } catch (err) {
      if (err instanceof LlmOutputError) throw err;
      throw new LlmOutputError('Mock LLM output failed schema validation');
    }
  }

  // REAL MODE (EP09): OpenRouter call + strict JSON parse + Zod validation
  const startedAt = Date.now();
  try {
    const raw = await callOpenRouter({
      prompt: buildKbUpdatePrompt(existing, p),
    });

    const parsed = strictJsonParse(raw);
    return KbEntrySchema.parse(parsed);
  } catch (err) {
    console.error('[LLM ERROR]', {
      provider: 'openrouter',
      model: ENV.OPENROUTER_MODEL,
      latency_ms: Date.now() - startedAt,
      error: err,
    });

    if (err instanceof LlmOutputError) throw err;
    throw new LlmOutputError('LLM output invalid');
  }
}

/* ----------------- OpenRouter REAL mode helpers ----------------- */

async function callOpenRouter(arg: { prompt: string }): Promise<string> {
  if (!ENV.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }
  if (!ENV.OPENROUTER_MODEL) {
    throw new Error('OPENROUTER_MODEL is missing');
  }

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
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: 'Return ONLY valid JSON. No markdown. No code fences. No extra text.',
        },
        { role: 'user', content: arg.prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter HTTP error ${res.status}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('LLM response missing content');
  }

  return content.trim();
}

function strictJsonParse(raw: string): unknown {
  const s = raw.trim();

  // Reject markdown/code fences explicitly. Don’t be “helpful”.
  if (s.startsWith('```') || s.includes('```')) {
    throw new LlmOutputError('LLM output code-fenced');
  }

  try {
    return JSON.parse(s);
  } catch {
    throw new LlmOutputError('LLM output malformed');
  }
}

function buildKbAddPrompt(userPrompt: string): string {
  return [
    'Create a KB entry from the prompt below.',
    'Output JSON with EXACT keys:',
    '{ "title": "string", "text": "string", "tags": ["string"] }',
    'Rules:',
    '- tags must be an array of lowercase kebab-case strings',
    '- no markdown, no code fences, JSON only',
    '',
    `PROMPT:\n${userPrompt}`,
  ].join('\n');
}

function buildKbUpdatePrompt(existing: ExistingKbDoc, instruction: string): string {
  return [
    'Update the KB entry based on the instruction below.',
    'Output JSON with EXACT keys:',
    '{ "title": "string", "text": "string", "tags": ["string"] }',
    'Rules:',
    '- Keep the title unless instruction explicitly changes it',
    '- tags must be an array of lowercase kebab-case strings',
    '- no markdown, no code fences, JSON only',
    '',
    'EXISTING ENTRY:',
    JSON.stringify(
      { id: existing.id, title: existing.title, text: existing.text, tags: existing.tags },
      null,
      2,
    ),
    '',
    `INSTRUCTION:\n${instruction}`,
  ].join('\n');
}

/* ----------------- helpers ----------------- */

function inferTitleFromPrompt(prompt: string): string {
  const lowered = prompt.toLowerCase();
  if (lowered.includes('playwright')) return 'Playwright';
  if (lowered.includes('retry')) return 'Retries';
  if (lowered.includes('auth') || lowered.includes('login')) return 'Authentication';
  if (lowered.includes('databricks')) return 'Databricks';
  if (lowered.includes('ci') || lowered.includes('github actions')) return 'CI Pipeline';
  return 'Knowledge Base Entry';
}

function inferTagsFromPrompt(prompt: string): string[] {
  const lowered = prompt.toLowerCase();
  const tags: string[] = [];

  if (lowered.includes('playwright')) tags.push('playwright');
  if (lowered.includes('api')) tags.push('api');
  if (lowered.includes('ui')) tags.push('ui');
  if (lowered.includes('retry')) tags.push('retries');
  if (lowered.includes('auth') || lowered.includes('login')) tags.push('auth');
  if (lowered.includes('databricks')) tags.push('databricks');
  if (lowered.includes('ci') || lowered.includes('github actions')) tags.push('ci');

  if (tags.length === 0) tags.push('kb');
  return dedupeTags(tags).slice(0, 10);
}

function dedupeTags(tags: string[]): string[] {
  const clean = tags
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((t) => t.replace(/\s+/g, '-'))
    .filter((t) => /^[a-z0-9-_]{1,32}$/.test(t));

  return Array.from(new Set(clean));
}
