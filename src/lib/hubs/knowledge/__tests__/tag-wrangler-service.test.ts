import { describe, expect, it } from 'vitest';

import {
  detectMerge,
  findNotesWithTag,
  findTagLocations,
  findTagPage,
  generateTagPageContent,
  getChildTags,
  getParentTag,
  getTagLeaf,
  isTagPage,
  renameFrontmatterTags,
  renameInlineTags,
  renameTagsInContent,
} from '@/hubs/knowledge/services/tag-wrangler-service';

// ── Inline Tag Rename ────────────────────────────────────────────

describe('renameInlineTags', () => {
  it('renames a simple tag', () => {
    const { content, count } = renameInlineTags('Hello #foo world', 'foo', 'bar');
    expect(content).toBe('Hello #bar world');
    expect(count).toBe(1);
  });

  it('renames multiple occurrences', () => {
    const { content, count } = renameInlineTags('#foo and #foo again', 'foo', 'bar');
    expect(content).toBe('#bar and #bar again');
    expect(count).toBe(2);
  });

  it('renames subtags', () => {
    const { content, count } = renameInlineTags(
      '#project/web and #project/mobile',
      'project',
      'work'
    );
    expect(content).toBe('#work/web and #work/mobile');
    expect(count).toBe(2);
  });

  it('is case-insensitive', () => {
    const { content, count } = renameInlineTags('#FOO test', 'foo', 'bar');
    expect(content).toBe('#bar test');
    expect(count).toBe(1);
  });

  it('does not rename unrelated tags', () => {
    const { content, count } = renameInlineTags('#foobar #baz', 'foo', 'bar');
    expect(content).toBe('#foobar #baz');
    expect(count).toBe(0);
  });

  it('handles tag at start of line', () => {
    const { content, count } = renameInlineTags('#alpha content', 'alpha', 'beta');
    expect(content).toBe('#beta content');
    expect(count).toBe(1);
  });

  it('handles nested subtag rename', () => {
    const { content } = renameInlineTags('#a/b/c', 'a/b', 'x/y');
    expect(content).toBe('#x/y/c');
  });

  it('returns count 0 for no matches', () => {
    const { count } = renameInlineTags('no tags here', 'foo', 'bar');
    expect(count).toBe(0);
  });
});

// ── Frontmatter Tag Rename ───────────────────────────────────────

describe('renameFrontmatterTags', () => {
  it('renames inline array tags', () => {
    const content = '---\ntags: [foo, bar]\n---\nbody';
    const result = renameFrontmatterTags(content, 'foo', 'baz');
    expect(result.content).toContain('baz');
    expect(result.count).toBe(1);
  });

  it('renames comma-separated tags', () => {
    const content = '---\ntags: foo, bar\n---\nbody';
    const result = renameFrontmatterTags(content, 'foo', 'baz');
    expect(result.content).toContain('baz');
    expect(result.count).toBe(1);
  });

  it('renames YAML list tags', () => {
    const content = '---\ntags:\n  - foo\n  - bar\n---\nbody';
    const result = renameFrontmatterTags(content, 'foo', 'baz');
    expect(result.content).toContain('baz');
    expect(result.count).toBe(1);
  });

  it('renames subtags in frontmatter', () => {
    const content = '---\ntags: [project/web]\n---\nbody';
    const result = renameFrontmatterTags(content, 'project', 'work');
    expect(result.content).toContain('work/web');
    expect(result.count).toBe(1);
  });

  it('returns count 0 for no frontmatter', () => {
    const result = renameFrontmatterTags('no frontmatter here', 'foo', 'bar');
    expect(result.count).toBe(0);
  });

  it('returns count 0 for no matching tags', () => {
    const content = '---\ntags: [alpha]\n---\nbody';
    const result = renameFrontmatterTags(content, 'foo', 'bar');
    expect(result.count).toBe(0);
  });
});

// ── Full Document Rename ─────────────────────────────────────────

describe('renameTagsInContent', () => {
  it('renames both inline and frontmatter tags', () => {
    const content = '---\ntags: [status]\n---\n#status and #status/done';
    const result = renameTagsInContent(content, 'status', 'state');
    expect(result.content).toContain('state');
    expect(result.totalReplacements).toBeGreaterThan(0);
  });

  it('renames subtags in body and frontmatter', () => {
    const content = '---\ntags: [project/web]\n---\n#project/web is here';
    const result = renameTagsInContent(content, 'project', 'work');
    expect(result.content).toContain('work/web');
    expect(result.totalReplacements).toBeGreaterThanOrEqual(2);
  });
});

// ── Tag Location Finder ──────────────────────────────────────────

describe('findTagLocations', () => {
  it('finds inline tags', () => {
    const content = 'Hello #test world\nSecond line\n#test again';
    const locations = findTagLocations(content, 'test', 'note.md', 'Note');
    expect(locations.length).toBe(2);
    expect(locations[0].lineNumber).toBe(1);
    expect(locations[0].type).toBe('inline');
    expect(locations[1].lineNumber).toBe(3);
  });

  it('finds frontmatter tags', () => {
    const content = '---\ntags: [test, other]\n---\nbody';
    const locations = findTagLocations(content, 'test', 'note.md', 'Note');
    expect(locations.length).toBeGreaterThan(0);
    expect(locations[0].type).toBe('frontmatter');
  });

  it('finds subtag matches', () => {
    const content = 'Hello #project/web here';
    const locations = findTagLocations(content, 'project', 'note.md', 'Note');
    expect(locations.length).toBe(1);
  });

  it('returns empty for no matches', () => {
    expect(findTagLocations('no tags', 'missing', 'n.md', 'N')).toHaveLength(0);
  });
});

