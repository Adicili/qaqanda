import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

import { describe, it, expect } from 'vitest';

const execFileP = promisify(execFile);

// Prettier-handled extensions (skip junk like .gitattributes / .ico)
const EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.css',
  '.mjs',
  '.cjs',
  '.yml',
  '.yaml',
  '.html',
  '.svg',
]);

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'out',
  'build',
  'playwright-report',
  'test-results',
  'dist',
  'coverage',
]);

function walk(root: string): string[] {
  const out: string[] = [];
  const dive = (dir: string) => {
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const p = join(dir, name);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (!IGNORE_DIRS.has(name)) dive(p);
      } else {
        const ext = extname(p).toLowerCase();
        if (EXTS.has(ext)) out.push(p);
      }
    }
  };
  dive(root);
  return out;
}

async function trackedFilesOrFallback(): Promise<string[]> {
  // Prefer git if available
  try {
    const { stdout } = await execFileP('git', ['ls-files']);
    const files = stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((p) => EXTS.has(extname(p).toLowerCase()))
      .filter((p) => existsSync(p));
    if (files.length) return files;
  } catch {
    // ignore and fallback
  }
  // Fallback: crawl repo
  return walk(process.cwd());
}

async function run(cmd: string) {
  // Try bash (WSL/Git Bash); if not, use Windows cmd
  try {
    return await execFileP('bash', ['-lc', cmd]);
  } catch {
    const shell = process.env.COMSPEC || 'cmd';
    return await execFileP(shell, ['/d', '/s', '/c', cmd]);
  }
}

describe('US02-TC02: Prettier configured and enforces formatting', () => {
  it('prettier --check on tracked files is clean', async () => {
    const files = await trackedFilesOrFallback();
    expect(files.length).toBeGreaterThan(0);

    const quoted = files.map((f) => `"${f.replace(/\\/g, '/')}"`).join(' ');
    const cmd = `pnpm prettier --check ${quoted}`;

    try {
      const { stdout, stderr } = await run(cmd);
      // Exit 0 == clean. Prettier can be silent; that’s fine.
      const out = (stdout + stderr).toLowerCase();
      expect(out).not.toMatch(/\[error]|no parser could be inferred/i);
    } catch (err: any) {
      // Non-zero means violations or config issues — surface the output
      const out = ((err?.stdout || '') + (err?.stderr || '')).trim();
      throw new Error(out || 'prettier failed');
    }
  });
});
