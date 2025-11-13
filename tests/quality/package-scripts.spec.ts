import { describe, it, expect } from 'vitest';

import pkg from '../../package.json' assert { type: 'json' };

describe('US02-TC04: Lint and Format scripts exist', () => {
  it('package.json has lint script', () => {
    expect(pkg.scripts?.lint).toBe('eslint . --ext .ts,.tsx');
  });
  it('package.json has format script', () => {
    expect(pkg.scripts?.format).toBe('prettier --write .');
  });
});
