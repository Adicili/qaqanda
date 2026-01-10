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
    // This is a real server-ish failure
    throw new Error('Mock LLM threw');
  }

  if (mode === 'malformed') {
    // Treated as "AI output invalid" (400)
    throw new LlmOutputError('Mock LLM output malformed');
  }

  if (mode === 'code_fence') {
    // Treated as "AI output invalid" (400)
    throw new LlmOutputError('Mock LLM output code-fenced');
  }

  if (mode === 'schema_invalid') {
    // We don't throw here yet; we want Zod to fail consistently in parsing stage.
    return;
  }
}

function mockGenerate(prompt: string, mockMode?: MockLLMMode): unknown {
  // Header override first
  applyMockModeOverride(mockMode);

  if (mockMode === 'schema_invalid' || shouldReturnBadOutput()) {
    // namerno pogrešno (tags nije niz) -> schema mora da pukne
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
    return { title: 123, text: [], tags: ['ok'] }; // schema fail (wrong types)
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
      // If header override already marked it as invalid output, preserve it
      if (err instanceof LlmOutputError) throw err;

      // Zod schema failure = invalid AI output (400)
      throw new LlmOutputError('Mock LLM output failed schema validation');
    }
  }

  // EP09: real LLM call + parsing + schema validation
  throw new Error('LLM real mode not implemented (EP09)');
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

  throw new Error('LLM real mode not implemented (EP09)');
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
