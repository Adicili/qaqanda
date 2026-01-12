import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { generateKbEntryFromPrompt, isLlmOutputError } from '@/lib/llm';
import { ENV } from '@/lib/env';

global.fetch = vi.fn();

const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;

describe('EP09-US01 — LLM client & config', () => {
  const originalMode = ENV.LLM_MODE;
  const originalModel = ENV.OPENROUTER_MODEL;
  const originalTemp = ENV.OPENROUTER_TEMPERATURE;
  const originalAppUrl = ENV.APP_URL;
  const originalKey = ENV.OPENROUTER_API_KEY;

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockFetch.mockReset();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();

    // restore ENV to avoid test pollution
    (ENV as any).LLM_MODE = originalMode;
    (ENV as any).OPENROUTER_MODEL = originalModel;
    (ENV as any).OPENROUTER_TEMPERATURE = originalTemp;
    (ENV as any).APP_URL = originalAppUrl;
    (ENV as any).OPENROUTER_API_KEY = originalKey;
  });

  it('EP09-US01-TC01 — valid JSON produces valid KbEntry', async () => {
    (ENV as any).LLM_MODE = 'real';
    (ENV as any).OPENROUTER_API_KEY = 'test-key';
    (ENV as any).OPENROUTER_MODEL = 'openai/gpt-4o-mini';
    (ENV as any).OPENROUTER_TEMPERATURE = 0.2;
    (ENV as any).APP_URL = 'http://localhost:3000';

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'QA Basics',
                text: 'Testing fundamentals',
                tags: ['qa', 'testing'],
              }),
            },
          },
        ],
      }),
    });

    const result = await generateKbEntryFromPrompt('Create KB entry about QA');

    expect(result.title).toBe('QA Basics');
    expect(result.text).toBe('Testing fundamentals');
    expect(result.tags).toEqual(['qa', 'testing']);
  });

  it('EP09-US01-TC02 — non-JSON output rejected', async () => {
    (ENV as any).LLM_MODE = 'real';
    (ENV as any).OPENROUTER_API_KEY = 'test-key';
    (ENV as any).OPENROUTER_MODEL = 'openai/gpt-4o-mini';
    (ENV as any).OPENROUTER_TEMPERATURE = 0.2;
    (ENV as any).APP_URL = 'http://localhost:3000';

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'this is not json',
            },
          },
        ],
      }),
    });

    await expect(generateKbEntryFromPrompt('Bad output')).rejects.toSatisfy(isLlmOutputError);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]?.[0]).toBe('[LLM ERROR]');
  });

  it('EP09-US01-TC03 — schema mismatch rejected', async () => {
    (ENV as any).LLM_MODE = 'real';
    (ENV as any).OPENROUTER_API_KEY = 'test-key';
    (ENV as any).OPENROUTER_MODEL = 'openai/gpt-4o-mini';
    (ENV as any).OPENROUTER_TEMPERATURE = 0.2;
    (ENV as any).APP_URL = 'http://localhost:3000';

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Only title present',
              }),
            },
          },
        ],
      }),
    });

    await expect(generateKbEntryFromPrompt('Wrong schema')).rejects.toSatisfy(isLlmOutputError);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]?.[0]).toBe('[LLM ERROR]');
  });

  it('EP09-US01-TC04 — openrouter env config applied', async () => {
    (ENV as any).LLM_MODE = 'real';
    (ENV as any).OPENROUTER_API_KEY = 'test-key';
    (ENV as any).OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet';
    (ENV as any).OPENROUTER_TEMPERATURE = 0.7;
    (ENV as any).APP_URL = 'https://example.test';

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'X',
                text: 'Y',
                tags: ['kb'],
              }),
            },
          },
        ],
      }),
    });

    await generateKbEntryFromPrompt('Config check');

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, any];

    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');

    const headers = init?.headers ?? {};
    expect(headers.Authorization).toMatch(/^Bearer /);
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['HTTP-Referer']).toBe('https://example.test');
    expect(headers['X-Title']).toBe('QAQ&A');

    const body = JSON.parse(init.body);
    expect(body.model).toBe('anthropic/claude-3.5-sonnet');
    expect(body.temperature).toBe(0.7);
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages[0]?.role).toBe('system');
    expect(String(body.messages[0]?.content)).toContain('JSON');
  });

  it('EP09-US01-TC05 — provider failure handled and logged', async () => {
    (ENV as any).LLM_MODE = 'real';
    (ENV as any).OPENROUTER_API_KEY = 'test-key';
    (ENV as any).OPENROUTER_MODEL = 'openai/gpt-4o-mini';
    (ENV as any).OPENROUTER_TEMPERATURE = 0.2;
    (ENV as any).APP_URL = 'http://localhost:3000';

    mockFetch.mockRejectedValue(new Error('Network down'));

    await expect(generateKbEntryFromPrompt('Network error')).rejects.toThrow('LLM output invalid');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]?.[0]).toBe('[LLM ERROR]');
  });
});
