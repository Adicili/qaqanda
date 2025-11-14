import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it } from 'vitest';

const $ = promisify(exec);

async function tsFiles(): Promise<string[]> {
  const { stdout } = await $(`git ls-files`);
  const files = stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && /\.(ts|tsx)$/i.test(s));
  if (files.length === 0) throw new Error('No tracked TS/TSX files found.');
  return files;
}

describe('US02-TC01: ESLint configured and passes cleanly', () => {
  it('eslint exits with code 0 on real TS/TSX files', async () => {
    const files = await tsFiles();
    const cmd = `pnpm eslint ${files.map((f) => `"${f}"`).join(' ')} --no-cache`;
    // If ESLint errors, exec throws and the test fails — that’s the assertion.
    await $(cmd, { env: process.env });
  });
});
