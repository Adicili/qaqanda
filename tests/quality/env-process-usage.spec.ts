/**
 * EP01 — Project Foundation & Tooling
 * US03 — Environment Variable Validation
 *
 * Covers:
 *  - EP01-US03-TC03 — No direct `process.env` usage outside lib/env.ts
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

import { expect } from 'vitest';

import { us, tc } from '../support/tags';

const ROOTS = ['src', 'lib', 'app', 'schemas']; // source roots to police
const TOP_LEVEL_FILES = ['next.config.ts']; // optionally add more if you want

const ALLOWED_FILE = join('lib', 'env.ts');
const ALLOWED_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function walk(dir: string, acc: string[] = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      // ignore folders we don’t want to police
      if (
        /(^|[/\\])(tests?|__tests__|e2e|playwright|\.next|node_modules|out|build)([/\\]|$)/i.test(p)
      ) {
        continue;
      }
      walk(p, acc);
    } else {
      const ext = extname(p).toLowerCase();
      if (ALLOWED_EXTS.has(ext)) acc.push(p);
    }
  }
  return acc;
}

us('US03', 'Environment Variable Validation', () => {
  tc('EP01-US03-TC03', 'No direct process.env usage outside lib/env.ts', () => {
    const files: string[] = [];

    // add all source roots
    for (const r of ROOTS) files.push(...walk(r));

    // add selected top-level files if present
    for (const f of TOP_LEVEL_FILES) if (existsSync(f)) files.push(f);

    // sanity check so we don't get a false green
    expect(files.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    const needle = /process\.env\./;

    for (const file of files) {
      if (file.replace(/\\/g, '/') === ALLOWED_FILE) continue; // only env loader allowed
      const txt = readFileSync(file, 'utf8');
      if (needle.test(txt)) offenders.push(file);
    }

    if (offenders.length) {
      console.error('Forbidden process.env usages (outside lib/env.ts):\n' + offenders.join('\n'));
    }
    expect(offenders.length).toBe(0);
  });
});
