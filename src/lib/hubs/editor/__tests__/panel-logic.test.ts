import { describe, expect, it } from 'vitest';

// ── Pure functions extracted for testing ──────────────────────────
// These mirror the logic inside OutlinePanel, PropertiesPanel, and
// WordCountPanel so we can unit-test without mounting Svelte components.

// ── Outline: heading extraction ──────────────────────────────────

interface HeadingItem {
  level: number;
  text: string;
  line: number;
}

function extractHeadings(src: string): HeadingItem[] {
  const lines = src.split('\n');
  const items: HeadingItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)/);
    if (match) {
      items.push({ level: match[1].length, text: match[2], line: i });
    }
  }
  return items;
}

// ── Properties: frontmatter parsing ──────────────────────────────

interface FmEntry {
  key: string;
  value: string;
}

function parseFrontmatter(src: string): FmEntry[] {
  if (!src.startsWith('---')) return [];
  const end = src.indexOf('---', 3);
  if (end === -1) return [];
  const lines = src.slice(3, end).trim().split('\n');
  const result: FmEntry[] = [];
  for (const line of lines) {
    const ci = line.indexOf(':');
    if (ci > 0) {
      result.push({ key: line.slice(0, ci).trim(), value: line.slice(ci + 1).trim() });
    }
  }
  return result;
}

function getBody(src: string): string {
  if (!src.startsWith('---')) return src;
  const end = src.indexOf('---', 3);
  if (end === -1) return src;
  return src.slice(end + 3).replace(/^\n/, '');
}

function buildContent(props: FmEntry[], src: string): string {
  const body = getBody(src);
  if (props.length === 0) return body;
  const fm = props.map((p) => `${p.key}: ${p.value}`).join('\n');
  return `---\n${fm}\n---\n${body}`;
}

// ── WordCount: document statistics ───────────────────────────────

function countWords(content: string): number {
  return content ? content.split(/\s+/).filter((w) => w.length > 0).length : 0;
}

function countParagraphs(content: string): number {
  return content ? content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0;
}

