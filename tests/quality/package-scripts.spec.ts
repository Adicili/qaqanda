import { expect, it, describe } from 'vitest';

import pkg from '../../package.json' assert { type: 'json' };

describe('EP01-US02 - Linting & Formatting', () => {
  /**
   * @testcase EP01-US02-TC04
   * @doc docs/testing/EP01_Test_Cases.md
   *
   * Covers:
   * - Presence of "lint" and "format" scripts in package.json
   * - Ensures project exposes mandatory code-quality tooling
   */
  it('EP01-US02-TC04 - Lint and Format scripts exist', () => {
    expect(pkg.scripts?.lint).toBe('eslint . --ext .ts,.tsx');
    expect(pkg.scripts?.format).toBe('prettier --write .');
  });
});
