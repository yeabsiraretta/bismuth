import { describe, it, expect } from 'vitest';
import {
  parseCodeBlockParams,
  resolveHighlightSpec,
  resolveHighlightGroups,
  isLanguageExcluded,
} from '../services/codeBlockParser';

// ─── parseCodeBlockParams ───────────────────────────────────────────────────

describe('parseCodeBlockParams', () => {
  it('parses bare language', () => {
    const r = parseCodeBlockParams('```javascript');
    expect(r.language).toBe('javascript');
  });

  it('parses language with title', () => {
    const r = parseCodeBlockParams('```js title="my file.js"');
    expect(r.language).toBe('js');
    expect(r.title).toBe('my file.js');
  });

  it('parses fold', () => {
    const r = parseCodeBlockParams('```python fold');
    expect(r.language).toBe('python');
    expect(r.fold).toBe(true);
  });

  it('parses fold with placeholder', () => {
    const r = parseCodeBlockParams('```ts fold="Click to expand"');
    expect(r.fold).toBe(true);
    expect(r.foldPlaceholder).toBe('Click to expand');
  });

  it('parses line numbers disabled', () => {
    const r = parseCodeBlockParams('```js ln=false');
    expect(r.lineNumbers).toBe(false);
  });

  it('parses line numbers with offset', () => {
    const r = parseCodeBlockParams('```js ln=10');
    expect(r.lineNumbers).toBe(10);
  });

  it('parses highlight spec', () => {
    const r = parseCodeBlockParams('```js hl=1,3-5');
    expect(r.highlights['hl']).toBe('1,3-5');
  });

  it('parses unwrap', () => {
    const r = parseCodeBlockParams('```js unwrap');
    expect(r.unwrap).toBe(true);
  });

  it('parses wrap (inverse of unwrap)', () => {
    const r = parseCodeBlockParams('```js wrap');
    expect(r.unwrap).toBe(false);
  });

  it('parses ignore', () => {
    const r = parseCodeBlockParams('```dataview ignore');
    expect(r.ignore).toBe(true);
  });

  it('parses reference', () => {
    const r = parseCodeBlockParams('```js ref="src/main.ts"');
    expect(r.reference).toBe('src/main.ts');
  });

  it('parses RMarkdown syntax', () => {
    const r = parseCodeBlockParams('```{r title="my plot"}');
    expect(r.language).toBe('r');
    expect(r.title).toBe('my plot');
  });

  it('handles tilde fences', () => {
    const r = parseCodeBlockParams('~~~python title="example"');
    expect(r.language).toBe('python');
    expect(r.title).toBe('example');
  });

  it('returns defaults for bare fence', () => {
    const r = parseCodeBlockParams('```');
    expect(r.language).toBe('');
    expect(r.title).toBe('');
    expect(r.fold).toBe(false);
    expect(r.ignore).toBe(false);
  });

  it('handles alternative highlights', () => {
    const r = parseCodeBlockParams('```js hl=1 error=3 warn=5');
    expect(r.highlights['hl']).toBe('1');
    expect(r.highlights['error']).toBe('3');
    expect(r.highlights['warn']).toBe('5');
  });
});

// ─── resolveHighlightSpec ───────────────────────────────────────────────────

describe('resolveHighlightSpec', () => {
  const lines = [
    'const x = 1;',
    'const y = 2;',
    'function foo() {',
    '  return x + y;',
    '}',
  ];

  it('resolves single line number', () => {
    expect(resolveHighlightSpec('1', lines)).toEqual(new Set([0]));
  });

  it('resolves range', () => {
    expect(resolveHighlightSpec('2-4', lines)).toEqual(new Set([1, 2, 3]));
  });

  it('resolves comma-separated numbers', () => {
    expect(resolveHighlightSpec('1,3,5', lines)).toEqual(new Set([0, 2, 4]));
  });

  it('resolves text search', () => {
    expect(resolveHighlightSpec('foo', lines)).toEqual(new Set([2]));
  });

  it('resolves quoted text search', () => {
    expect(resolveHighlightSpec("'x + y'", lines)).toEqual(new Set([3]));
  });

  it('resolves regex search', () => {
    expect(resolveHighlightSpec('/const/', lines)).toEqual(new Set([0, 1]));
  });

  it('handles mixed specs', () => {
    const result = resolveHighlightSpec('1,/return/', lines);
    expect(result).toEqual(new Set([0, 3]));
  });

  it('returns empty for empty spec', () => {
    expect(resolveHighlightSpec('', lines).size).toBe(0);
  });

  it('clamps out-of-range numbers', () => {
    expect(resolveHighlightSpec('99', lines).size).toBe(0);
  });

  it('handles invalid regex gracefully', () => {
    expect(resolveHighlightSpec('/[invalid/', lines).size).toBe(0);
  });
});

// ─── resolveHighlightGroups ─────────────────────────────────────────────────

describe('resolveHighlightGroups', () => {
  const lines = ['line A', 'line B', 'line C'];

  it('resolves groups with default color', () => {
    const groups = resolveHighlightGroups(
      { hl: '1,3' }, lines, [], '#ff0', true,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('hl');
    expect(groups[0].lines).toEqual(new Set([0, 2]));
    expect(groups[0].color).toBe('#ff0');
  });

  it('uses alt highlight colors', () => {
    const groups = resolveHighlightGroups(
      { error: '2' }, lines,
      [{ name: 'error', lightColor: '#fcc', darkColor: '#c33' }],
      '#ff0', true,
    );
    expect(groups[0].color).toBe('#c33');
  });

  it('uses light color when not dark', () => {
    const groups = resolveHighlightGroups(
      { error: '2' }, lines,
      [{ name: 'error', lightColor: '#fcc', darkColor: '#c33' }],
      '#ff0', false,
    );
    expect(groups[0].color).toBe('#fcc');
  });

  it('skips groups with no matching lines', () => {
    const groups = resolveHighlightGroups(
      { hl: '99' }, lines, [], '#ff0', true,
    );
    expect(groups).toHaveLength(0);
  });
});

// ─── isLanguageExcluded ─────────────────────────────────────────────────────

describe('isLanguageExcluded', () => {
  it('matches exact language', () => {
    expect(isLanguageExcluded('dataview', ['dataview'])).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isLanguageExcluded('JavaScript', ['javascript'])).toBe(true);
  });

  it('does not match unrelated language', () => {
    expect(isLanguageExcluded('python', ['dataview'])).toBe(false);
  });

  it('supports wildcard patterns', () => {
    expect(isLanguageExcluded('dataview', ['data*'])).toBe(true);
    expect(isLanguageExcluded('python', ['data*'])).toBe(false);
  });

  it('returns false for empty language', () => {
    expect(isLanguageExcluded('', ['dataview'])).toBe(false);
  });

  it('returns false for empty excluded list', () => {
    expect(isLanguageExcluded('js', [])).toBe(false);
  });
});
