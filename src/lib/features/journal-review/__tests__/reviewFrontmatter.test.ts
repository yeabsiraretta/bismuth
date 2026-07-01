import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter, extractBody, extractCreatedDate,
  parseFlexibleDate, extractPreview, extractTags,
  extractTitle, generateCreatedFrontmatter, ensureCreatedField,
  getFileType,
} from '../services/reviewFrontmatter';

describe('parseFrontmatter', () => {
  it('parses YAML frontmatter', () => {
    const content = '---\ntitle: Hello\ncreated: 2024-01-15\n---\n# Body';
    const fm = parseFrontmatter(content);
    expect(fm['title']).toBe('Hello');
    expect(fm['created']).toBe('2024-01-15');
  });

  it('returns empty for no frontmatter', () => {
    expect(parseFrontmatter('# No frontmatter')).toEqual({});
  });
});

describe('extractBody', () => {
  it('extracts body after frontmatter', () => {
    const content = '---\ntitle: Test\n---\n# Body content';
    expect(extractBody(content)).toBe('# Body content');
  });

  it('returns full content if no frontmatter', () => {
    expect(extractBody('# Just body')).toBe('# Just body');
  });
});

describe('extractCreatedDate', () => {
  it('extracts created field', () => {
    const content = '---\ncreated: 2024-01-15\n---\n# Note';
    expect(extractCreatedDate(content)).toBe('2024-01-15');
  });

  it('handles quoted dates', () => {
    const content = '---\ncreated: "2024-01-15"\n---\nBody';
    expect(extractCreatedDate(content)).toBe('2024-01-15');
  });

  it('returns null if field missing', () => {
    expect(extractCreatedDate('---\ntitle: Test\n---\n')).toBeNull();
  });

  it('uses custom field name', () => {
    const content = '---\ndate_created: 2024-06-01\n---\n';
    expect(extractCreatedDate(content, 'date_created')).toBe('2024-06-01');
  });
});

describe('parseFlexibleDate', () => {
  it('parses YYYY-MM-DD', () => {
    expect(parseFlexibleDate('2024-01-15')).toBe('2024-01-15');
  });

  it('parses ISO datetime', () => {
    expect(parseFlexibleDate('2024-01-15T10:30:00')).toBe('2024-01-15');
  });

  it('returns null for unparseable', () => {
    expect(parseFlexibleDate('not a date')).toBeNull();
  });
});

describe('extractPreview', () => {
  it('extracts plain text from markdown', () => {
    const content = '---\ntitle: Test\n---\n# Heading\nSome **bold** and *italic* text.';
    const preview = extractPreview(content);
    expect(preview).toContain('Heading');
    expect(preview).toContain('bold');
    expect(preview).not.toContain('**');
    expect(preview).not.toContain('*');
  });

  it('truncates at maxLength', () => {
    const content = '---\ncreated: 2024-01-01\n---\n' + 'A'.repeat(500);
    const preview = extractPreview(content, 100);
    expect(preview.length).toBeLessThanOrEqual(103); // +3 for "..."
  });

  it('strips images and links', () => {
    const content = '---\ncreated: 2024-01-01\n---\n![alt](img.png) [link](url)';
    const preview = extractPreview(content);
    expect(preview).not.toContain('![');
    expect(preview).toContain('link');
    expect(preview).not.toContain('](');
  });

  it('strips wikilinks keeping display text', () => {
    const content = '---\ncreated: 2024-01-01\n---\n[[note|Display Text]]';
    const preview = extractPreview(content);
    expect(preview).toContain('Display Text');
  });

  it('strips code blocks', () => {
    const content = '---\ncreated: 2024-01-01\n---\nBefore\n```js\nconst x = 1;\n```\nAfter';
    const preview = extractPreview(content);
    expect(preview).toContain('Before');
    expect(preview).toContain('After');
    expect(preview).not.toContain('const');
  });
});

describe('extractTags', () => {
  it('extracts array tags', () => {
    const content = '---\ntags: [work, project, done]\n---\n';
    expect(extractTags(content)).toEqual(['work', 'project', 'done']);
  });

  it('extracts comma-separated tags', () => {
    const content = '---\ntags: work, project\n---\n';
    expect(extractTags(content)).toEqual(['work', 'project']);
  });

  it('returns empty for no tags', () => {
    expect(extractTags('---\ntitle: Test\n---\n')).toEqual([]);
  });
});

describe('extractTitle', () => {
  it('prefers frontmatter title', () => {
    const content = '---\ntitle: "My Title"\n---\n# Heading';
    expect(extractTitle(content, 'note.md')).toBe('My Title');
  });

  it('falls back to first heading', () => {
    const content = '---\ncreated: 2024-01-01\n---\n# First Heading\nContent';
    expect(extractTitle(content, 'note.md')).toBe('First Heading');
  });

  it('falls back to filename', () => {
    expect(extractTitle('Just text', 'folder/my-note.md')).toBe('my-note');
  });
});

describe('generateCreatedFrontmatter', () => {
  it('generates frontmatter with date', () => {
    const result = generateCreatedFrontmatter('created', new Date('2024-06-15'));
    expect(result).toContain('created: 2024-06-15');
    expect(result).toMatch(/^---\n/);
    expect(result).toMatch(/\n---\n$/);
  });
});

describe('ensureCreatedField', () => {
  it('adds field to existing frontmatter', () => {
    const content = '---\ntitle: Test\n---\n# Body';
    const result = ensureCreatedField(content, 'created', '2024-06-15');
    expect(result).toContain('created: 2024-06-15');
    expect(result).toContain('title: Test');
  });

  it('prepends frontmatter if none exists', () => {
    const content = '# Just a heading';
    const result = ensureCreatedField(content, 'created', '2024-06-15');
    expect(result).toContain('---\ncreated: 2024-06-15\n---');
    expect(result).toContain('# Just a heading');
  });

  it('no-ops if field already exists', () => {
    const content = '---\ncreated: 2024-01-01\n---\n# Body';
    const result = ensureCreatedField(content, 'created', '2024-06-15');
    expect(result).toBe(content);
  });
});

describe('getFileType', () => {
  it('extracts extensions', () => {
    expect(getFileType('notes/hello.md')).toBe('md');
    expect(getFileType('path/to/file.canvas')).toBe('canvas');
    expect(getFileType('image.png')).toBe('png');
  });
});
