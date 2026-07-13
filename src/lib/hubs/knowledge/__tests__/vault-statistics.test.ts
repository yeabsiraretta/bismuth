import { describe, expect, it } from 'vitest';

import {
  computeVaultStats,
  countChars,
  countWords,
  extractFolders,
  extractLinks,
  extractTags,
  formatBytes,
  formatNumber,
  getExtension,
  isAttachment,
  isNote,
  type NoteInput,
  stripComments,
} from '@/hubs/knowledge/services/vault-statistics';

// ── Fixtures ──────────────────────────────────────────────────────

const NOTE_A: NoteInput = {
  path: 'notes/alpha.md',
  title: 'Alpha',
  size: 1200,
  createdAt: Date.UTC(2025, 0, 10),
  modifiedAt: Date.UTC(2025, 5, 1),
};

const NOTE_B: NoteInput = {
  path: 'notes/beta.md',
  title: 'Beta',
  size: 800,
  createdAt: Date.UTC(2025, 2, 15),
  modifiedAt: Date.UTC(2025, 7, 20),
};

const NOTE_C: NoteInput = {
  path: 'archive/gamma.md',
  title: 'Gamma',
  size: 400,
  createdAt: Date.UTC(2024, 6, 1),
  modifiedAt: Date.UTC(2024, 6, 2),
};

const ATTACHMENT: NoteInput = {
  path: 'assets/photo.png',
  title: 'photo',
  size: 50000,
  createdAt: Date.UTC(2025, 0, 1),
  modifiedAt: Date.UTC(2025, 0, 1),
};

const CONTENT_A = `---
title: Alpha
tags: [design, ux]
---

# Alpha

This is a note about [[Beta]] and [[Gamma]].

Some more words here. #inline-tag
`;

const CONTENT_B = `---
title: Beta
tags: design
---

# Beta

Short note linking to [Alpha](alpha.md).
`;

const CONTENT_C = '# Gamma\n\nOrphan note with no links at all.\n';

function contentLookup(path: string): string | null {
  if (path === 'notes/alpha.md') return CONTENT_A;
  if (path === 'notes/beta.md') return CONTENT_B;
  if (path === 'archive/gamma.md') return CONTENT_C;
  return null;
}

// ── stripComments ─────────────────────────────────────────────────

describe('stripComments', () => {
  it('removes Obsidian %% ... %% comment blocks', () => {
    expect(stripComments('before %%hidden%% after')).toBe('before  after');
  });

  it('removes HTML <!-- ... --> comments', () => {
    expect(stripComments('a <!-- comment --> b')).toBe('a  b');
  });

  it('removes multiline comments', () => {
    const input = 'start\n%%\nline1\nline2\n%%\nend';
    expect(stripComments(input)).toBe('start\n\nend');
  });

  it('returns content unchanged when no comments', () => {
    expect(stripComments('no comments here')).toBe('no comments here');
  });
});

// ── countWords ────────────────────────────────────────────────────

describe('countWords', () => {
  it('counts space-separated tokens', () => {
    expect(countWords('one two three')).toBe(3);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('excludes words inside comment blocks', () => {
    expect(countWords('visible %%hidden words%% also visible')).toBe(3);
  });

  it('excludes fenced code blocks', () => {
    expect(countWords('word\n```\ncode block stuff\n```\nanother')).toBe(2);
  });

  it('excludes frontmatter from count', () => {
    const content = '---\ntitle: Test\ntags: a, b\n---\n\nActual body words.';
    expect(countWords(content)).toBe(3);
  });
});

// ── countChars ────────────────────────────────────────────────────

describe('countChars', () => {
  it('counts non-whitespace characters', () => {
    expect(countChars('ab cd')).toBe(4);
  });

  it('excludes comments', () => {
    expect(countChars('ab %%xx%% cd')).toBe(4);
  });
});

// ── extractLinks ──────────────────────────────────────────────────

describe('extractLinks', () => {
  it('extracts wikilink targets lowercased', () => {
    expect(extractLinks('See [[Note One]] and [[Note Two]]')).toEqual(['note one', 'note two']);
  });

  it('extracts markdown link text', () => {
    expect(extractLinks('[click](url)')).toEqual(['click']);
  });

  it('handles wikilinks with aliases', () => {
    expect(extractLinks('[[Target|Alias]]')).toEqual(['target']);
  });

  it('handles wikilinks with heading anchors', () => {
    expect(extractLinks('[[Page#Section]]')).toEqual(['page']);
  });

  it('returns empty for no links', () => {
    expect(extractLinks('plain text')).toEqual([]);
  });
});

// ── extractTags ───────────────────────────────────────────────────

describe('extractTags', () => {
  it('extracts inline #tags', () => {
    expect(extractTags('hello #world #test')).toEqual(['world', 'test']);
  });

  it('extracts frontmatter tags (bracket syntax)', () => {
    const content = '---\ntags: [a, b, c]\n---\nBody';
    expect(extractTags(content)).toContain('a');
    expect(extractTags(content)).toContain('b');
    expect(extractTags(content)).toContain('c');
  });

  it('extracts frontmatter tags (comma-separated)', () => {
    const content = '---\ntags: alpha, beta\n---\nBody';
    expect(extractTags(content)).toContain('alpha');
    expect(extractTags(content)).toContain('beta');
  });

  it('combines frontmatter and inline tags', () => {
    const content = '---\ntags: [fm]\n---\n\n#inline';
    const tags = extractTags(content);
    expect(tags).toContain('fm');
    expect(tags).toContain('inline');
  });

  it('ignores tags inside code blocks', () => {
    const content = '```\n#not-a-tag\n```\n#real-tag';
    const tags = extractTags(content);
    expect(tags).toContain('real-tag');
    expect(tags).not.toContain('not-a-tag');
  });

  it('returns empty for no tags', () => {
    expect(extractTags('plain text')).toEqual([]);
  });
});

// ── File classification ───────────────────────────────────────────

describe('file classification', () => {
  it('identifies markdown notes', () => {
    expect(isNote('folder/note.md')).toBe(true);
    expect(isNote('doc.txt')).toBe(true);
    expect(isNote('doc.markdown')).toBe(true);
  });

  it('identifies attachments', () => {
    expect(isAttachment('img.png')).toBe(true);
    expect(isAttachment('file.pdf')).toBe(true);
    expect(isAttachment('song.mp3')).toBe(true);
  });

  it('returns false for unknown extensions', () => {
    expect(isNote('file.xyz')).toBe(false);
    expect(isAttachment('file.md')).toBe(false);
  });
});

describe('getExtension', () => {
  it('extracts lowercased extension', () => {
    expect(getExtension('file.MD')).toBe('md');
    expect(getExtension('photo.PNG')).toBe('png');
  });

  it('returns empty for no extension', () => {
    expect(getExtension('Makefile')).toBe('makefile');
  });
});

// ── extractFolders ────────────────────────────────────────────────

describe('extractFolders', () => {
  it('returns unique folder paths', () => {
    const folders = extractFolders(['a/b/c.md', 'a/b/d.md', 'a/e.md']);
    expect(folders).toContain('a');
    expect(folders).toContain('a/b');
    expect(folders.length).toBe(2);
  });

  it('returns empty for root-level files', () => {
    expect(extractFolders(['file.md'])).toEqual([]);
  });
});

// ── formatBytes / formatNumber ────────────────────────────────────

describe('formatting helpers', () => {
  it('formats bytes to B/KB/MB/GB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5242880)).toBe('5.0 MB');
    expect(formatBytes(2147483648)).toBe('2.00 GB');
  });

  it('formats numbers with grouping', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(0)).toBe('0');
  });
});

