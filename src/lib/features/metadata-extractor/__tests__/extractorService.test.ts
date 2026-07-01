import { describe, it, expect } from 'vitest';
import {
  extractTags,
  extractHeadings,
  extractLinks,
  extractAliases,
  buildTagExport,
  buildMetadataExport,
  buildBacklinksMap,
  buildNonMdExport,
  buildCanvasExport,
} from '../services/extractorService';

const note = (path: string, content: string, frontmatter: Record<string, unknown> = {}) => ({
  path, title: path.split('/').pop()?.replace('.md', '') || '', content, frontmatter,
});

// ─── extractTags ───────────────────────────────────────────────────────────────

describe('extractTags', () => {
  it('extracts inline tags', () => {
    expect(extractTags('Hello #world #test', {})).toEqual(['test', 'world']);
  });

  it('extracts frontmatter tags array', () => {
    expect(extractTags('', { tags: ['Alpha', 'Beta'] })).toEqual(['alpha', 'beta']);
  });

  it('extracts frontmatter tags string', () => {
    expect(extractTags('', { tags: 'solo' })).toEqual(['solo']);
  });

  it('merges inline + frontmatter, deduplicates', () => {
    const tags = extractTags('#alpha content', { tags: ['Alpha', 'beta'] });
    expect(tags).toEqual(['alpha', 'beta']);
  });

  it('skips tags inside code blocks', () => {
    const content = '```\n#notag\n```\n#real';
    const tags = extractTags(content, {});
    expect(tags).toContain('real');
    expect(tags).not.toContain('notag');
  });

  it('handles nested/hierarchical tags', () => {
    expect(extractTags('#parent/child', {})).toEqual(['parent/child']);
  });

  it('strips # prefix from frontmatter tags', () => {
    expect(extractTags('', { tags: ['#hashprefixed'] })).toEqual(['hashprefixed']);
  });

  it('returns empty for no tags', () => {
    expect(extractTags('No tags here', {})).toEqual([]);
  });
});

// ─── extractHeadings ───────────────────────────────────────────────────────────

describe('extractHeadings', () => {
  it('extracts headings with levels', () => {
    const content = '# Title\n## Subtitle\n### H3';
    const headings = extractHeadings(content);
    expect(headings).toEqual([
      { heading: 'Title', level: 1 },
      { heading: 'Subtitle', level: 2 },
      { heading: 'H3', level: 3 },
    ]);
  });

  it('ignores headings inside code blocks', () => {
    const content = '```\n# Not a heading\n```\n# Real heading';
    const headings = extractHeadings(content);
    expect(headings).toHaveLength(1);
    expect(headings[0].heading).toBe('Real heading');
  });

  it('returns empty for no headings', () => {
    expect(extractHeadings('Just text')).toEqual([]);
  });
});

// ─── extractLinks ──────────────────────────────────────────────────────────────

describe('extractLinks', () => {
  const allPaths = new Map([
    ['note a', 'folder/Note A.md'],
    ['note b', 'Note B.md'],
  ]);

  it('extracts simple wikilinks', () => {
    const links = extractLinks('Link to [[Note A]]', allPaths);
    expect(links).toHaveLength(1);
    expect(links[0].link).toBe('Note A');
    expect(links[0].relativePath).toBe('folder/Note A.md');
  });

  it('extracts aliased wikilinks', () => {
    const links = extractLinks('[[Note A|My Alias]]', allPaths);
    expect(links[0].link).toBe('Note A');
    expect(links[0].displayText).toBe('My Alias');
  });

  it('extracts heading links with cleanLink', () => {
    const links = extractLinks('[[Note A#Section]]', allPaths);
    expect(links[0].link).toBe('Note A#Section');
    expect(links[0].cleanLink).toBe('Note A');
    expect(links[0].displayText).toBe('Section');
  });

  it('handles links to non-existing notes', () => {
    const links = extractLinks('[[Does Not Exist]]', allPaths);
    expect(links[0].link).toBe('Does Not Exist');
    expect(links[0].relativePath).toBeUndefined();
  });

  it('returns empty for no links', () => {
    expect(extractLinks('No links here', allPaths)).toEqual([]);
  });
});

// ─── extractAliases ────────────────────────────────────────────────────────────

describe('extractAliases', () => {
  it('extracts array aliases', () => {
    expect(extractAliases({ aliases: ['Foo', 'Bar'] })).toEqual(['Foo', 'Bar']);
  });

  it('extracts string alias', () => {
    expect(extractAliases({ aliases: 'Single' })).toEqual(['Single']);
  });

  it('returns undefined for no aliases', () => {
    expect(extractAliases({})).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(extractAliases({ aliases: [] })).toBeUndefined();
  });
});

// ─── buildTagExport ────────────────────────────────────────────────────────────

