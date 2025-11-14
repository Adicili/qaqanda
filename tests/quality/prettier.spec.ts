import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

const ALLOWED_EXT = new Set([
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'md',
  'mdx',
  'css',
  'mjs',
  'cjs',
  'yml',
  'yaml',
  'html',
  // NOTE: we intentionally exclude svg, ico, sh, gitkeep, dotfiles, etc.
]);

function hasAllowedExt(path: string) {
  const m = path.toLowerCase().match(/\.([a-z0-9]+)$/i);
  return !!m && ALLOWED_EXT.has(m[1]);
}

async function trackedFilesForPrettier(): Promise<string[]> {
  const { stdout } = await $(`git ls-files`);
  return (
    stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter(hasAllowedExt)
      // don’t check lockfile or the QA bad file
      .filter((p) => p !== 'pnpm-lock.yaml' && !p.endsWith('__qa_bad__.tsx'))
  );
}

describe('US02-TC02: Prettier configured and enforces formatting', () => {
  it('prettier --check on tracked files is clean', async () => {
    const files = await trackedFilesForPrettier();
    if (files.length === 0) {
      throw new Error('No eligible files for Prettier. Check ALLOWED_EXT.');
    }
    const cmd = `pnpm prettier --check --ignore-unknown ${files.map((f) => `"${f}"`).join(' ')}`;
    const { stdout } = await $(cmd, { env: process.env });
    expect(stdout).toMatch(/All matched files use Prettier code style!/);
  });
});
