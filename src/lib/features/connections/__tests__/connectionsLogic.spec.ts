/**
 * connectionsLogic — link suggestion tests.
 * Spec 021 T019 — tests computeLinkSuggestions, extractTags,
 * extractLinkedPaths, togglePin, and other pure helpers.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock the graph feature to prevent transitive vault-store imports
vi.mock('@/features/graph', () => ({
  getSimilarNotes: vi.fn(),
  lookupByText: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  computeLinkSuggestions,
  extractTags,
  extractLinkedPaths,
  getFileName,
  togglePin,
  buildDragData,
  pickRandomConnection,
} from '../services/connectionsLogic';
import type { Connection } from '../services/connectionsLogic';
import type { Note } from '@/types/data/vault';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNote(path: string, title: string, content = ''): Note {
  return { path, title, content } as Note;
}

// ---------------------------------------------------------------------------
// extractTags
// ---------------------------------------------------------------------------

describe('extractTags', () => {
  it('returns empty array for content with no hashtags', () => {
    expect(extractTags('Hello world')).toEqual([]);
  });

  it('extracts a single hashtag', () => {
    expect(extractTags('Learning #typescript today')).toEqual(['typescript']);
  });

  it('extracts multiple hashtags', () => {
    const tags = extractTags('Work on #svelte and #vitest coverage');
    expect(tags).toContain('svelte');
    expect(tags).toContain('vitest');
  });

  it('lowercases all extracted tags', () => {
    expect(extractTags('#TypeScript and #VITEST')).toEqual(['typescript', 'vitest']);
  });

  it('handles hyphenated tags', () => {
    expect(extractTags('Use #type-safe patterns')).toContain('type-safe');
  });
});

// ---------------------------------------------------------------------------
// extractLinkedPaths
// ---------------------------------------------------------------------------

describe('extractLinkedPaths', () => {
  const notes = [
    makeNote('/vault/alpha.md', 'Alpha'),
    makeNote('/vault/beta.md', 'Beta'),
    makeNote('/vault/gamma.md', 'Gamma'),
  ];

  it('returns empty set for content with no wikilinks', () => {
    const linked = extractLinkedPaths('Plain text', notes);
    expect(linked.size).toBe(0);
  });

  it('resolves a single wikilink to a path', () => {
    const linked = extractLinkedPaths('See [[Alpha]] for details', notes);
    expect(linked.has('/vault/alpha.md')).toBe(true);
  });

  it('resolves multiple wikilinks', () => {
    const linked = extractLinkedPaths('Refs: [[Alpha]] and [[Beta]]', notes);
    expect(linked.has('/vault/alpha.md')).toBe(true);
    expect(linked.has('/vault/beta.md')).toBe(true);
  });

  it('is case-insensitive for wikilink title matching', () => {
    const linked = extractLinkedPaths('[[alpha]]', notes);
    expect(linked.has('/vault/alpha.md')).toBe(true);
  });

  it('ignores wikilinks that do not match any note', () => {
    const linked = extractLinkedPaths('[[UnknownNote]]', notes);
    expect(linked.size).toBe(0);
  });

  it('strips piped aliases from wikilinks before matching', () => {
    const linked = extractLinkedPaths('[[Alpha|display text]]', notes);
    expect(linked.has('/vault/alpha.md')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeLinkSuggestions
// ---------------------------------------------------------------------------

describe('computeLinkSuggestions', () => {
  const allNotes = [
    makeNote('/vault/project-alpha.md', 'Project Alpha', '#dev notes'),
    makeNote('/vault/project-beta.md', 'Project Beta', '#dev tasks'),
    makeNote('/vault/cooking.md', 'Cooking Recipes', '#food'),
    makeNote('/vault/alpha-notes.md', 'Alpha Notes', '#dev'),
    makeNote('/vault/unrelated.md', 'Unrelated', ''),
  ];

  it('excludes the active note from suggestions', () => {
    const active = { path: '/vault/project-alpha.md', title: 'Project Alpha', content: '' };
    const suggestions = computeLinkSuggestions(active, allNotes);
    expect(suggestions.every((n) => n.path !== '/vault/project-alpha.md')).toBe(true);
  });

  it('excludes already-linked notes', () => {
    const active = {
      path: '/vault/new-note.md',
      title: 'Alpha',
      content: '[[Project Alpha]]',
    };
    const suggestions = computeLinkSuggestions(active, allNotes);
    expect(suggestions.every((n) => n.path !== '/vault/project-alpha.md')).toBe(true);
  });

  it('suggests notes with title overlap', () => {
    const active = { path: '/vault/other.md', title: 'Alpha', content: '' };
    const suggestions = computeLinkSuggestions(active, allNotes);
    const paths = suggestions.map((n) => n.path);
    // "Project Alpha" and "Alpha Notes" both contain "alpha"
    expect(paths.some((p) => p.includes('alpha'))).toBe(true);
  });

  it('suggests notes with shared tags', () => {
    const active = { path: '/vault/my-dev-note.md', title: 'Dev Note', content: '#dev some code' };
    const suggestions = computeLinkSuggestions(active, allNotes);
    const paths = suggestions.map((n) => n.path);
    expect(paths.some((p) => p.includes('project-alpha') || p.includes('project-beta') || p.includes('alpha-notes'))).toBe(true);
  });

  it('returns at most 5 suggestions', () => {
    const active = { path: '/vault/dev.md', title: 'dev', content: '#dev' };
    const suggestions = computeLinkSuggestions(active, allNotes);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it('returns empty when no overlap and no shared tags', () => {
    const active = { path: '/vault/xyz.md', title: 'Quantum Vacuum Flux', content: '' };
    const suggestions = computeLinkSuggestions(active, allNotes);
    expect(suggestions).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// togglePin
// ---------------------------------------------------------------------------

describe('togglePin', () => {
  const conn: Connection = { path: '/vault/a.md', title: 'A', score: 0.9 };

  it('pins an unpinned connection', () => {
    const { pinned } = togglePin(conn, [], [conn]);
    expect(pinned.some((p) => p.path === conn.path)).toBe(true);
  });

  it('unpins an already-pinned connection', () => {
    const { pinned } = togglePin(conn, [conn], [conn]);
    expect(pinned.some((p) => p.path === conn.path)).toBe(false);
  });

  it('marks connection as pinned in the connections list', () => {
    const { connections } = togglePin(conn, [], [conn]);
    expect(connections[0].pinned).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getFileName
// ---------------------------------------------------------------------------

describe('getFileName', () => {
  it('returns last path segment', () => {
    expect(getFileName('/vault/notes/my-note.md')).toBe('my-note.md');
  });

  it('returns path unchanged when no slash', () => {
    expect(getFileName('note.md')).toBe('note.md');
  });
});

// ---------------------------------------------------------------------------
// buildDragData
// ---------------------------------------------------------------------------

describe('buildDragData', () => {
  it('produces wikilink without .md extension', () => {
    const conn: Connection = { path: '/vault/idea.md', title: 'idea.md', score: 0.5 };
    const { text } = buildDragData(conn);
    expect(text).toBe('[[idea]]');
  });
});

// ---------------------------------------------------------------------------
// pickRandomConnection
// ---------------------------------------------------------------------------

describe('pickRandomConnection', () => {
  it('returns null for empty pools', () => {
    expect(pickRandomConnection([], [])).toBeNull();
  });

  it('returns a path from the connections pool when non-empty', () => {
    const conns: Connection[] = [
      { path: '/vault/x.md', title: 'X', score: 0.8 },
      { path: '/vault/y.md', title: 'Y', score: 0.7 },
    ];
    const result = pickRandomConnection(conns, []);
    expect(result).toBeTruthy();
    expect(conns.some((c) => c.path === result)).toBe(true);
  });
});
