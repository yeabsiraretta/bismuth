/**
 * Unit tests for wikilink utility functions
 * @module lib/utils/__tests__/wikilink
 */

import { describe, it, expect } from 'vitest';
import {
  parseWikilink,
  extractWikilinks,
  hasWikilinks,
  isValidWikilink,
  wikilinkToMarkdown,
  resolveWikilink,
} from '../wikilink';
import type { Link } from '@/types/data/vault';

describe('parseWikilink', () => {
  it('should parse simple wikilink', () => {
    const result = parseWikilink('[[Note Title]]');
    expect(result).toEqual({
      source_path: '',
      target_title: 'Note Title',
      target_path: null,
      alias: undefined,
      is_resolved: false,
    });
  });

  it('should parse wikilink with alias', () => {
    const result = parseWikilink('[[Note Title|Display Text]]');
    expect(result).toEqual({
      source_path: '',
      target_title: 'Note Title',
      target_path: null,
      alias: 'Display Text',
      is_resolved: false,
    });
  });

  it('should return null for invalid wikilink', () => {
    const result = parseWikilink('[Invalid]');
    expect(result).toBeNull();
  });

  it('should trim whitespace', () => {
    const result = parseWikilink('[[  Note Title  |  Alias  ]]');
    expect(result?.target_title).toBe('Note Title');
    expect(result?.alias).toBe('Alias');
  });
});

describe('extractWikilinks', () => {
  it('should extract multiple wikilinks', () => {
    const content = 'See [[Note 1]] and [[Note 2|Link Text]]';
    const links = extractWikilinks(content, '/vault/test.md');

    expect(links).toHaveLength(2);
    expect(links[0].target_title).toBe('Note 1');
    expect(links[1].target_title).toBe('Note 2');
    expect(links[1].alias).toBe('Link Text');
  });

  it('should return empty array for no wikilinks', () => {
    const content = 'No links here';
    const links = extractWikilinks(content, '/vault/test.md');

    expect(links).toHaveLength(0);
  });

  it('should set sourcePath for all links', () => {
    const content = '[[Link 1]] and [[Link 2]]';
    const links = extractWikilinks(content, '/vault/source.md');

    expect(links[0].source_path).toBe('/vault/source.md');
    expect(links[1].source_path).toBe('/vault/source.md');
  });
});

describe('hasWikilinks', () => {
  it('should return true for text with wikilinks', () => {
    expect(hasWikilinks('This has a [[link]]')).toBe(true);
  });

  it('should return false for text without wikilinks', () => {
    expect(hasWikilinks('No links here')).toBe(false);
  });
});

describe('isValidWikilink', () => {
  it('should validate correct wikilink syntax', () => {
    expect(isValidWikilink('[[Valid Link]]')).toBe(true);
  });

  it('should reject empty wikilinks', () => {
    expect(isValidWikilink('[[]]')).toBe(false);
  });

  it('should reject invalid syntax', () => {
    expect(isValidWikilink('[Invalid]')).toBe(false);
    expect(isValidWikilink('[[Invalid')).toBe(false);
    expect(isValidWikilink('Invalid]]')).toBe(false);
  });
});

describe('wikilinkToMarkdown', () => {
  it('should convert wikilink to markdown', () => {
    const link: Link = {
      source_path: '/vault/source.md',
      target_title: 'Target',
      target_path: null,
      alias: null,
      is_resolved: false,
    };

    const result = wikilinkToMarkdown(link);
    expect(result).toBe('[Target](Target.md)');
  });

  it('should use alias if provided', () => {
    const link: Link = {
      source_path: '/vault/source.md',
      target_title: 'Target',
      target_path: null,
      alias: 'Display Text',
      is_resolved: false,
    };

    const result = wikilinkToMarkdown(link);
    expect(result).toBe('[Display Text](Target.md)');
  });

  it('should use targetPath if resolved', () => {
    const link: Link = {
      source_path: '/vault/source.md',
      target_title: 'Target',
      target_path: '/vault/notes/target.md',
      alias: null,
      is_resolved: true,
    };

    const result = wikilinkToMarkdown(link);
    expect(result).toBe('[Target](/vault/notes/target.md)');
  });
});

describe('resolveWikilink', () => {
  const notePaths = ['/vault/my-note.md', '/vault/another-note.md', '/vault/folder/deep-note.md'];

  it('should resolve exact match', () => {
    const result = resolveWikilink('My Note', notePaths);
    expect(result).toBe('/vault/my-note.md');
  });

  it('should handle case-insensitive matching', () => {
    const result = resolveWikilink('MY NOTE', notePaths);
    expect(result).toBe('/vault/my-note.md');
  });

  it('should handle spaces to dashes', () => {
    const result = resolveWikilink('Another Note', notePaths);
    expect(result).toBe('/vault/another-note.md');
  });

  it('should return null for no match', () => {
    const result = resolveWikilink('Nonexistent', notePaths);
    expect(result).toBeNull();
  });

  it('should fuzzy match partial titles', () => {
    const result = resolveWikilink('Deep', notePaths);
    expect(result).toBe('/vault/folder/deep-note.md');
  });
});
