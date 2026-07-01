import { describe, it, expect } from 'vitest';
import {
  flattenFrontmatterValues, parseMarkdownLinks, extractFrontmatterLinks,
} from '../services/frontmatterLinks';

describe('flattenFrontmatterValues', () => {
  it('extracts flat string values', () => {
    const result = flattenFrontmatterValues({ title: 'Hello', count: 5 });
    expect(result).toEqual([{ key: 'title', value: 'Hello' }]);
  });

  it('extracts nested values', () => {
    const result = flattenFrontmatterValues({ meta: { author: 'Alice' } });
    expect(result).toEqual([{ key: 'meta.author', value: 'Alice' }]);
  });

  it('extracts array values', () => {
    const result = flattenFrontmatterValues({ refs: ['a.md', 'b.md'] });
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('refs[0]');
    expect(result[0].value).toBe('a.md');
  });

  it('handles mixed nested arrays and objects', () => {
    const result = flattenFrontmatterValues({
      links: [{ url: 'path.md' }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('links[0].url');
  });

  it('returns empty for no strings', () => {
    const result = flattenFrontmatterValues({ num: 42, bool: true });
    expect(result).toHaveLength(0);
  });
});

describe('parseMarkdownLinks', () => {
  it('extracts markdown links from string', () => {
    const links = parseMarkdownLinks('[My Note](path/to/note.md)', 'ref');
    expect(links).toHaveLength(1);
    expect(links[0].title).toBe('My Note');
    expect(links[0].targetPath).toBe('path/to/note.md');
    expect(links[0].key).toBe('ref');
  });

  it('extracts multiple links', () => {
    const links = parseMarkdownLinks(
      '[A](a.md) and [B](b.md)',
      'refs',
    );
    expect(links).toHaveLength(2);
  });

  it('returns empty for no links', () => {
    const links = parseMarkdownLinks('plain text', 'key');
    expect(links).toHaveLength(0);
  });

  it('only matches .md file links', () => {
    const links = parseMarkdownLinks('[pic](image.png)', 'key');
    expect(links).toHaveLength(0);
  });
});

describe('extractFrontmatterLinks', () => {
  it('extracts links from frontmatter', () => {
    const links = extractFrontmatterLinks({
      reference: '[See this](notes/ref.md)',
    });
    expect(links).toHaveLength(1);
    expect(links[0].targetPath).toBe('notes/ref.md');
  });

  it('handles nested frontmatter', () => {
    const links = extractFrontmatterLinks({
      meta: { source: '[Original](source.md)' },
    });
    expect(links).toHaveLength(1);
    expect(links[0].key).toBe('meta.source');
  });

  it('returns empty for null/undefined', () => {
    expect(extractFrontmatterLinks(null)).toEqual([]);
    expect(extractFrontmatterLinks(undefined)).toEqual([]);
  });

  it('returns empty for no links in frontmatter', () => {
    expect(extractFrontmatterLinks({ title: 'Hello' })).toEqual([]);
  });
});
