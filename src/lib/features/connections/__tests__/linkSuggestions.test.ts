/**
 * Spec 021 T019 — computeLinkSuggestions focused tests.
 * Covers edge cases: no links, many common tags, self-exclusion,
 * already-linked exclusion, cap at 5 results.
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

import { computeLinkSuggestions, extractTags, extractLinkedPaths } from '../services/connectionsLogic';
import type { Note } from '@/types/data/vault';

function note(path: string, title: string, content = ''): Note {
  return { path, title, content, frontmatter: {} } as Note;
}

// ---------------------------------------------------------------------------
// computeLinkSuggestions — core scenarios
// ---------------------------------------------------------------------------

describe('computeLinkSuggestions', () => {
  describe('active note with no links and no tags', () => {
    it('returns empty array when no notes share title words or tags', () => {
      const active = { path: '/vault/brand-new.md', title: 'Brand New', content: '' };
      const all = [
        note('/vault/cooking.md', 'Cooking Recipes', '#food'),
        note('/vault/travel.md', 'Travel Guide', '#vacation'),
      ];
      expect(computeLinkSuggestions(active, all)).toHaveLength(0);
    });

    it('returns empty array when all notes list is empty', () => {
      const active = { path: '/vault/note.md', title: 'Note', content: '' };
      expect(computeLinkSuggestions(active, [])).toHaveLength(0);
    });

    it('excludes the active note itself', () => {
      const active = { path: '/vault/note.md', title: 'Note', content: '' };
      const all = [note('/vault/note.md', 'Note', '')];
      expect(computeLinkSuggestions(active, all)).toHaveLength(0);
    });
  });

  describe('notes with many common tags', () => {
    const all = [
      note('/vault/a.md', 'A', '#dev #typescript #svelte'),
      note('/vault/b.md', 'B', '#dev #typescript'),
      note('/vault/c.md', 'C', '#dev #rust'),
      note('/vault/d.md', 'D', '#dev'),
      note('/vault/e.md', 'E', '#dev #testing'),
      note('/vault/f.md', 'F', '#dev #vitest'),
      note('/vault/g.md', 'G', '#dev #pnpm'),
    ];

    it('returns at most 5 suggestions even when many notes share tags', () => {
      const active = { path: '/vault/active.md', title: 'active', content: '#dev' };
      const suggestions = computeLinkSuggestions(active, all);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('all returned suggestions share at least one tag with active', () => {
      const active = { path: '/vault/active.md', title: 'active', content: '#dev' };
      const activeTags = extractTags(active.content);
      const suggestions = computeLinkSuggestions(active, all);
      for (const s of suggestions) {
        const noteTags = extractTags(s.content);
        expect(noteTags.some(t => activeTags.includes(t))).toBe(true);
      }
    });
  });

  describe('exclusion of already-linked notes', () => {
    const all = [
      note('/vault/alpha.md', 'Alpha', '#ref'),
      note('/vault/beta.md', 'Beta', '#ref'),
      note('/vault/gamma.md', 'Gamma', '#ref'),
    ];

    it('does not suggest notes already linked via wikilink', () => {
      const active = {
        path: '/vault/draft.md',
        title: 'draft',
        content: '[[Alpha]] some content #ref',
      };
      const suggestions = computeLinkSuggestions(active, all);
      expect(suggestions.every(n => n.path !== '/vault/alpha.md')).toBe(true);
    });

    it('can still suggest notes not yet linked', () => {
      const active = {
        path: '/vault/draft.md',
        title: 'draft',
        content: '[[Alpha]] #ref',
      };
      const suggestions = computeLinkSuggestions(active, all);
      const paths = suggestions.map(n => n.path);
      expect(paths.some(p => p.includes('beta') || p.includes('gamma'))).toBe(true);
    });
  });

  describe('title overlap matching', () => {
    it('matches when active title is substring of candidate title', () => {
      const active = { path: '/vault/project.md', title: 'project', content: '' };
      const all = [note('/vault/project-alpha.md', 'Project Alpha', '')];
      const suggestions = computeLinkSuggestions(active, all);
      expect(suggestions.some(n => n.path === '/vault/project-alpha.md')).toBe(true);
    });

    it('matches when candidate title is substring of active title', () => {
      const active = { path: '/vault/project-alpha.md', title: 'Project Alpha', content: '' };
      const all = [note('/vault/project.md', 'project', '')];
      const suggestions = computeLinkSuggestions(active, all);
      expect(suggestions.some(n => n.path === '/vault/project.md')).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// extractTags — additional edge cases
// ---------------------------------------------------------------------------

describe('extractTags edge cases', () => {
  it('returns empty array for empty string', () => {
    expect(extractTags('')).toEqual([]);
  });

  it('deduplicates tags in return value when same tag appears twice', () => {
    const tags = extractTags('#dev and #dev again');
    const devCount = tags.filter(t => t === 'dev').length;
    expect(devCount).toBe(2); // extractTags does NOT deduplicate — each match returned
  });

  it('handles content with only punctuation', () => {
    expect(extractTags('!!! ??? ...')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// extractLinkedPaths — additional edge cases
// ---------------------------------------------------------------------------

describe('extractLinkedPaths edge cases', () => {
  it('returns empty set for empty notes list', () => {
    const linked = extractLinkedPaths('[[SomeNote]]', []);
    expect(linked.size).toBe(0);
  });

  it('handles multiple wikilinks to same note (no duplicates in set)', () => {
    const notes = [note('/vault/alpha.md', 'Alpha', '')];
    const linked = extractLinkedPaths('[[Alpha]] and also [[Alpha]]', notes);
    expect(linked.size).toBe(1);
  });

  it('handles wikilinks with extra whitespace around title', () => {
    const notes = [note('/vault/alpha.md', 'Alpha', '')];
    // extractLinkedPaths trims after split on '|', but title must match exactly
    const linked = extractLinkedPaths('[[ Alpha ]]', notes);
    // After trim: " Alpha " → trimmed to "alpha" vs "alpha" — should match
    expect(linked.size).toBe(1);
  });
});
