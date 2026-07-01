import { describe, it, expect } from 'vitest';
import {
  findMatch, isWordTrigger, sortRules,
  prettifyText, unprettifyText,
} from '../services/prettifier';
import type { SymbolRule } from '../types';
import { DEFAULT_RULES } from '../types';

const rules = sortRules(DEFAULT_RULES);

describe('isWordTrigger', () => {
  it('returns true for alphabetic triggers', () => {
    expect(isWordTrigger('pi')).toBe(true);
    expect(isWordTrigger('alpha')).toBe(true);
  });
  it('returns false for symbol triggers', () => {
    expect(isWordTrigger('->')).toBe(false);
    expect(isWordTrigger('<=>')).toBe(false);
    expect(isWordTrigger('(c)')).toBe(false);
  });
});

describe('sortRules', () => {
  it('sorts longest trigger first', () => {
    const input: SymbolRule[] = [
      { trigger: '->', replacement: '\u2192', enabled: true },
      { trigger: '<->', replacement: '\u2194', enabled: true },
      { trigger: '-->', replacement: '\u2192', enabled: true },
    ];
    const sorted = sortRules(input);
    expect(sorted[0].trigger).toBe('<->');
    expect(sorted[1].trigger).toBe('-->');
    expect(sorted[2].trigger).toBe('->');
  });
});

describe('findMatch', () => {
  it('matches -> at end of text', () => {
    const match = findMatch('hello -', '>', rules);
    expect(match).not.toBeNull();
    expect(match!.replacement).toBe('\u2192');
  });

  it('matches <- at end of text', () => {
    const match = findMatch('hello <', '-', rules);
    expect(match).not.toBeNull();
    expect(match!.replacement).toBe('\u2190');
  });

  it('matches <-> (longest first)', () => {
    const match = findMatch('a <-', '>', rules);
    expect(match).not.toBeNull();
    expect(match!.replacement).toBe('\u2194');
  });

  it('matches <=> double arrow', () => {
    const match = findMatch('x <=', '>', rules);
    expect(match).not.toBeNull();
    expect(match!.replacement).toBe('\u21D4');
  });

  it('matches >= (greater or equal)', () => {
    const match = findMatch('x >', '=', rules);
    expect(match).not.toBeNull();
    expect(match!.replacement).toBe('\u2265');
  });

  it('matches +- (plus-minus)', () => {
    const match = findMatch('5 +', '-', rules);
    expect(match).not.toBeNull();
    expect(match!.replacement).toBe('\u00B1');
  });

  it('matches ... (ellipsis)', () => {
    const match = findMatch('wait..', '.', rules);
    expect(match).not.toBeNull();
    expect(match!.replacement).toBe('\u2026');
  });

  it('matches (c) copyright', () => {
    const match = findMatch('text (c', ')', rules);
    expect(match).not.toBeNull();
    expect(match!.replacement).toBe('\u00A9');
  });

  it('matches (tm) trademark', () => {
    const match = findMatch('brand (tm', ')', rules);
    expect(match).not.toBeNull();
    expect(match!.replacement).toBe('\u2122');
  });

  it('returns null when no match', () => {
    expect(findMatch('hello worl', 'd', rules)).toBeNull();
  });

  it('skips disabled rules', () => {
    const custom: SymbolRule[] = [
      { trigger: '->', replacement: '\u2192', enabled: false },
    ];
    expect(findMatch('test -', '>', custom)).toBeNull();
  });

  describe('word triggers', () => {
    it('matches pi with word boundary', () => {
      const match = findMatch('area = r^2 * p', 'i', rules, ' ');
      expect(match).not.toBeNull();
      expect(match!.replacement).toBe('\u03C0');
    });

    it('does not match pi inside a word', () => {
      const match = findMatch('pinecone typ', 'i', rules);
      expect(match).toBeNull();
    });

    it('matches alpha after space', () => {
      const match = findMatch('value alph', 'a', rules, ' ');
      expect(match).not.toBeNull();
      expect(match!.replacement).toBe('\u03B1');
    });

    it('does not match alpha inside a word', () => {
      expect(findMatch('alphabetica', 'l', rules)).toBeNull();
    });
  });
});

describe('prettifyText', () => {
  it('replaces arrow sequences', () => {
    expect(prettifyText('a -> b <- c', rules)).toBe('a \u2192 b \u2190 c');
  });

  it('replaces multiple different symbols', () => {
    const result = prettifyText('x >= 5 and y =< 3', rules);
    expect(result).toContain('\u2265');
    expect(result).toContain('\u2264');
  });

  it('replaces bidirectional arrow', () => {
    expect(prettifyText('a <-> b', rules)).toBe('a \u2194 b');
  });

  it('replaces double arrows', () => {
    expect(prettifyText('a <=> b', rules)).toBe('a \u21D4 b');
  });

  it('replaces plus-minus', () => {
    expect(prettifyText('5 +- 2', rules)).toBe('5 \u00B1 2');
  });

  it('replaces ellipsis', () => {
    expect(prettifyText('wait...', rules)).toBe('wait\u2026');
  });

  it('replaces em dash', () => {
    expect(prettifyText('word---word', rules)).toBe('word\u2014word');
  });

  it('replaces en dash', () => {
    expect(prettifyText('pages 1--10', rules)).toContain('\u2013');
  });

  it('replaces copyright and trademark', () => {
    expect(prettifyText('Foo (c) Bar (tm)', rules)).toContain('\u00A9');
    expect(prettifyText('Foo (c) Bar (tm)', rules)).toContain('\u2122');
  });

  it('replaces fractions', () => {
    expect(prettifyText('1/2 cup', rules)).toContain('\u00BD');
    expect(prettifyText('1/4 tsp', rules)).toContain('\u00BC');
  });

  it('leaves non-matching text unchanged', () => {
    expect(prettifyText('hello world', rules)).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(prettifyText('', rules)).toBe('');
  });
});

describe('unprettifyText', () => {
  it('converts unicode back to ASCII', () => {
    expect(unprettifyText('a \u2192 b', rules)).toBe('a -> b');
  });

  it('round-trips through prettify/unprettify for symbol triggers', () => {
    const original = 'a -> b <-> c => d';
    const prettified = prettifyText(original, rules);
    expect(prettified).not.toBe(original);
    const restored = unprettifyText(prettified, rules);
    expect(restored).toBe(original);
  });
});
