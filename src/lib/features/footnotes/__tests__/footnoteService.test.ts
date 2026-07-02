import { describe, it, expect } from 'vitest';
import { nextFootnoteIndex, extractFootnotes, getFootnoteIds } from '../services/footnoteService';

describe('nextFootnoteIndex', () => {
  it('returns 1 for empty document', () => {
    expect(nextFootnoteIndex('')).toBe(1);
  });

  it('returns 1 when no numbered footnotes exist', () => {
    expect(nextFootnoteIndex('Hello world\n[^note]: detail')).toBe(1);
  });

  it('returns 2 when [^1] exists', () => {
    expect(nextFootnoteIndex('Some text[^1] here\n[^1]: detail')).toBe(2);
  });

  it('finds gaps: skips to 2 when 1 and 3 exist', () => {
    expect(nextFootnoteIndex('A[^1] B[^3]\n[^1]: x\n[^3]: y')).toBe(2);
  });

  it('returns 4 when 1,2,3 all exist', () => {
    expect(nextFootnoteIndex('[^1] [^2] [^3]')).toBe(4);
  });
});

describe('extractFootnotes', () => {
  it('returns empty array for no footnotes', () => {
    expect(extractFootnotes('plain text')).toEqual([]);
  });

  it('extracts a single numbered footnote with ref and detail', () => {
    const doc = 'text[^1] more\n[^1]: detail here';
    const fns = extractFootnotes(doc);
    expect(fns).toHaveLength(1);
    expect(fns[0].id).toBe('1');
    expect(fns[0].refPositions).toHaveLength(1);
    expect(fns[0].detailLine).toBe(1);
  });

  it('extracts named footnotes', () => {
    const doc = 'see[^citation] for more\n[^citation]: Source A';
    const fns = extractFootnotes(doc);
    expect(fns).toHaveLength(1);
    expect(fns[0].id).toBe('citation');
  });

  it('extracts multiple footnotes', () => {
    const doc = 'A[^1] B[^2] C[^note]\n[^1]: x\n[^2]: y\n[^note]: z';
    const fns = extractFootnotes(doc);
    expect(fns).toHaveLength(3);
    const ids = fns.map((f) => f.id).sort();
    expect(ids).toEqual(['1', '2', 'note']);
  });

  it('handles orphaned refs (no detail)', () => {
    const doc = 'text[^orphan] more';
    const fns = extractFootnotes(doc);
    expect(fns).toHaveLength(1);
    expect(fns[0].detailLine).toBeNull();
  });

  it('handles orphaned details (no ref)', () => {
    const doc = '[^unused]: some detail';
    const fns = extractFootnotes(doc);
    expect(fns).toHaveLength(1);
    expect(fns[0].refPositions).toHaveLength(0);
    expect(fns[0].detailLine).toBe(0);
  });
});

describe('getFootnoteIds', () => {
  it('returns empty array for no footnotes', () => {
    expect(getFootnoteIds('plain text')).toEqual([]);
  });

  it('returns sorted unique IDs', () => {
    const doc = '[^b] [^a] [^b] [^1]';
    expect(getFootnoteIds(doc)).toEqual(['1', 'a', 'b']);
  });
});
