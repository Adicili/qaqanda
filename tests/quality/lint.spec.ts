import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

describe('US02-TC01: ESLint configured and passes cleanly', () => {
  it('pnpm lint exits with code 0', async () => {
    const { stdout, stderr } = await $(`pnpm lint`, { env: process.env });
    // If ESLint errors occur, exec throws and this test fails.
    expect(stdout + stderr).toMatch(/eslint/i);
  });
});
