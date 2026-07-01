import { describe, it, expect } from 'vitest';
import {
  transposeNote, transposeChord, transposeChordLine,
  transposeLines, transposeLabel, transposeOptions,
} from '../services/chords/chordTranspose';
import type { ChordToken, ChordLine } from '../types/chords';

describe('transposeNote', () => {
  it('transposes up by 2 semitones (sharps)', () => {
    expect(transposeNote('C', 2)).toBe('D');
    expect(transposeNote('A', 2)).toBe('B');
    expect(transposeNote('B', 2)).toBe('C#');
  });

  it('transposes down by 1 semitone', () => {
    expect(transposeNote('C', -1)).toBe('B');
    expect(transposeNote('D', -1)).toBe('C#');
  });

  it('uses flats when requested', () => {
    expect(transposeNote('C', 1, true)).toBe('Db');
    expect(transposeNote('A', 3, true)).toBe('C');
    expect(transposeNote('D', -1, true)).toBe('Db');
  });

  it('wraps around octave', () => {
    expect(transposeNote('C', 12)).toBe('C');
    expect(transposeNote('G', -12)).toBe('G');
    expect(transposeNote('E', 24)).toBe('E');
  });

  it('returns original for unknown note', () => {
    expect(transposeNote('X', 3)).toBe('X');
  });
});

describe('transposeChord', () => {
  it('transposes major chord', () => {
    const chord: ChordToken = { symbol: 'C', root: 'C', quality: '', column: 0 };
    const result = transposeChord(chord, 2);
    expect(result.root).toBe('D');
    expect(result.symbol).toBe('D');
  });

  it('transposes minor chord preserving quality', () => {
    const chord: ChordToken = { symbol: 'Am', root: 'A', quality: 'm', column: 0 };
    const result = transposeChord(chord, 3);
    expect(result.symbol).toBe('Cm');
  });

  it('transposes slash chord bass note', () => {
    const chord: ChordToken = { symbol: 'C/G', root: 'C', quality: '', bass: 'G', column: 0 };
    const result = transposeChord(chord, 2);
    expect(result.root).toBe('D');
    expect(result.bass).toBe('A');
    expect(result.symbol).toBe('D/A');
  });

  it('returns unchanged for 0 semitones', () => {
    const chord: ChordToken = { symbol: 'Em', root: 'E', quality: 'm', column: 0 };
    expect(transposeChord(chord, 0)).toBe(chord);
  });
});

describe('transposeChordLine', () => {
  it('transposes all chords in a line', () => {
    const result = transposeChordLine('Am  C  G  D', 2);
    expect(result).toContain('Bm');
    expect(result).toContain('A');
  });

  it('preserves spacing', () => {
    const original = 'Am        C';
    const result = transposeChordLine(original, 0);
    expect(result).toBe(original);
  });
});

describe('transposeLines', () => {
  it('transposes chord lines only', () => {
    const lines: ChordLine[] = [
      { type: 'section', text: '[Verse]' },
      { type: 'chord', text: 'Am C', chords: [
        { symbol: 'Am', root: 'A', quality: 'm', column: 0 },
        { symbol: 'C', root: 'C', quality: '', column: 3 },
      ] },
      { type: 'lyric', text: 'Hello world' },
    ];
    const result = transposeLines(lines, 2);
    expect(result[0].text).toBe('[Verse]');
    expect(result[2].text).toBe('Hello world');
    // Chord line should be transposed
    expect(result[1].chords![0].root).toBe('B');
  });

  it('returns unchanged for 0', () => {
    const lines: ChordLine[] = [{ type: 'lyric', text: 'hi' }];
    expect(transposeLines(lines, 0)).toBe(lines);
  });
});

describe('transposeLabel', () => {
  it('shows original key for 0', () => {
    expect(transposeLabel('C', 0)).toBe('Original key');
  });

  it('shows positive offset', () => {
    const label = transposeLabel('C', 2);
    expect(label).toContain('+2');
    expect(label).toContain('C');
    expect(label).toContain('D');
  });

  it('shows negative offset', () => {
    const label = transposeLabel('C', -1);
    expect(label).toContain('-1');
  });
});

describe('transposeOptions', () => {
  it('returns 13 options (-6 to +6)', () => {
    const opts = transposeOptions('C');
    expect(opts).toHaveLength(13);
    expect(opts[0].semitones).toBe(-6);
    expect(opts[6].semitones).toBe(0);
    expect(opts[12].semitones).toBe(6);
  });
});
