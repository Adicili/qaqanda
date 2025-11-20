import { exec, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

import { expect, beforeEach, afterEach } from 'vitest';

import { us, tc } from '../support/tags-vi';

const $ = promisify(exec);

// choose a real source dir that Husky/ESLint will lint
const SRC_DIR = existsSync('src/app') ? 'src/app' : existsSync('app') ? 'app' : null;
if (!SRC_DIR) {
  throw new Error('No app directory found (src/app or app). Create one so hooks can lint it.');
}
const BAD_FILE = join(SRC_DIR, '__qa_bad__.tsx');

function safeGit(cmd: string) {
  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch {
    /* ignore */
  }
}

beforeEach(() => {
  mkdirSync(dirname(BAD_FILE), { recursive: true });
  safeGit(`git config user.email "qa@example.com"`);
  safeGit(`git config user.name "QA Bot"`);
  // ensure we start from a clean index each test
  safeGit(`git reset -- ${BAD_FILE}`);
});

afterEach(() => {
  // hard revert this file only, never the whole repo
  safeGit(`git restore --staged --worktree -- ${BAD_FILE}`);
  safeGit(`git checkout -- ${BAD_FILE}`);

  rmSync(BAD_FILE, { force: true });
});

us('EP01-US02', 'Linting & Formatting', () => {
  /**
   * @testcase EP01-US02-TC03
   * @doc docs/testing/EP01_Test_Cases.md
   *
   * Covers:
   * - Husky pre-commit hook behavior
   * - lint-staged rejection of improperly formatted code
   * - Prevents broken/dirty changes from entering git history
   */
  tc(
    'EP01-US02-TC03',
    '[neg] commit with violations MUST fail due to husky/lint-staged',
    async () => {
      // Unused import + forbidden console.log to trip your rules
      writeFileSync(
        BAD_FILE,
        `import React from 'react';\nconsole.log('trash')\nexport default function Bad(){ return null }\n`,
        'utf8',
      );

      await $(`git add -f "${BAD_FILE}"`);
      let failed = false;
      try {
        await $(`git commit -m "test: provoke lint fail"`, { env: { ...process.env, HUSKY: '1' } });
      } catch (e: any) {
        failed = true;
        const out = (e.stdout || '') + (e.stderr || '');
        // prove ESLint actually blocked it
        expect(out).toMatch(/ESLint|no-console|no-unused-vars/i);
      }
      expect(failed).toBe(true);
    },
  );
});
