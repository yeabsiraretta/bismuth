import { describe, it, expect } from 'vitest';
import {
  parseChordSymbol, extractChords, isChordLine, classifyLine,
  parseChordBlock, findChordBlocks, sampleChordSheet,
} from '../services/chords/chordParser';

describe('parseChordSymbol', () => {
  it('parses major chord', () => {
    const t = parseChordSymbol('C');
    expect(t).not.toBeNull();
    expect(t!.root).toBe('C');
    expect(t!.quality).toBe('');
    expect(t!.symbol).toBe('C');
  });

  it('parses minor chord', () => {
    const t = parseChordSymbol('Am');
    expect(t!.root).toBe('A');
    expect(t!.quality).toBe('m');
  });

  it('parses flat root', () => {
    const t = parseChordSymbol('Bb7');
    expect(t!.root).toBe('Bb');
    expect(t!.quality).toBe('7');
  });

  it('parses sharp root', () => {
    const t = parseChordSymbol('F#m');
    expect(t!.root).toBe('F#');
    expect(t!.quality).toBe('m');
  });

  it('parses slash chord', () => {
    const t = parseChordSymbol('C/G');
    expect(t!.root).toBe('C');
    expect(t!.bass).toBe('G');
  });

  it('parses chord with custom shape', () => {
    const t = parseChordSymbol('Bbadd13[x13333]');
    expect(t!.root).toBe('Bb');
    expect(t!.customShape).toBe('x13333');
    expect(t!.symbol).toBe('Bbadd13');
  });

  it('parses sus chords', () => {
    const t = parseChordSymbol('Dsus4');
    expect(t!.root).toBe('D');
    expect(t!.quality).toBe('sus4');
  });

  it('parses dim/aug', () => {
    expect(parseChordSymbol('Cdim')!.quality).toBe('dim');
    expect(parseChordSymbol('Caug')!.quality).toBe('aug');
  });

  it('returns null for non-chord', () => {
    expect(parseChordSymbol('hello')).toBeNull();
    expect(parseChordSymbol('the')).toBeNull();
    expect(parseChordSymbol('I')).toBeNull();
  });
});

describe('extractChords', () => {
  it('extracts multiple chords from a line', () => {
    const chords = extractChords('Am  C  G  D');
    expect(chords).toHaveLength(4);
    expect(chords[0].symbol).toBe('Am');
    expect(chords[3].symbol).toBe('D');
  });

  it('handles line with marker', () => {
    const chords = extractChords('Am C G %c');
    expect(chords).toHaveLength(3);
  });
});

describe('isChordLine', () => {
  it('detects chord line', () => {
    expect(isChordLine('Am  C  G  D')).toBe(true);
  });

  it('rejects lyric line', () => {
    expect(isChordLine('All along the watchtower')).toBe(false);
  });

  it('respects %c marker', () => {
    expect(isChordLine('Am %c')).toBe(true);
  });

  it('respects %t marker', () => {
    expect(isChordLine('Am some lyric %t')).toBe(false);
  });

  it('detects section headers as non-chord', () => {
    expect(isChordLine('[Verse]')).toBe(false);
    expect(isChordLine('[Chorus]')).toBe(false);
  });

  it('handles empty line', () => {
    expect(isChordLine('')).toBe(false);
  });
});

describe('classifyLine', () => {
  it('classifies section header', () => {
    expect(classifyLine('[Verse]').type).toBe('section');
    expect(classifyLine('  [Chorus]  ').type).toBe('section');
  });

  it('classifies chord line', () => {
    const line = classifyLine('Am  C  G  D');
    expect(line.type).toBe('chord');
    expect(line.chords).toHaveLength(4);
  });

  it('classifies lyric line', () => {
    expect(classifyLine('All along the watchtower').type).toBe('lyric');
  });

  it('classifies empty line', () => {
    expect(classifyLine('').type).toBe('empty');
    expect(classifyLine('  ').type).toBe('empty');
  });

  it('classifies tab line', () => {
    expect(classifyLine('e|--0-2-3--|').type).toBe('tab');
  });
});

describe('parseChordBlock', () => {
  it('parses a block with instrument directive', () => {
    const result = parseChordBlock('%instrument ukulele\nAm C\nLyrics here');
    expect(result.instrument).toBe('ukulele');
    expect(result.lines).toHaveLength(2);
  });

  it('parses a block without directive', () => {
    const result = parseChordBlock('[Verse]\nAm  C\nHello world');
    expect(result.instrument).toBeUndefined();
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0].type).toBe('section');
    expect(result.lines[1].type).toBe('chord');
    expect(result.lines[2].type).toBe('lyric');
  });
});

describe('findChordBlocks', () => {
  it('finds chord blocks in document', () => {
    const text = 'Some text\n```chords\nAm  C\nHello\n```\nMore text';
    const blocks = findChordBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].lines.length).toBeGreaterThanOrEqual(2);
    expect(blocks[0].lines.filter(l => l.type !== 'empty')).toHaveLength(2);
  });

  it('finds multiple blocks', () => {
    const text = '```chords\nAm C\n```\n\n```chords\nG D\n```';
    const blocks = findChordBlocks(text);
    expect(blocks).toHaveLength(2);
  });

  it('supports custom language', () => {
    const text = '```tab\nEm G\n```';
    expect(findChordBlocks(text, 'tab')).toHaveLength(1);
    expect(findChordBlocks(text, 'chords')).toHaveLength(0);
  });
});

describe('sampleChordSheet', () => {
  it('returns valid markdown', () => {
    const sample = sampleChordSheet();
    expect(sample).toContain('```chords');
    expect(sample).toContain('```');
    expect(sample).toContain('[Verse]');
    expect(sample).toContain('Am');
  });
});
