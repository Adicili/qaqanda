/**
 * EP01 — Project Foundation & Tooling
 * US02 — Linting & Formatting
 *
 * Covers:
 *  - EP01-US02-TC04 — Lint and Format scripts exist
 */

import { expect } from 'vitest';

import { us, tc } from '../support/tags';
import pkg from '../../package.json' assert { type: 'json' };

us('US02', 'Linting & Formatting', () => {
  tc('EP01-US02-TC04', 'Lint and Format scripts exist', () => {
    expect(pkg.scripts?.lint).toBe('eslint . --ext .ts,.tsx');
    expect(pkg.scripts?.format).toBe('prettier --write .');
  });
});
