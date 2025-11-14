import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

describe('US03 — Environment Variable Validation', () => {
  it('EP01-US03-TC02: App fails fast if required env vars are missing', async () => {
    // Run Next.js dev with env wiped
    let error: any;
    try {
      await $(`pnpm dev`, {
        env: { ...process.env, DATABRICKS_HOST: '', DATABRICKS_TOKEN: '', NODE_ENV: 'development' },
      });
    } catch (err) {
      error = err;
    }

    // Expect app to crash and show a Zod validation message
    expect(error).toBeDefined();
    expect(error.stderr || error.stdout).toMatch(/invalid|missing|ZodError/i);
  });
});
