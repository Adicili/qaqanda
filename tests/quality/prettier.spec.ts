import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

async function trackedFilesForPrettier(): Promise<string[]> {
  const { stdout } = await $(`git ls-files`);
  return (
    stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      // don’t check lockfile or the QA bad file
      .filter((p) => p !== 'pnpm-lock.yaml' && !p.endsWith('__qa_bad__.tsx'))
  );
}

describe('US02-TC02: Prettier configured and enforces formatting', () => {
  it('prettier --check on tracked files is clean', async () => {
    const files = await trackedFilesForPrettier();
    const cmd = `pnpm prettier --check ${files.map((f) => `"${f}"`).join(' ')}`;
    const { stdout } = await $(cmd, { env: process.env });
    expect(stdout).toMatch(/All matched files use Prettier code style!/);
  });
});
