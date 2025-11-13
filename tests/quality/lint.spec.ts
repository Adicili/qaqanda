import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

async function listTsFiles(): Promise<string[]> {
  const { stdout } = await $(`git ls-files`);
  return stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && /\.(ts|tsx)$/i.test(s));
}

describe('US02-TC01: ESLint configured and passes cleanly', () => {
  it('eslint exits with code 0 on real TS/TSX files', async () => {
    const files = await listTsFiles();
    if (files.length === 0) {
      throw new Error('No tracked TS/TSX files found — your repo layout is broken.');
    }
    // Quote file paths for Windows, pass explicit files (no --ext needed).
    const cmd = `pnpm eslint ${files.map((f) => `"${f}"`).join(' ')} --no-cache`;
    const { stdout, stderr } = await $(cmd, { env: process.env });
    expect(stdout + stderr).toMatch(/eslint/i);
  });
});
