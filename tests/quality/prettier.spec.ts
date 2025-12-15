import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { expect, it, describe } from 'vitest';

const execFileP = promisify(execFile);

// Helper to run a shell command in a cross-platform way
async function run(cmd: string, args: string[] = []) {
  return execFileP(cmd, args, { shell: true });
}

describe('EP01-US02 - Linting & Formatting', () => {
  /**
   * @testcase EP01-US02-TC02
   * @doc docs/testing/EP01_Test_Cases.md
   *
   * Covers:
   * - Prettier configuration correctness
   * - Enforced formatting across the codebase
   *
   * Implementation note:
   * We deliberately reuse the official script "pnpm format:check"
   * instead of re-implementing file discovery logic here.
   * If this script fails, CI will fail and this test will surface
   * Prettier output to help debugging.
   */
  it('EP01-US02-TC02 - Prettier configured and enforces formatting', async () => {
    try {
      const { stdout, stderr } = await run('pnpm', ['format:check']);
      const out = (stdout + stderr).toLowerCase();

      // Sanity check: no obvious parser/config errors in the output
      expect(out).not.toMatch(/\[error]|no parser could be inferred/i);
    } catch (err: any) {
      const out = ((err?.stdout || '') + (err?.stderr || '')).trim();
      // Surface Prettier / pnpm output if available, otherwise generic message
      throw new Error(out || 'prettier failed');
    }
  });
});
