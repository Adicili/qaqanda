// tests/quality/lint.spec.ts
import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

/**
 * Collect tracked TS/TSX files only.
 * Uses -z to safely split on NUL, supports Windows paths.
 */
async function listTrackedTsFiles(): Promise<string[]> {
  try {
    const { stdout } = await $(`git ls-files -z -- '*.ts' '*.tsx'`, { env: process.env });
    return stdout
      .split('\0')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    // Fall back to common code locations if git is momentarily unavailable.
    return [
      'lib/env.ts',
      'next.config.ts',
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'vitest.config.ts',
    ];
  }
}

describe('US02-TC01: ESLint configured and passes cleanly', () => {
  it('eslint exits with code 0 on real TS/TSX files', async () => {
    const files = await listTrackedTsFiles();

    // Sanity: ensure we’re not calling eslint with nothing
    expect(files.length).toBeGreaterThan(0);

    // Quote paths to avoid spaces issues on Windows
    const quoted = files.map((f) => `"${f}"`).join(' ');
    const cmd = `pnpm eslint ${quoted} --ext .ts,.tsx --no-cache`;

    const { stdout, stderr } = await $(cmd, { env: process.env });
    // If ESLint errors occur, exec throws and this test fails.
    expect(stdout + stderr).toMatch(/eslint/i);
  });
});