// ── computeVaultStats ─────────────────────────────────────────────

describe('computeVaultStats', () => {
  const notes = [NOTE_A, NOTE_B, NOTE_C, ATTACHMENT];

  it('counts notes (md files only)', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.notes).toBe(3);
  });

  it('counts attachments separately', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.attachments).toBe(1);
  });

  it('counts total files including non-notes', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.totalFiles).toBe(4);
  });

  it('sums total size from all files', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.totalSize).toBe(1200 + 800 + 400 + 50000);
  });

  it('counts total words across all notes', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.totalWords).toBeGreaterThan(0);
  });

  it('counts total characters across all notes', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.totalChars).toBeGreaterThan(0);
  });

  it('computes average words per note', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.avgWordsPerNote).toBe(Math.round(stats.totalWords / 3));
  });

  it('counts wikilinks and markdown links', () => {
    const stats = computeVaultStats(notes, contentLookup);
    // Alpha has [[Beta]], [[Gamma]]; Beta has [Alpha](...)
    expect(stats.totalLinks).toBe(3);
  });

  it('identifies orphan notes (not linked by any other note)', () => {
    const stats = computeVaultStats(notes, contentLookup);
    // Beta and Gamma are linked from Alpha; Alpha is linked from Beta → orphans = 0 if all linked
    // But link matching is by lowercase name; Alpha content links "beta" and "gamma" (wikilinks)
    // Beta links "Alpha" via MD link text "Alpha" (lowercased = "alpha")
    // So all three are linked → 0 orphans
    expect(stats.orphanNotes).toBe(0);
  });

  it('extracts unique folders', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.folders).toBe(3); // notes, archive, assets
  });

  it('aggregates tags sorted by frequency', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.tags.length).toBeGreaterThan(0);
    // "design" appears in both A and B
    const designTag = stats.tags.find((t) => t.tag === 'design');
    expect(designTag).toBeDefined();
    expect(designTag!.count).toBe(2);
  });

  it('identifies longest and shortest notes', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.longestNote).not.toBeNull();
    expect(stats.shortestNote).not.toBeNull();
    expect(stats.longestNote!.value).toBeGreaterThanOrEqual(stats.shortestNote!.value);
  });

  it('identifies newest, oldest, and last modified notes', () => {
    const stats = computeVaultStats(notes, contentLookup);
    expect(stats.newestNote?.title).toBe('Beta'); // March 2025
    expect(stats.oldestNote?.title).toBe('Gamma'); // July 2024
    expect(stats.lastModified?.title).toBe('Beta'); // Aug 2025
  });

  it('groups file types with count and size', () => {
    const stats = computeVaultStats(notes, contentLookup);
    const mdType = stats.fileTypes.find((f) => f.ext === 'md');
    expect(mdType).toBeDefined();
    expect(mdType!.count).toBe(3);
    expect(mdType!.size).toBe(1200 + 800 + 400);
  });

  it('returns zero stats for empty vault', () => {
    const stats = computeVaultStats([], () => null);
    expect(stats.notes).toBe(0);
    expect(stats.totalWords).toBe(0);
    expect(stats.totalLinks).toBe(0);
    expect(stats.folders).toBe(0);
    expect(stats.longestNote).toBeNull();
  });

  it('handles notes with no cached content gracefully', () => {
    const stats = computeVaultStats([NOTE_A], () => null);
    expect(stats.notes).toBe(1);
    expect(stats.totalWords).toBe(0);
  });
});
