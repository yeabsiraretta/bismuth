import { describe, it, expect } from 'vitest';
import {
  BacklinkCache, hashContent, extractWikilinks, extractMarkdownLinks,
} from '../services/backlinkCache';
import type { NoteInput } from '../services/backlinkCache';

describe('hashContent', () => {
  it('produces consistent hashes', () => {
    expect(hashContent('hello')).toBe(hashContent('hello'));
  });

  it('different strings produce different hashes', () => {
    expect(hashContent('hello')).not.toBe(hashContent('world'));
  });

  it('handles empty string', () => {
    expect(hashContent('')).toBe(5381);
  });
});

describe('extractWikilinks', () => {
  it('extracts simple wikilinks', () => {
    const links = extractWikilinks('See [[Note A]] and [[Note B]]');
    expect(links).toHaveLength(2);
    expect(links[0].target).toBe('Note A');
    expect(links[0].source).toBe('wikilink');
    expect(links[1].target).toBe('Note B');
  });

  it('extracts aliased wikilinks', () => {
    const links = extractWikilinks('[[Real Note|Display Text]]');
    expect(links).toHaveLength(1);
    expect(links[0].target).toBe('Real Note');
    expect(links[0].alias).toBe('Display Text');
  });

  it('handles heading links', () => {
    const links = extractWikilinks('See [[Note#Heading]]');
    expect(links).toHaveLength(1);
    expect(links[0].target).toBe('Note');
  });

  it('reports correct line numbers', () => {
    const links = extractWikilinks('Line 1\n[[A]]\nLine 3\n[[B]]');
    expect(links[0].line).toBe(2);
    expect(links[1].line).toBe(4);
  });

  it('includes context', () => {
    const links = extractWikilinks('Some context around [[Note]] link here');
    expect(links[0].context).toContain('Note');
  });
});

describe('extractMarkdownLinks', () => {
  it('extracts markdown links', () => {
    const links = extractMarkdownLinks('See [click here](notes/file.md)');
    expect(links).toHaveLength(1);
    expect(links[0].target).toBe('notes/file.md');
    expect(links[0].alias).toBe('click here');
  });

  it('skips http links', () => {
    const links = extractMarkdownLinks('[Google](https://google.com)');
    expect(links).toHaveLength(0);
  });

  it('skips anchor links', () => {
    const links = extractMarkdownLinks('[Section](#heading)');
    expect(links).toHaveLength(0);
  });
});

describe('BacklinkCache', () => {
  function makeNotes(): NoteInput[] {
    return [
      { path: 'a.md', title: 'Note A', content: 'Links to [[Note B]] and [[Note C]]' },
      { path: 'b.md', title: 'Note B', content: 'Links back to [[Note A]]' },
      { path: 'c.md', title: 'Note C', content: 'No outgoing links here' },
      { path: 'd.md', title: 'Note D', content: 'See [ref](a.md) for details' },
    ];
  }

  it('builds cache and finds backlinks', () => {
    const cache = new BacklinkCache();
    cache.buildFromNotes(makeNotes());

    const backlinksA = cache.getBacklinksForFile('a.md');
    expect(backlinksA.length).toBeGreaterThanOrEqual(1);
    expect(backlinksA.some(b => b.sourcePath === 'b.md')).toBe(true);
  });

  it('resolves title-based lookups', () => {
    const cache = new BacklinkCache();
    cache.buildFromNotes(makeNotes());

    const backlinksB = cache.getBacklinksForFile('b.md');
    expect(backlinksB.some(b => b.sourcePath === 'a.md')).toBe(true);
  });

  it('counts backlinks correctly', () => {
    const cache = new BacklinkCache();
    cache.buildFromNotes(makeNotes());

    expect(cache.getBacklinkCount('a.md')).toBeGreaterThanOrEqual(1);
  });

  it('detects markdown links', () => {
    const cache = new BacklinkCache();
    cache.buildFromNotes(makeNotes());

    const backlinksA = cache.getBacklinksForFile('a.md');
    expect(backlinksA.some(b => b.source === 'markdown')).toBe(true);
  });

  it('returns stats', () => {
    const cache = new BacklinkCache();
    cache.buildFromNotes(makeNotes());

    const stats = cache.getStats();
    expect(stats.totalFiles).toBe(4);
    expect(stats.totalLinks).toBeGreaterThan(0);
    expect(stats.isComplete).toBe(true);
    expect(stats.buildTime).toBeGreaterThanOrEqual(0);
  });

  it('incrementally updates on file change', () => {
    const cache = new BacklinkCache();
    cache.buildFromNotes(makeNotes());

    const changed = cache.updateFile({
      path: 'c.md', title: 'Note C', content: 'Now links to [[Note A]]',
    });
    expect(changed).toBe(true);

    const backlinksA = cache.getBacklinksForFile('a.md');
    expect(backlinksA.some(b => b.sourcePath === 'c.md')).toBe(true);
  });

  it('skips update when content unchanged', () => {
    const cache = new BacklinkCache();
    const notes = makeNotes();
    cache.buildFromNotes(notes);

    const changed = cache.updateFile(notes[0]);
    expect(changed).toBe(false);
  });

  it('removes file from cache', () => {
    const cache = new BacklinkCache();
    cache.buildFromNotes(makeNotes());

    cache.removeFile('a.md');
    const paths = cache.getCachedPaths();
    expect(paths).not.toContain('a.md');
  });

  it('clears entire cache', () => {
    const cache = new BacklinkCache();
    cache.buildFromNotes(makeNotes());

    cache.clear();
    expect(cache.getStats().totalFiles).toBe(0);
    expect(cache.getCachedPaths()).toHaveLength(0);
  });

  it('hasBacklinks returns correct boolean', () => {
    const cache = new BacklinkCache();
    cache.buildFromNotes(makeNotes());

    expect(cache.hasBacklinks('a.md')).toBe(true);
  });

  it('handles frontmatter links', () => {
    const cache = new BacklinkCache({ includeFrontmatterLinks: true });
    cache.buildFromNotes([
      { path: 'a.md', title: 'A', content: 'Hello', frontmatter: { ref: '[link](b.md)' } },
      { path: 'b.md', title: 'B', content: 'World' },
    ]);

    const backlinksB = cache.getBacklinksForFile('b.md');
    expect(backlinksB.some(b => b.source === 'frontmatter')).toBe(true);
  });

  it('handles canvas links', () => {
    const canvasJson = JSON.stringify({
      nodes: [
        { id: 'card1', type: 'file', file: 'target.md' },
        { id: 'card2', type: 'text', text: 'See [[Other Note]]' },
      ],
    });
    const cache = new BacklinkCache({ includeCanvas: true });
    cache.buildFromNotes([
      { path: 'my.canvas', title: 'My Canvas', content: canvasJson },
      { path: 'target.md', title: 'Target', content: 'Hi' },
      { path: 'other.md', title: 'Other Note', content: 'Yo' },
    ]);

    const backlinks = cache.getBacklinksForFile('target.md');
    expect(backlinks.some(b => b.source === 'canvas' && b.sourcePath === 'my.canvas')).toBe(true);
  });
});
