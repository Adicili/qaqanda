/**
 * EP01 — Project Foundation & Tooling
 * US02 — Linting & Formatting
 *
 * Covers:
 *  - EP01-US02-TC01 — ESLint configured and passes cleanly
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

import { expect } from 'vitest';

import { us, tc } from '../support/tags';

const execFileP = promisify(execFile);

function walkForTS(root: string): string[] {
  const out: string[] = [];
  const skip = new Set(['node_modules', '.git', '.next', 'out', 'build', 'dist', 'coverage']);
  const dive = (dir: string) => {
    let items: string[] = [];
    try {
      items = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of items) {
      const p = join(dir, name);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (!skip.has(name)) dive(p);
      } else {
        const ext = extname(p).toLowerCase();
        if (ext === '.ts' || ext === '.tsx') out.push(p);
      }
    }
  };
  dive(root);
  return out;
}

async function collectTsFiles(): Promise<string[]> {
  // Prefer git list if allowed
  try {
    const { stdout } = await execFileP('git', ['ls-files']);
    const files = stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'))
      .filter((p) => existsSync(p));
    if (files.length) return files;
  } catch {
    // ignore
  }

  // Fallback: crawl likely roots
  const crawled = [
    ...walkForTS('src'),
    ...walkForTS('lib'),
    ...walkForTS('schemas'),
    ...walkForTS('tests'),
  ];
  const extras = ['next.config.ts', 'vitest.config.ts', 'eslint.config.mjs'].filter(existsSync);
  return Array.from(new Set([...crawled, ...extras]));
}

async function run(cmd: string) {
  try {
    return await execFileP('bash', ['-lc', cmd]);
  } catch {
    const shell = process.env.COMSPEC || 'cmd';
    return await execFileP(shell, ['/d', '/s', '/c', cmd]);
  }
}

us('US02', 'Linting & Formatting', () => {
  tc('EP01-US02-TC01', 'ESLint configured and passes cleanly', async () => {
    const files = await collectTsFiles();
    expect(files.length).toBeGreaterThan(0);

    const quoted = files.map((f) => `"${f.replace(/\\/g, '/')}"`).join(' ');
    const cmd = `pnpm eslint ${quoted} --ext .ts,.tsx --no-cache`;

    try {
      const { stdout, stderr } = await run(cmd);
      // Clean runs can be silent; success is enough.
      const out = (stdout + stderr).toLowerCase();
      if (out.trim()) {
        // If there is output, sanity check it's eslint-ish (not required, just guardrails)
        expect(out).toMatch(/eslint|problems?|\d+:\d+/i);
      }
    } catch (err: any) {
      const out = ((err?.stdout || '') + (err?.stderr || '')).trim();
      throw new Error(out || 'eslint failed');
    }
  });
});