// ── Find Notes With Tag ──────────────────────────────────────────

describe('findNotesWithTag', () => {
  const notes = [
    { path: 'a.md', title: 'A', content: '#shared #unique-a' },
    { path: 'b.md', title: 'B', content: '#shared content' },
    { path: 'c.md', title: 'C', content: 'no tags here' },
  ];

  it('finds notes containing the tag', () => {
    const result = findNotesWithTag(notes, 'shared');
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.path)).toContain('a.md');
    expect(result.map((r) => r.path)).toContain('b.md');
  });

  it('does not include notes without the tag', () => {
    const result = findNotesWithTag(notes, 'unique-a');
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('a.md');
  });

  it('returns empty for missing tag', () => {
    expect(findNotesWithTag(notes, 'nonexistent')).toHaveLength(0);
  });

  it('sorts by count descending', () => {
    const multiNotes = [
      { path: 'x.md', title: 'X', content: '#foo #foo #foo' },
      { path: 'y.md', title: 'Y', content: '#foo' },
    ];
    const result = findNotesWithTag(multiNotes, 'foo');
    expect(result[0].path).toBe('x.md');
    expect(result[0].count).toBeGreaterThan(result[1].count);
  });
});

// ── Tag Page ─────────────────────────────────────────────────────

describe('isTagPage', () => {
  it('detects tag alias in frontmatter', () => {
    const content = '---\naliases: ["#myTag"]\n---\nbody';
    expect(isTagPage(content, 'myTag')).toBe(true);
  });

  it('detects alias in array format', () => {
    const content = '---\nalias: ["#test"]\n---\nbody';
    expect(isTagPage(content, 'test')).toBe(true);
  });

  it('detects case-insensitive alias', () => {
    const content = '---\naliases: ["#MyTag"]\n---\nbody';
    expect(isTagPage(content, 'mytag')).toBe(true);
  });

  it('returns false when no alias matches', () => {
    const content = '---\naliases: ["#other"]\n---\nbody';
    expect(isTagPage(content, 'myTag')).toBe(false);
  });

  it('returns false for no frontmatter', () => {
    expect(isTagPage('no frontmatter', 'tag')).toBe(false);
  });

  it('detects YAML list aliases', () => {
    const content = '---\naliases:\n  - "#project"\n---\nbody';
    expect(isTagPage(content, 'project')).toBe(true);
  });
});

describe('findTagPage', () => {
  it('finds existing tag page', () => {
    const notes = [
      { path: 'a.md', title: 'A', content: '---\naliases: ["#foo"]\n---\nbody' },
      { path: 'b.md', title: 'B', content: 'regular note' },
    ];
    const result = findTagPage(notes, 'foo');
    expect(result).not.toBeNull();
    expect(result!.path).toBe('a.md');
  });

  it('returns null when no tag page exists', () => {
    const notes = [{ path: 'a.md', title: 'A', content: 'regular note' }];
    expect(findTagPage(notes, 'missing')).toBeNull();
  });
});

describe('generateTagPageContent', () => {
  it('generates valid frontmatter with alias and tag', () => {
    const content = generateTagPageContent('project/web');
    expect(content).toContain('aliases: ["#project/web"]');
    expect(content).toContain('tags: [project/web]');
    expect(content).toContain('# project/web');
  });
});

// ── Merge Detection ──────────────────────────────────────────────

describe('detectMerge', () => {
  it('detects simple merge', () => {
    const merges = detectMerge(['foo', 'bar'], 'foo', 'bar');
    expect(merges).toContain('bar');
  });

  it('detects subtag merge', () => {
    const merges = detectMerge(['a/b', 'c/b'], 'a', 'c');
    expect(merges).toContain('c/b');
  });

  it('returns empty when no merge', () => {
    const merges = detectMerge(['foo', 'bar'], 'foo', 'baz');
    expect(merges).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const merges = detectMerge(['Foo', 'bar'], 'foo', 'bar');
    expect(merges).toContain('bar');
  });
});

// ── Subtag Utilities ─────────────────────────────────────────────

describe('getChildTags', () => {
  it('returns child tags', () => {
    const children = getChildTags(['project', 'project/web', 'project/mobile', 'other'], 'project');
    expect(children).toContain('project/web');
    expect(children).toContain('project/mobile');
    expect(children).not.toContain('other');
    expect(children).not.toContain('project');
  });

  it('returns empty for no children', () => {
    expect(getChildTags(['alpha', 'beta'], 'alpha')).toHaveLength(0);
  });
});

describe('getParentTag', () => {
  it('returns parent for nested tag', () => {
    expect(getParentTag('project/web')).toBe('project');
  });

  it('returns parent for deeply nested tag', () => {
    expect(getParentTag('a/b/c')).toBe('a/b');
  });

  it('returns null for root tag', () => {
    expect(getParentTag('root')).toBeNull();
  });
});

describe('getTagLeaf', () => {
  it('returns leaf name', () => {
    expect(getTagLeaf('project/web')).toBe('web');
  });

  it('returns leaf for deep tag', () => {
    expect(getTagLeaf('a/b/c')).toBe('c');
  });

  it('returns full name for root tag', () => {
    expect(getTagLeaf('simple')).toBe('simple');
  });
});
