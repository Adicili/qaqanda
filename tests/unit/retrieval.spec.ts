import { describe, it, expect } from 'vitest';

import { tokenize, rankDocuments, type KBEntry } from '@/lib/retrieval';

describe('EP04-US01 — TF-IDF Retrieval Service', () => {
  it('EP04-US01-TC01 — tokenize normalizes case and strips punctuation', () => {
    const text = 'Playwright, QA & Testing!!!';
    const tokens = tokenize(text, { stopwords: ['&'] });

    expect(tokens).toEqual(['playwright', 'qa', 'testing']);
  });

  it('EP04-US01-TC02 — optional stopword filtering works', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const without = tokenize(text);
    const withStop = tokenize(text, { stopwords: ['the', 'over'] });

    expect(without.length).toBeGreaterThan(withStop.length);
    expect(withStop).not.toContain('the');
    expect(withStop).not.toContain('over');
  });

  it('EP04-US01-TC03 — deterministic TF-IDF ranking for same corpus/query', () => {
    const docs: KBEntry[] = [
      {
        id: '1',
        title: 'Playwright basics',
        text: 'Playwright is a framework for end-to-end testing of web apps.',
      },
      {
        id: '2',
        title: 'Unit testing with Vitest',
        text: 'Vitest is used for unit tests and fast feedback loops.',
      },
      {
        id: '3',
        title: 'Advanced Playwright patterns',
        text: 'Page Object Model patterns for Playwright automation.',
      },
    ];

    const query = 'playwright testing patterns';

    const first = rankDocuments(query, docs, 3);
    const second = rankDocuments(query, docs, 3);

    expect(first).toHaveLength(3);
    expect(second).toHaveLength(3);
    // potpuno isti rezultat
    expect(second).toEqual(first);

    // sanity: Playwright dokumenti ispred Vitesta
    expect(first[0].id).toBe('3');
    expect(first[1].id).toBe('1');
  });

  it('EP04-US01-TC04 — ranking is case-insensitive for query and docs', () => {
    const docs: KBEntry[] = [
      {
        id: '1',
        title: 'Playwright Intro',
        text: 'End-to-end Testing for Web Apps',
      },
      {
        id: '2',
        title: 'Random Topic',
        text: 'This has nothing to do with testing.',
      },
    ];

    const lower = rankDocuments('playwright testing', docs, 2);
    const upper = rankDocuments('PLAYWRIGHT TESTING', docs, 2);

    expect(lower[0].id).toBe('1');
    expect(upper[0].id).toBe('1');
    expect(upper).toEqual(lower);
  });

  it('EP04-US01-TC05 — empty or whitespace query returns []', () => {
    const docs: KBEntry[] = [
      { id: '1', title: 'Foo', text: 'Bar' },
      { id: '2', title: 'Baz', text: 'Qux' },
    ];

    expect(rankDocuments('', docs, 5)).toEqual([]);
    expect(rankDocuments('   ', docs, 5)).toEqual([]);
  });

  it('EP04-US01-TC06 — scores are normalized between 0 and 1', () => {
    const docs: KBEntry[] = [
      {
        id: '1',
        title: 'Playwright',
        text: 'Playwright testing',
      },
      {
        id: '2',
        title: 'Vitest',
        text: 'Unit testing',
      },
    ];

    const ranked = rankDocuments('testing', docs, 2);

    for (const doc of ranked) {
      expect(doc.score).toBeGreaterThanOrEqual(0);
      expect(doc.score).toBeLessThanOrEqual(1);
    }
  });
});
