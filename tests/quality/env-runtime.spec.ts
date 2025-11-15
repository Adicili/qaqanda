// tests/quality/env-runtime.spec.ts
import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

describe('US03 — Environment Variable Validation', () => {
  it('EP01-US03-TC02: App fails fast if required env vars are missing', async () => {
    // Use a random port so we don’t collide with anything else
    const port = 3200 + Math.floor(Math.random() * 500);

    // Strip out any existing values we *don’t* want to leak into the test
    const {
      NODE_ENV: _NODE_ENV,
      DATABRICKS_HOST: _DBH,
      DATABRICKS_TOKEN: _DBT,
      OPENAI_API_KEY: _OPENAI,
      PORT: _PORT,
      BASE_URL: _BASE_URL,
      ...rest
    } = process.env;

    let error: any;

    try {
      // Run Next dev with a deliberately broken production env
      await $('pnpm dev', {
        env: {
          ...rest,
          NODE_ENV: 'production', // trigger "prod" behaviour
          PORT: String(port), // valid port
          BASE_URL: `http://localhost:${port}`, // valid URL so BASE_URL itself is fine

          // These are required in production by lib/env.ts, and we break them on purpose:
          DATABRICKS_HOST: '', // invalid / missing
          DATABRICKS_TOKEN: '', // invalid / missing

          // Optional, but we clear it anyway:
          OPENAI_API_KEY: '',
        },
        timeout: 10_000, // don’t hang forever — we expect a fast failure
      });
    } catch (e: any) {
      error = e;
    }

    // App MUST crash
    expect(error).toBeDefined();

    const output = String(error.stderr || error.stdout || '');

    // We accept any of these:
    // - Our own env-loader messages
    // - Zod wording
    // - In case Next wraps it, we still catch the text
    expect(output).toMatch(
      /Invalid environment variables|Missing required environment variables|ZodError/i,
    );
  });
});
