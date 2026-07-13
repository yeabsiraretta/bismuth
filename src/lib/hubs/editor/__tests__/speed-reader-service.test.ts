import { describe, expect, it } from 'vitest';

import {
  calcOrp,
  detectFileKind,
  estimateTime,
  formatTime,
  isReadable,
  prepareWords,
  stripMarkdown,
  tokenize,
  wordDelay,
} from '@/hubs/editor/services/speed-reader-service';

// ── File kind detection ──────────────────────────────────────────

describe('detectFileKind', () => {
  it('detects markdown files', () => {
    expect(detectFileKind('note.md')).toBe('markdown');
    expect(detectFileKind('doc.markdown')).toBe('markdown');
    expect(detectFileKind('readme.mdx')).toBe('markdown');
  });

  it('detects text files', () => {
    expect(detectFileKind('file.txt')).toBe('text');
    expect(detectFileKind('data.csv')).toBe('text');
    expect(detectFileKind('config.json')).toBe('text');
    expect(detectFileKind('page.html')).toBe('text');
    expect(detectFileKind('style.css')).toBe('text');
    expect(detectFileKind('app.ts')).toBe('text');
    expect(detectFileKind('main.py')).toBe('text');
    expect(detectFileKind('doc.rst')).toBe('text');
    expect(detectFileKind('doc.adoc')).toBe('text');
    expect(detectFileKind('paper.tex')).toBe('text');
  });

  it('detects PDF files', () => {
    expect(detectFileKind('paper.pdf')).toBe('pdf');
    expect(detectFileKind('report.PDF')).toBe('pdf');
  });

  it('detects image files for OCR', () => {
    expect(detectFileKind('scan.png')).toBe('image');
    expect(detectFileKind('photo.jpg')).toBe('image');
    expect(detectFileKind('img.jpeg')).toBe('image');
    expect(detectFileKind('pic.gif')).toBe('image');
    expect(detectFileKind('photo.webp')).toBe('image');
    expect(detectFileKind('scan.bmp')).toBe('image');
    expect(detectFileKind('doc.tiff')).toBe('image');
    expect(detectFileKind('doc.tif')).toBe('image');
  });

  it('returns unsupported for unknown types', () => {
    expect(detectFileKind('file.zip')).toBe('unsupported');
    expect(detectFileKind('video.mp4')).toBe('unsupported');
    expect(detectFileKind('no-ext')).toBe('unsupported');
  });
});

describe('isReadable', () => {
  it('returns true for supported file types', () => {
    expect(isReadable('note.md')).toBe(true);
    expect(isReadable('data.txt')).toBe(true);
    expect(isReadable('paper.pdf')).toBe(true);
    expect(isReadable('scan.png')).toBe(true);
  });

  it('returns false for unsupported types', () => {
    expect(isReadable('file.zip')).toBe(false);
    expect(isReadable('video.mp4')).toBe(false);
  });
});

// ── Markdown stripping ───────────────────────────────────────────

describe('stripMarkdown', () => {
  it('removes frontmatter', () => {
    const result = stripMarkdown('---\ntitle: Test\ntags: [a]\n---\nBody text');
    expect(result).toBe('Body text');
  });

  it('removes heading markers', () => {
    expect(stripMarkdown('# Title\n## Subtitle')).toBe('Title\nSubtitle');
  });

  it('removes bold and italic markers', () => {
    expect(stripMarkdown('**bold** and *italic*')).toBe('bold and italic');
  });

  it('removes fenced code blocks', () => {
    const input = 'Before\n```js\nconst x = 1;\n```\nAfter';
    expect(stripMarkdown(input)).toBe('Before\n\nAfter');
  });

  it('removes inline code', () => {
    expect(stripMarkdown('Use `console.log`')).toBe('Use');
  });

  it('converts wikilinks to display text', () => {
    expect(stripMarkdown('See [[Page]]')).toBe('See Page');
    expect(stripMarkdown('See [[Page|Display]]')).toBe('See Display');
  });

  it('converts markdown links to text', () => {
    expect(stripMarkdown('Visit [Google](https://google.com)')).toBe('Visit Google');
  });

  it('removes images', () => {
    expect(stripMarkdown('![alt](img.png)')).toBe('');
  });

  it('removes HTML tags', () => {
    expect(stripMarkdown('<div>content</div>')).toBe('content');
  });

  it('removes blockquote markers', () => {
    expect(stripMarkdown('> Quoted text')).toBe('Quoted text');
  });

  it('removes list bullets', () => {
    expect(stripMarkdown('- item 1\n- item 2')).toBe('item 1\nitem 2');
    expect(stripMarkdown('* item 1\n* item 2')).toBe('item 1\nitem 2');
    expect(stripMarkdown('1. first\n2. second')).toBe('first\nsecond');
  });

  it('removes task checkboxes', () => {
    expect(stripMarkdown('- [x] Done task')).toBe('Done task');
    expect(stripMarkdown('- [ ] Todo task')).toBe('Todo task');
  });

  it('removes strikethrough', () => {
    expect(stripMarkdown('~~deleted~~')).toBe('deleted');
  });

  it('removes highlight markers', () => {
    expect(stripMarkdown('==highlighted==')).toBe('highlighted');
  });

  it('removes horizontal rules', () => {
    const input = 'Above\n---\nBelow';
    // The --- after frontmatter removal should be treated as HR
    expect(stripMarkdown(input)).not.toContain('---');
  });

  it('collapses multiple blank lines', () => {
    const input = 'Paragraph 1\n\n\n\n\nParagraph 2';
    expect(stripMarkdown(input)).toBe('Paragraph 1\n\nParagraph 2');
  });

  it('handles complex mixed content', () => {
    const input =
      '---\ntitle: Test\n---\n# Heading\n\n**Bold** and *italic* with [[Link|text]] and `code`.\n\n- List item\n> Quote';
    const result = stripMarkdown(input);
    expect(result).toContain('Heading');
    expect(result).toContain('Bold');
    expect(result).toContain('italic');
    expect(result).toContain('text');
    expect(result).toContain('List item');
    expect(result).toContain('Quote');
    expect(result).not.toContain('#');
    expect(result).not.toContain('**');
    expect(result).not.toContain('`');
    expect(result).not.toContain('[[');
  });
});