describe('buildTagExport', () => {
  it('builds tag-to-file mapping', () => {
    const notes = [
      note('a.md', '#test #alpha'),
      note('b.md', '#test #beta'),
      note('c.md', '#alpha'),
    ];
    const result = buildTagExport(notes);

    const testTag = result.find(t => t.tag === 'test');
    expect(testTag).toBeDefined();
    expect(testTag!.tagCount).toBe(2);
    expect(testTag!.relativePaths).toContain('a.md');
    expect(testTag!.relativePaths).toContain('b.md');

    const alphaTag = result.find(t => t.tag === 'alpha');
    expect(alphaTag!.tagCount).toBe(2);
  });

  it('sorts by tagCount descending', () => {
    const notes = [
      note('a.md', '#common #rare'),
      note('b.md', '#common'),
      note('c.md', '#common'),
    ];
    const result = buildTagExport(notes);
    expect(result[0].tag).toBe('common');
  });

  it('handles no tags', () => {
    expect(buildTagExport([note('a.md', 'no tags')])).toEqual([]);
  });
});

// ─── buildMetadataExport ───────────────────────────────────────────────────────

describe('buildMetadataExport', () => {
  it('builds metadata for each note', () => {
    const notes = [
      note('folder/Note A.md', '# Title\n\nContent with #tag and [[Note B]]', { aliases: ['Alias'] }),
      note('Note B.md', 'Backlink target'),
    ];
    const result = buildMetadataExport(notes);

    expect(result).toHaveLength(2);

    const noteA = result.find(r => r.fileName === 'Note A');
    expect(noteA).toBeDefined();
    expect(noteA!.relativePath).toBe('folder/Note A.md');
    expect(noteA!.tags).toContain('tag');
    expect(noteA!.headings).toEqual([{ heading: 'Title', level: 1 }]);
    expect(noteA!.aliases).toEqual(['Alias']);
    expect(noteA!.links).toHaveLength(1);
    expect(noteA!.links![0].link).toBe('Note B');

    const noteB = result.find(r => r.fileName === 'Note B');
    expect(noteB!.backlinks).toHaveLength(1);
    expect(noteB!.backlinks![0].fileName).toBe('Note A');
  });

  it('omits empty optional fields', () => {
    const result = buildMetadataExport([note('simple.md', 'Just text')]);
    expect(result[0].tags).toBeUndefined();
    expect(result[0].headings).toBeUndefined();
    expect(result[0].links).toBeUndefined();
    expect(result[0].backlinks).toBeUndefined();
    expect(result[0].frontmatter).toBeUndefined();
  });

  it('includes frontmatter when present', () => {
    const result = buildMetadataExport([
      note('fm.md', 'text', { publish: true, tags: ['test'] }),
    ]);
    expect(result[0].frontmatter).toBeDefined();
    expect(result[0].frontmatter!['publish']).toBe(true);
  });
});

// ─── buildBacklinksMap ─────────────────────────────────────────────────────────

describe('buildBacklinksMap', () => {
  it('maps backlinks correctly', () => {
    const allPaths = new Map([['note b', 'Note B.md']]);
    const notes = [
      { path: 'Note A.md', title: 'Note A', content: '[[Note B]]', frontmatter: {} },
    ];
    const map = buildBacklinksMap(notes, allPaths);
    expect(map.has('Note B.md')).toBe(true);
    expect(map.get('Note B.md')![0].fileName).toBe('Note A');
  });

  it('skips unresolved links', () => {
    const allPaths = new Map<string, string>();
    const notes = [
      { path: 'A.md', title: 'A', content: '[[NonExistent]]', frontmatter: {} },
    ];
    const map = buildBacklinksMap(notes, allPaths);
    expect(map.size).toBe(0);
  });
});

// ─── buildNonMdExport ──────────────────────────────────────────────────────────

describe('buildNonMdExport', () => {
  it('builds folders and files', () => {
    const result = buildNonMdExport(
      ['assets', 'images/photos'],
      [{ name: 'logo.png', relativePath: 'assets/logo.png' }],
    );
    expect(result.folders).toHaveLength(2);
    expect(result.folders[0]).toEqual({ name: 'assets', relativePath: 'assets' });
    expect(result.nonMdFiles).toHaveLength(1);
    expect(result.nonMdFiles![0].basename).toBe('logo');
  });

  it('omits nonMdFiles when empty', () => {
    const result = buildNonMdExport(['folder'], []);
    expect(result.nonMdFiles).toBeUndefined();
  });
});

// ─── buildCanvasExport ─────────────────────────────────────────────────────────

describe('buildCanvasExport', () => {
  it('builds canvas entries', () => {
    const result = buildCanvasExport([
      { name: 'my-canvas.canvas', relativePath: 'Inbox/my-canvas.canvas' },
    ]);
    expect(result).toEqual([{
      name: 'my-canvas.canvas',
      basename: 'my-canvas',
      relativePath: 'Inbox/my-canvas.canvas',
    }]);
  });

  it('handles empty array', () => {
    expect(buildCanvasExport([])).toEqual([]);
  });
});
