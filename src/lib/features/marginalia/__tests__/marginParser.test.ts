import { describe, it, expect } from 'vitest';
import {
  resolvePrefix, parseImage, isBlurNote, stripBlurSuffix,
  parseMarginNotes, stripMarginNotes, lineMainText,
  insertMarginNote, wrapWithMarginNote, wrapCornellBlock,
  groupByColor, groupByFile,
} from '../services/marginParser';
import { DEFAULT_PREFIXES } from '../types';

describe('resolvePrefix', () => {
  it('resolves question prefix', () => {
    const result = resolvePrefix('? What is ATP?', DEFAULT_PREFIXES);
    expect(result.prefix?.label).toBe('Question');
    expect(result.cleanText).toBe('What is ATP?');
  });

  it('resolves important prefix', () => {
    const result = resolvePrefix('! Exam topic!', DEFAULT_PREFIXES);
    expect(result.prefix?.label).toBe('Important');
    expect(result.cleanText).toBe('Exam topic!');
  });

  it('resolves correction prefix', () => {
    const result = resolvePrefix('X- Wrong definition', DEFAULT_PREFIXES);
    expect(result.prefix?.label).toBe('Correction');
    expect(result.cleanText).toBe('Wrong definition');
  });

  it('resolves verified prefix', () => {
    const result = resolvePrefix('V- Checked', DEFAULT_PREFIXES);
    expect(result.prefix?.label).toBe('Verified');
    expect(result.cleanText).toBe('Checked');
  });

  it('returns null prefix for no match', () => {
    const result = resolvePrefix('Regular note', DEFAULT_PREFIXES);
    expect(result.prefix).toBeNull();
    expect(result.cleanText).toBe('Regular note');
  });
});

describe('parseImage', () => {
  it('detects image syntax', () => {
    const result = parseImage('img:[[photo.png]]');
    expect(result.isImage).toBe(true);
    expect(result.imagePath).toBe('photo.png');
  });

  it('returns false for non-image', () => {
    const result = parseImage('regular text');
    expect(result.isImage).toBe(false);
    expect(result.imagePath).toBeNull();
  });
});

describe('blur detection', () => {
  it('detects blur suffix', () => {
    expect(isBlurNote('Question about ATP;;')).toBe(true);
    expect(isBlurNote('Question about ATP;; ')).toBe(true);
    expect(isBlurNote('Not a blur note')).toBe(false);
  });

  it('strips blur suffix', () => {
    expect(stripBlurSuffix('Question about ATP;;')).toBe('Question about ATP');
    expect(stripBlurSuffix('Question about ATP;; ')).toBe('Question about ATP');
  });
});

describe('parseMarginNotes', () => {
  it('parses right margin note', () => {
    const content = 'Mitochondria generate energy. %%> Powerhouse of the cell %%';
    const notes = parseMarginNotes(content, 'test.md');
    expect(notes).toHaveLength(1);
    expect(notes[0].text).toBe('Powerhouse of the cell');
    expect(notes[0].direction).toBe('right');
    expect(notes[0].line).toBe(1);
  });

  it('parses left margin note', () => {
    const content = 'Text here %%< Left note %%';
    const notes = parseMarginNotes(content, 'test.md');
    expect(notes).toHaveLength(1);
    expect(notes[0].direction).toBe('left');
  });

  it('parses multiple notes', () => {
    const content = 'Line 1 %%> Note A %%\nLine 2 %%> Note B %% %%< Note C %%';
    const notes = parseMarginNotes(content, 'test.md');
    expect(notes).toHaveLength(3);
  });

  it('detects semantic prefix', () => {
    const content = '%%> ? What is ATP? %%';
    const notes = parseMarginNotes(content, 'test.md');
    expect(notes[0].prefix?.label).toBe('Question');
    expect(notes[0].text).toBe('What is ATP?');
  });

  it('detects blur notes', () => {
    const content = '%%> Study this;; %%';
    const notes = parseMarginNotes(content, 'test.md');
    expect(notes[0].isBlur).toBe(true);
    expect(notes[0].text).toBe('Study this');
  });

  it('detects image notes', () => {
    const content = '%%> img:[[diagram.png]] %%';
    const notes = parseMarginNotes(content, 'test.md');
    expect(notes[0].isImage).toBe(true);
    expect(notes[0].imagePath).toBe('diagram.png');
  });

  it('sets correct line numbers', () => {
    const content = 'Line 1\nLine 2 %%> Note %%\nLine 3';
    const notes = parseMarginNotes(content, 'test.md');
    expect(notes[0].line).toBe(2);
  });

  it('returns empty for no notes', () => {
    const notes = parseMarginNotes('Regular text', 'test.md');
    expect(notes).toHaveLength(0);
  });
});

describe('stripMarginNotes', () => {
  it('removes all margin syntax', () => {
    const content = 'Main text %%> Note %% more text %%< Other %%';
    expect(stripMarginNotes(content)).toBe('Main text  more text');
  });
});

describe('lineMainText', () => {
  it('extracts main text from a line', () => {
    expect(lineMainText('Main text %%> Note %%')).toBe('Main text');
  });

  it('returns full line if no margin', () => {
    expect(lineMainText('Just text')).toBe('Just text');
  });
});

describe('insertMarginNote', () => {
  it('appends margin note to specific line', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    const result = insertMarginNote(content, 2, 'My note');
    expect(result).toContain('Line 2 %%> My note %%');
  });

  it('supports left direction', () => {
    const result = insertMarginNote('Hello', 1, 'Note', 'left');
    expect(result).toContain('%%< Note %%');
  });
});

describe('wrapWithMarginNote', () => {
  it('wraps text in right margin syntax', () => {
    expect(wrapWithMarginNote('Important')).toBe('%%> Important %%');
  });

  it('wraps text in left margin syntax', () => {
    expect(wrapWithMarginNote('Note', 'left')).toBe('%%< Note %%');
  });
});

describe('wrapCornellBlock', () => {
  it('wraps content in cornell fenced block', () => {
    const result = wrapCornellBlock('My text here');
    expect(result).toContain('```cornell');
    expect(result).toContain('%%>  %%');
    expect(result).toContain('My text here');
  });
});

describe('groupByColor', () => {
  it('groups notes by prefix label', () => {
    const notes = parseMarginNotes(
      '%%> ? Question %% %%> ! Important %% %%> ? Another question %%',
      'test.md',
    );
    const groups = groupByColor(notes);
    expect(groups.get('Question')?.length).toBe(2);
    expect(groups.get('Important')?.length).toBe(1);
  });

  it('puts untagged notes in Default group', () => {
    const notes = parseMarginNotes('%%> Plain note %%', 'test.md');
    const groups = groupByColor(notes);
    expect(groups.has('Default')).toBe(true);
  });
});

describe('groupByFile', () => {
  it('groups notes by file path', () => {
    const content = '%%> Note A %% %%> Note B %%';
    const notes = parseMarginNotes(content, 'file1.md');
    const groups = groupByFile(notes);
    expect(groups.get('file1.md')?.length).toBe(2);
  });
});