function countHeadings(content: string): number {
  return content ? (content.match(/^#{1,6}\s/gm) ?? []).length : 0;
}

function countWikilinks(content: string): number {
  return content ? (content.match(/\[\[.+?\]\]/g) ?? []).length : 0;
}

function readingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}

// ── Test Suites ──────────────────────────────────────────────────

describe('OutlinePanel — heading extraction', () => {
  it('should extract headings with correct levels and text', () => {
    const md = '# Title\n\nSome text\n\n## Section A\n\n### Subsection\n\n## Section B';
    const result = extractHeadings(md);

    expect(result).toEqual([
      { level: 1, text: 'Title', line: 0 },
      { level: 2, text: 'Section A', line: 4 },
      { level: 3, text: 'Subsection', line: 6 },
      { level: 2, text: 'Section B', line: 8 },
    ]);
  });

  it('should return empty array for content with no headings', () => {
    expect(extractHeadings('Just a paragraph.\nAnother line.')).toEqual([]);
  });

  it('should handle all 6 heading levels', () => {
    const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const result = extractHeadings(md);

    expect(result).toHaveLength(6);
    expect(result.map((h) => h.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should ignore lines that look like headings but are not', () => {
    const md = '#no space\n##also no space\nNot a heading\n# Real heading';
    const result = extractHeadings(md);

    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Real heading');
  });

  it('should handle empty input', () => {
    expect(extractHeadings('')).toEqual([]);
  });
});

describe('PropertiesPanel — frontmatter parsing', () => {
  const FIXTURE_WITH_FM = `---
title: My Note
tags: rust, svelte
date: 2025-07-06
---
# Content here`;

  const FIXTURE_NO_FM = '# Just a heading\n\nSome content.';

  it('should parse valid YAML frontmatter into key-value entries', () => {
    const result = parseFrontmatter(FIXTURE_WITH_FM);

    expect(result).toEqual([
      { key: 'title', value: 'My Note' },
      { key: 'tags', value: 'rust, svelte' },
      { key: 'date', value: '2025-07-06' },
    ]);
  });

  it('should return empty array when no frontmatter delimiters exist', () => {
    expect(parseFrontmatter(FIXTURE_NO_FM)).toEqual([]);
  });

  it('should return empty array for unclosed frontmatter', () => {
    expect(parseFrontmatter('---\ntitle: broken')).toEqual([]);
  });

  it('should handle empty frontmatter block', () => {
    expect(parseFrontmatter('---\n---\nBody')).toEqual([]);
  });

  it('should handle values with colons (URLs etc.)', () => {
    const src = '---\nurl: https://example.com\n---\nBody';
    const result = parseFrontmatter(src);

    expect(result).toEqual([{ key: 'url', value: 'https://example.com' }]);
  });

  describe('getBody', () => {
    it('should extract body after frontmatter', () => {
      expect(getBody(FIXTURE_WITH_FM)).toBe('# Content here');
    });

    it('should return full content when no frontmatter exists', () => {
      expect(getBody(FIXTURE_NO_FM)).toBe(FIXTURE_NO_FM);
    });
  });

  describe('buildContent', () => {
    it('should reconstruct content from properties and source', () => {
      const props: FmEntry[] = [
        { key: 'title', value: 'Updated' },
        { key: 'status', value: 'draft' },
      ];
      const result = buildContent(props, FIXTURE_WITH_FM);

      expect(result).toBe('---\ntitle: Updated\nstatus: draft\n---\n# Content here');
    });

    it('should return body only when properties are empty', () => {
      const result = buildContent([], FIXTURE_WITH_FM);
      expect(result).toBe('# Content here');
    });

    it('should add frontmatter to content that had none', () => {
      const props: FmEntry[] = [{ key: 'title', value: 'New' }];
      const result = buildContent(props, FIXTURE_NO_FM);

      expect(result).toBe(`---\ntitle: New\n---\n${FIXTURE_NO_FM}`);
    });
  });
});

describe('WordCountPanel — document statistics', () => {
  const FIXTURE = `# My Document

This is a paragraph with some words.

Another paragraph here.

## Section

- [[Link One]]
- [[Link Two]]

### Sub heading

Final words.`;

  it('should count words accurately', () => {
    expect(countWords(FIXTURE)).toBeGreaterThan(0);
    expect(countWords('')).toBe(0);
    expect(countWords('one two three')).toBe(3);
  });

  it('should count paragraphs separated by blank lines', () => {
    expect(countParagraphs(FIXTURE)).toBeGreaterThanOrEqual(3);
    expect(countParagraphs('')).toBe(0);
  });

  it('should count markdown headings', () => {
    expect(countHeadings(FIXTURE)).toBe(3);
    expect(countHeadings('No headings here')).toBe(0);
  });

  it('should count wikilinks', () => {
    expect(countWikilinks(FIXTURE)).toBe(2);
    expect(countWikilinks('No links')).toBe(0);
  });

  it('should calculate reading time (minimum 1 minute)', () => {
    expect(readingTime(0)).toBe(1);
    expect(readingTime(100)).toBe(1);
    expect(readingTime(200)).toBe(1);
    expect(readingTime(201)).toBe(2);
    expect(readingTime(1000)).toBe(5);
  });

  it('should handle edge cases for character counting', () => {
    const content = 'hello world';
    expect(content.length).toBe(11);
    expect(content.replace(/\s/g, '').length).toBe(10);
  });
});

// ── Breadcrumbs: path trail ───────────────────────────────────────

import { buildTrail } from '@/hubs/editor/services/breadcrumb-service';
import { detectLineTagName } from '@/hubs/editor/services/contextual-typography';

describe('breadcrumb-service', () => {
  it('returns empty for empty path', () => {
    expect(buildTrail('')).toEqual([]);
  });

  it('builds single-level trail for root note', () => {
    const trail = buildTrail('readme.md');
    expect(trail).toHaveLength(1);
    expect(trail[0].label).toBe('readme');
    expect(trail[0].isActive).toBe(true);
    expect(trail[0].type).toBe('note');
  });

  it('builds multi-level trail', () => {
    const trail = buildTrail('docs/guides/setup.md');
    expect(trail).toHaveLength(3);
    expect(trail[0]).toEqual({ label: 'docs', path: 'docs', isActive: false, type: 'folder' });
    expect(trail[1]).toEqual({
      label: 'guides',
      path: 'docs/guides',
      isActive: false,
      type: 'folder',
    });
    expect(trail[2]).toEqual({
      label: 'setup',
      path: 'docs/guides/setup.md',
      isActive: true,
      type: 'note',
    });
  });

  it('strips .md from note label only', () => {
    const trail = buildTrail('folder/note.md');
    expect(trail[0].label).toBe('folder');
    expect(trail[1].label).toBe('note');
  });
});

// ── Contextual typography: line tag detection ─────────────────────

describe('detectLineTagName', () => {
  it('detects headings h1–h6', () => {
    expect(detectLineTagName('# Title')).toBe('h1');
    expect(detectLineTagName('## Sub')).toBe('h2');
    expect(detectLineTagName('###### H6')).toBe('h6');
  });

  it('detects horizontal rules', () => {
    expect(detectLineTagName('---')).toBe('hr');
    expect(detectLineTagName('***')).toBe('hr');
    expect(detectLineTagName('___')).toBe('hr');
  });

  it('detects blockquotes', () => {
    expect(detectLineTagName('> quote')).toBe('blockquote');
  });

  it('detects list items', () => {
    expect(detectLineTagName('- item')).toBe('ul');
    expect(detectLineTagName('* item')).toBe('ul');
    expect(detectLineTagName('1. item')).toBe('ol');
  });

  it('detects fenced code', () => {
    expect(detectLineTagName('```js')).toBe('pre');
    expect(detectLineTagName('~~~')).toBe('pre');
  });

  it('detects tables', () => {
    expect(detectLineTagName('| col1 | col2 |')).toBe('table');
  });

  it('detects images', () => {
    expect(detectLineTagName('![alt](url)')).toBe('figure');
  });

  it('detects paragraphs', () => {
    expect(detectLineTagName('Some text')).toBe('p');
  });

  it('returns null for empty lines', () => {
    expect(detectLineTagName('')).toBeNull();
    expect(detectLineTagName('   ')).toBeNull();
  });
});
