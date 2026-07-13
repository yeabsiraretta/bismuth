import { describe, expect, it } from 'vitest';

import {
  aggregateTags,
  buildTagHierarchy,
  extractAllTags,
  extractFrontmatterTags,
  extractInlineTags,
} from '@/hubs/knowledge/services/tag-extractor';

describe('extractInlineTags', () => {
  it('extracts #tags from content', () => {
    expect(extractInlineTags('Hello #world #test')).toEqual(['world', 'test']);
  });

  it('handles nested tags with /', () => {
    expect(extractInlineTags('#project/web')).toEqual(['project/web']);
  });

  it('returns empty for no tags', () => {
    expect(extractInlineTags('plain text')).toEqual([]);
  });

  it('does not extract # preceded by non-whitespace (e.g. backtick)', () => {
    expect(extractInlineTags('use `#hash` in code')).toEqual([]);
  });
});

describe('extractFrontmatterTags', () => {
  it('extracts inline array tags', () => {
    const content = '---\ntags: [work, urgent]\n---\nBody';
    expect(extractFrontmatterTags(content)).toEqual(['work', 'urgent']);
  });

  it('extracts comma-separated tags', () => {
    const content = '---\ntags: alpha, beta\n---\nBody';
    expect(extractFrontmatterTags(content)).toEqual(['alpha', 'beta']);
  });

  it('extracts YAML list tags', () => {
    const content = '---\ntags:\n  - one\n  - two\n---\nBody';
    expect(extractFrontmatterTags(content)).toEqual(['one', 'two']);
  });

  it('returns empty for no frontmatter', () => {
    expect(extractFrontmatterTags('No frontmatter here')).toEqual([]);
  });

  it('returns empty for no tags field', () => {
    expect(extractFrontmatterTags('---\ntitle: Test\n---\nBody')).toEqual([]);
  });
});

describe('extractAllTags', () => {
  it('combines frontmatter and inline tags', () => {
    const content = '---\ntags: [fm]\n---\n#inline';
    const tags = extractAllTags(content);
    expect(tags).toContain('fm');
    expect(tags).toContain('inline');
  });
});

describe('aggregateTags', () => {
  it('counts tags across notes', () => {
    const notes = [{ content: '#shared #a' }, { content: '#shared #b' }];
    const result = aggregateTags(notes);
    const shared = result.find((t) => t.tag === 'shared');
    expect(shared?.count).toBe(2);
  });

  it('sorts by count descending', () => {
    const notes = [{ content: '#rare' }, { content: '#common #common' }];
    const result = aggregateTags(notes);
    expect(result[0].tag).toBe('common');
  });
});

describe('buildTagHierarchy', () => {
  it('builds flat tags as roots', () => {
    const roots = buildTagHierarchy([
      { tag: 'alpha', count: 1 },
      { tag: 'beta', count: 1 },
    ]);
    expect(roots).toHaveLength(2);
  });

  it('nests child under parent', () => {
    const roots = buildTagHierarchy([
      { tag: 'project', count: 2 },
      { tag: 'project/web', count: 1 },
    ]);
    expect(roots).toHaveLength(1);
    expect(roots[0].name).toBe('project');
    expect(roots[0].children).toHaveLength(1);
    expect(roots[0].children[0].name).toBe('project/web');
  });

  it('keeps orphan children as roots if parent not present', () => {
    const roots = buildTagHierarchy([{ tag: 'deep/nested/tag', count: 1 }]);
    expect(roots).toHaveLength(1);
    expect(roots[0].name).toBe('deep/nested/tag');
  });
});