// ── Tokenization ─────────────────────────────────────────────────

describe('tokenize', () => {
  it('splits text into words', () => {
    expect(tokenize('Hello world foo')).toEqual(['Hello', 'world', 'foo']);
  });

  it('handles multiple whitespace', () => {
    expect(tokenize('Hello   world\n\nfoo')).toEqual(['Hello', 'world', 'foo']);
  });

  it('filters out pure punctuation', () => {
    const result = tokenize('Hello, world! — foo...');
    expect(result).toContain('Hello,');
    expect(result).toContain('world!');
    expect(result).toContain('foo...');
    expect(result).not.toContain('—');
  });

  it('returns empty for empty string', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('returns empty for whitespace-only string', () => {
    expect(tokenize('   \n\n  ')).toEqual([]);
  });
});

// ── ORP calculation ──────────────────────────────────────────────

describe('calcOrp', () => {
  it('returns 0 for single char', () => {
    expect(calcOrp('a')).toBe(0);
    expect(calcOrp('I')).toBe(0);
  });

  it('returns 1 for 2-5 char words', () => {
    expect(calcOrp('at')).toBe(1);
    expect(calcOrp('the')).toBe(1);
    expect(calcOrp('hello')).toBe(1);
  });

  it('returns 2 for 6-9 char words', () => {
    expect(calcOrp('golden')).toBe(2);
    expect(calcOrp('beautiful')).toBe(2);
  });

  it('returns 3 for 10-13 char words', () => {
    expect(calcOrp('understand')).toBe(3);
    expect(calcOrp('appreciation')).toBe(3);
  });

  it('returns 4 for 14+ char words', () => {
    expect(calcOrp('internationally')).toBe(4);
    expect(calcOrp('experimentation')).toBe(4);
  });
});

// ── Word preparation ─────────────────────────────────────────────

describe('prepareWords', () => {
  it('creates SpeedReaderWord array', () => {
    const words = prepareWords('Hello world');
    expect(words).toHaveLength(2);
    expect(words[0].text).toBe('Hello');
    expect(words[0].orpIndex).toBe(1);
    expect(words[1].text).toBe('world');
    expect(words[1].orpIndex).toBe(1);
  });

  it('returns empty array for empty text', () => {
    expect(prepareWords('')).toEqual([]);
  });

  it('handles long words', () => {
    const words = prepareWords('internationalization');
    expect(words[0].orpIndex).toBe(4);
  });
});

// ── WPM and timing ───────────────────────────────────────────────

describe('wordDelay', () => {
  it('returns base delay for normal words', () => {
    expect(wordDelay(300, 'hello')).toBe(200);
    expect(wordDelay(600, 'hello')).toBe(100);
  });

  it('adds pause for sentence-ending punctuation', () => {
    const base = 60000 / 300;
    expect(wordDelay(300, 'done.')).toBe(base * 1.5);
    expect(wordDelay(300, 'what?')).toBe(base * 1.5);
    expect(wordDelay(300, 'wow!')).toBe(base * 1.5);
  });

  it('adds smaller pause for commas', () => {
    const base = 60000 / 300;
    expect(wordDelay(300, 'first,')).toBe(base * 1.25);
  });
});

describe('estimateTime', () => {
  it('calculates seconds remaining', () => {
    expect(estimateTime(300, 300)).toBe(60);
    expect(estimateTime(150, 300)).toBe(30);
  });

  it('rounds up', () => {
    expect(estimateTime(1, 300)).toBe(1);
  });
});

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(125)).toBe('2:05');
  });
});
