import { describe, it, expect } from 'vitest';
import {
  lookupChord,
  parseCustomShape,
  renderChordDiagramSvg,
  getUniqueChords,
} from '../services/chords/chordDiagrams';
import type { ChordToken } from '../types/chords';

function makeToken(
  symbol: string,
  root: string,
  quality: string = '',
  customShape?: string
): ChordToken {
  return { symbol, root, quality, column: 0, customShape };
}

describe('lookupChord', () => {
  it('looks up basic guitar chords', () => {
    const result = lookupChord(makeToken('C', 'C'), 'guitar');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].frets).toHaveLength(6);
  });

  it('looks up minor chord', () => {
    const result = lookupChord(makeToken('Am', 'A', 'm'), 'guitar');
    expect(result.length).toBeGreaterThan(0);
  });

  it('looks up seventh chord', () => {
    const result = lookupChord(makeToken('G7', 'G', '7'), 'guitar');
    expect(result.length).toBeGreaterThan(0);
  });

  it('looks up ukulele chords', () => {
    const result = lookupChord(makeToken('C', 'C'), 'ukulele');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].frets).toHaveLength(4);
  });

  it('returns empty for unknown chord', () => {
    const result = lookupChord(makeToken('Xaug11', 'X', 'aug11'), 'guitar');
    expect(result).toHaveLength(0);
  });

  it('uses custom shape when provided', () => {
    const result = lookupChord(makeToken('Custom', 'C', '', 'x32010'), 'guitar');
    expect(result).toHaveLength(1);
    expect(result[0].frets).toEqual([-1, 3, 2, 0, 1, 0]);
  });

  it('falls back to major for unknown quality', () => {
    const result = lookupChord(makeToken('C11', 'C', '11'), 'guitar');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('parseCustomShape', () => {
  it('parses simple shape', () => {
    const result = parseCustomShape('x32010', 'guitar');
    expect(result).not.toBeNull();
    expect(result!.frets).toEqual([-1, 3, 2, 0, 1, 0]);
    expect(result!.baseFret).toBe(1);
  });

  it('parses shape with capo', () => {
    const result = parseCustomShape('4|x2x132', 'guitar');
    expect(result).not.toBeNull();
    expect(result!.baseFret).toBe(4);
    expect(result!.frets[0]).toBe(-1);
    expect(result!.frets[2]).toBe(-1);
  });

  it('parses space-separated high frets', () => {
    const result = parseCustomShape('0 10 10 12 8 8', 'guitar');
    expect(result).not.toBeNull();
    expect(result!.frets).toEqual([0, 10, 10, 12, 8, 8]);
  });

  it('parses comma-separated high frets', () => {
    const result = parseCustomShape('0,10,10,12,8,8', 'guitar');
    expect(result).not.toBeNull();
    expect(result!.frets).toEqual([0, 10, 10, 12, 8, 8]);
  });

  it('returns null for wrong string count', () => {
    expect(parseCustomShape('012', 'guitar')).toBeNull();
    expect(parseCustomShape('01234', 'guitar')).toBeNull();
  });

  it('parses ukulele shape (4 strings)', () => {
    const result = parseCustomShape('0003', 'ukulele');
    expect(result).not.toBeNull();
    expect(result!.frets).toEqual([0, 0, 0, 3]);
  });
});

describe('renderChordDiagramSvg', () => {
  it('renders valid SVG', () => {
    const svg = renderChordDiagramSvg('C', { frets: [0, 3, 2, 0, 1, 0], baseFret: 1 });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('C');
  });

  it('shows fret number for high positions', () => {
    const svg = renderChordDiagramSvg('Bm', { frets: [-1, 1, 3, 3, 2, 1], baseFret: 2 });
    expect(svg).toContain('2fr');
  });

  it('shows muted string indicator', () => {
    const svg = renderChordDiagramSvg('D', { frets: [-1, -1, 0, 2, 3, 2], baseFret: 1 });
    expect(svg).toContain('×');
  });
});

describe('getUniqueChords', () => {
  it('extracts unique chord names', () => {
    const lines = [
      {
        chords: [
          { symbol: 'Am', root: 'A', quality: 'm', column: 0 },
          { symbol: 'C', root: 'C', quality: '', column: 4 },
        ],
      },
      {
        chords: [
          { symbol: 'Am', root: 'A', quality: 'm', column: 0 },
          { symbol: 'G', root: 'G', quality: '', column: 4 },
        ],
      },
    ];
    const unique = getUniqueChords(lines);
    expect(unique).toHaveLength(3);
    expect(unique).toContain('Am');
    expect(unique).toContain('C');
    expect(unique).toContain('G');
  });

  it('handles empty lines', () => {
    expect(getUniqueChords([{ chords: undefined }])).toHaveLength(0);
    expect(getUniqueChords([])).toHaveLength(0);
  });
});
