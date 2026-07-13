import { describe, expect, it } from 'vitest';

import { buildFrontmatter, extractMetadata } from '@/hubs/editor/services/metadata-extractor';

describe('extractMetadata', () => {
  it('extracts title from frontmatter', () => {
    const content = '---\ntitle: My Note\n---\n\nBody text';
    const meta = extractMetadata(content);
    expect(meta.title).toBe('My Note');
  });

  it('extracts title from h1 when no frontmatter', () => {
    const content = '# My Note\n\nBody text';
    const meta = extractMetadata(content);
    expect(meta.title).toBe('My Note');
  });

  it('falls back to h1 when frontmatter has no title', () => {
    const content = '---\ntags: [a, b]\n---\n\n# Heading Title\n\nBody';
    const meta = extractMetadata(content);
    expect(meta.title).toBe('Heading Title');
  });

  it('extracts inline tags array', () => {
    const content = '---\ntags: [foo, bar, baz]\n---\n';
    const meta = extractMetadata(content);
    expect(meta.tags).toEqual(['foo', 'bar', 'baz']);
  });

  it('extracts multiline tags list', () => {
    const content = '---\ntags:\n  - alpha\n  - beta\n---\n';
    const meta = extractMetadata(content);
    expect(meta.tags).toEqual(['alpha', 'beta']);
  });

  it('extracts comma-separated tags string', () => {
    const content = '---\ntags: one, two\n---\n';
    const meta = extractMetadata(content);
    expect(meta.tags).toEqual(['one', 'two']);
  });

  it('extracts aliases', () => {
    const content = '---\naliases: [alt1, alt2]\n---\n';
    const meta = extractMetadata(content);
    expect(meta.aliases).toEqual(['alt1', 'alt2']);
  });

  it('extracts created and modified dates', () => {
    const content = '---\ncreated: 2026-01-01\nmodified: 2026-07-06\n---\n';
    const meta = extractMetadata(content);
    expect(meta.created).toBe('2026-01-01');
    expect(meta.modified).toBe('2026-07-06');
  });

  it('extracts date as fallback for created', () => {
    const content = '---\ndate: 2025-12-25\n---\n';
    const meta = extractMetadata(content);
    expect(meta.created).toBe('2025-12-25');
  });

  it('extracts updated as fallback for modified', () => {
    const content = '---\nupdated: 2026-03-15\n---\n';
    const meta = extractMetadata(content);
    expect(meta.modified).toBe('2026-03-15');
  });

  it('collects custom keys', () => {
    const content = '---\ntitle: Test\ncategory: research\npriority: high\n---\n';
    const meta = extractMetadata(content);
    expect(meta.custom).toEqual({ category: 'research', priority: 'high' });
  });

  it('strips quotes from values', () => {
    const content = '---\ntitle: "Quoted Title"\n---\n';
    const meta = extractMetadata(content);
    expect(meta.title).toBe('Quoted Title');
  });

  it('returns empty metadata for content without frontmatter or headings', () => {
    const content = 'Just some plain text.';
    const meta = extractMetadata(content);
    expect(meta.title).toBe('');
    expect(meta.tags).toEqual([]);
    expect(meta.aliases).toEqual([]);
  });

  it('handles empty content', () => {
    const meta = extractMetadata('');
    expect(meta.title).toBe('');
    expect(meta.tags).toEqual([]);
  });
});

describe('buildFrontmatter', () => {
  it('builds frontmatter with title', () => {
    const fm = buildFrontmatter({
      title: 'Hello',
      tags: [],
      aliases: [],
      created: '',
      modified: '',
      custom: {},
    });
    expect(fm).toBe('---\ntitle: "Hello"\n---');
  });

  it('builds frontmatter with tags and aliases', () => {
    const fm = buildFrontmatter({
      title: '',
      tags: ['a', 'b'],
      aliases: ['x'],
      created: '',
      modified: '',
      custom: {},
    });
    expect(fm).toContain('tags: [a, b]');
    expect(fm).toContain('aliases: [x]');
  });

  it('includes dates when present', () => {
    const fm = buildFrontmatter({
      title: 'Test',
      tags: [],
      aliases: [],
      created: '2026-01-01',
      modified: '2026-07-06',
      custom: {},
    });
    expect(fm).toContain('created: 2026-01-01');
    expect(fm).toContain('modified: 2026-07-06');
  });

  it('includes custom keys', () => {
    const fm = buildFrontmatter({
      title: 'Test',
      tags: [],
      aliases: [],
      created: '',
      modified: '',
      custom: { status: 'draft', priority: 'high' },
    });
    expect(fm).toContain('status: draft');
    expect(fm).toContain('priority: high');
  });

  it('round-trips through extractMetadata', () => {
    const original = {
      title: 'Round Trip',
      tags: ['a', 'b'],
      aliases: ['rt'],
      created: '2026-01-01',
      modified: '2026-07-06',
      custom: { status: 'published' },
    };
    const fm = buildFrontmatter(original);
    const body = '\n\nSome body text.';
    const extracted = extractMetadata(fm + body);
    expect(extracted.title).toBe('Round Trip');
    expect(extracted.tags).toEqual(['a', 'b']);
    expect(extracted.aliases).toEqual(['rt']);
    expect(extracted.created).toBe('2026-01-01');
    expect(extracted.modified).toBe('2026-07-06');
    expect(extracted.custom['status']).toBe('published');
  });
});
