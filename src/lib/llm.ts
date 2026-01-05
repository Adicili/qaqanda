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

function getMode(): LlmMode {
  return ENV.LLM_MODE;
}

function shouldReturnBadOutput(): boolean {
  return ENV.MOCK_LLM_BAD;
}

function mockGenerate(prompt: string): unknown {
  if (shouldReturnBadOutput()) {
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

function mockUpdate(existing: ExistingKbDoc, prompt: string): unknown {
  if (shouldReturnBadOutput()) {
    return { title: 123, text: [], tags: ['ok'] }; // schema fail (wrong types)
  }

  const cleanPrompt = prompt.trim().slice(0, 2000);

  return {
    // “Update” = zadrži ID u sistemu, ali promeni sadržaj kroz prompt
    title: existing.title, // ili inferTitleFromPrompt(cleanPrompt) ako hoćeš
    text:
      `${existing.text}\n\n---\n\n` +
      `Update instruction:\n${cleanPrompt}\n\n(Updated in mock mode)`,
    tags: dedupeTags(existing.tags.concat(inferTagsFromPrompt(cleanPrompt))),
  };
}

/**
 * Public API: Add flow
 */
export async function generateKbEntryFromPrompt(prompt: string): Promise<KbEntry> {
  const p = prompt?.trim() ?? '';
  if (!p) {
    // Ovo je backup guard. Primarna validacija treba da bude u route Zod-u.
    throw new Error('Prompt is required');
  }

  const mode = getMode();

  if (mode === 'mock') {
    return KbEntrySchema.parse(mockGenerate(p));
  }

  // EP09: ovde ide pravi LLM call + parsing + schema validation
  throw new Error('LLM real mode not implemented (EP09)');
}

/**
 * Public API: Update flow
 */
export async function updateKbEntryFromPrompt(
  existing: ExistingKbDoc,
  prompt: string,
): Promise<KbEntry> {
  const p = prompt?.trim() ?? '';
  if (!p) throw new Error('Prompt is required');

  const mode = getMode();

  if (mode === 'mock') {
    return KbEntrySchema.parse(mockUpdate(existing, p));
  }

  throw new Error('LLM real mode not implemented (EP09)');
}

/* ----------------- helpers ----------------- */

function inferTitleFromPrompt(prompt: string): string {
  // Stabilno, bez random-a. Ne pokušava NLP—poenta je determinističnost.
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
