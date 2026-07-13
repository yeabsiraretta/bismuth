import { describe, expect, it } from 'vitest';

import {
  extractFootnotes,
  getFootnoteIds,
  nextFootnoteIndex,
} from '@/hubs/editor/services/footnote-service';

describe('extractFootnotes', () => {
  it('returns empty for no footnotes', () => {
    expect(extractFootnotes('Hello world')).toEqual([]);
  });

  it('extracts a single footnote ref + detail', () => {
    const doc = 'Some text [^1] here.\n\n[^1]: Detail text';
    const result = extractFootnotes(doc);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].refPositions).toHaveLength(1);
    expect(result[0].detailLine).toBe(2);
  });

  it('extracts multiple footnotes', () => {
    const doc = 'A [^a] B [^b]\n\n[^a]: Alpha\n[^b]: Beta';
    const result = extractFootnotes(doc);
    expect(result).toHaveLength(2);
    const ids = result.map((f) => f.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('handles refs without details', () => {
    const doc = 'Text [^orphan] here';
    const result = extractFootnotes(doc);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('orphan');
    expect(result[0].detailLine).toBeNull();
  });

  it('handles details without refs', () => {
    const doc = 'Some text\n\n[^unused]: Detail without ref';
    const result = extractFootnotes(doc);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('unused');
    expect(result[0].refPositions).toHaveLength(0);
    expect(result[0].detailLine).toBe(2);
  });

  it('counts multiple refs to same id', () => {
    const doc = 'A [^x] B [^x] C [^x]\n\n[^x]: X detail';
    const result = extractFootnotes(doc);
    expect(result).toHaveLength(1);
    expect(result[0].refPositions).toHaveLength(3);
  });

  it('does not count detail line markers as refs', () => {
    const doc = '[^1]: This is a detail\nSome [^1] reference';
    const result = extractFootnotes(doc);
    expect(result).toHaveLength(1);
    expect(result[0].refPositions).toHaveLength(1);
    expect(result[0].detailLine).toBe(0);
  });
});

describe('nextFootnoteIndex', () => {
  it('returns 1 for empty doc', () => {
    expect(nextFootnoteIndex('')).toBe(1);
  });

  it('returns next after existing', () => {
    expect(nextFootnoteIndex('Text [^1] and [^2]')).toBe(3);
  });

  it('fills gaps', () => {
    expect(nextFootnoteIndex('Text [^1] and [^3]')).toBe(2);
  });

  it('ignores named footnotes', () => {
    expect(nextFootnoteIndex('Text [^note] here')).toBe(1);
  });
});

describe('getFootnoteIds', () => {
  it('returns empty for no footnotes', () => {
    expect(getFootnoteIds('Hello')).toEqual([]);
  });

  it('returns sorted unique ids', () => {
    const doc = 'A [^z] B [^a] C [^a] D [^m]';
    expect(getFootnoteIds(doc)).toEqual(['a', 'm', 'z']);
  });

  it('includes numbered and named', () => {
    const doc = 'Text [^1] and [^note]';
    expect(getFootnoteIds(doc)).toEqual(['1', 'note']);
  });
});
