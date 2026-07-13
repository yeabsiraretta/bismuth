import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('@/hubs/core/stores/vault-store.svelte', () => ({
  getNotes: () => [],
  getVault: () => null,
  setVault: vi.fn(),
  setNotes: vi.fn(),
  setActiveNote: vi.fn(),
  initVaultStore: vi.fn(),
  rescanVault: vi.fn(),
  isStoreInitialized: () => true,
}));
vi.mock('@/hubs/editor/services/file-ops', () => ({
  getCachedContent: () => undefined,
  updateCachedContent: vi.fn(),
  clearFileCache: vi.fn(),
  hydrateVaultContent: vi.fn(),
  isContentHydrated: () => false,
}));
vi.mock('@/utils/log/logger', () => ({
  log: { child: () => ({ info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() }) },
}));

import type { NoteMeta } from '@/hubs/core/stores/vault-store.svelte';
import { compareValues, executeDataviewQuery } from '@/hubs/knowledge/services/dataview-executor';
import { parseDataviewQuery } from '@/hubs/knowledge/services/dataview-query';
import { buildNoteRecord, type NoteRecord } from '@/hubs/knowledge/services/note-index';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMeta(path: string, title: string): NoteMeta {
  return { path, title, modifiedAt: 1720000000000, createdAt: 1719000000000, size: 256 };
}

function makeRecord(path: string, title: string, content: string): NoteRecord {
  return buildNoteRecord(makeMeta(path, title), content);
}

function makeIndex(): NoteRecord[] {
  return [
    makeRecord(
      'games/elden-ring.md',
      'Elden Ring',
      '---\ntitle: Elden Ring\ntags: [game, rpg]\nrating: 9\n---\ntime-played:: 120\nGenre:: RPG\n- [ ] Complete DLC'
    ),
    makeRecord(
      'games/dota2.md',
      'Dota 2',
      '---\ntitle: Dota 2\ntags: [game, moba]\nrating: 7\n---\ntime-played:: 5000\nGenre:: MOBA'
    ),
    makeRecord(
      'books/dune.md',
      'Dune',
      '---\ntitle: Dune\ntags: [book, sci-fi]\nrating: 10\ncreated: 2024-01-15\n---\nGenre:: Science Fiction'
    ),
    makeRecord(
      'books/neuromancer.md',
      'Neuromancer',
      '---\ntitle: Neuromancer\ntags: [book, sci-fi]\nrating: 8\n---\nGenre:: Cyberpunk\n- [x] Read chapter 1\n- [ ] Read chapter 2'
    ),
    makeRecord(
      'daily/2024-03-15.md',
      '2024-03-15',
      'Daily note\n- [ ] Morning review\n- [x] Exercise'
    ),
  ];
}

// ── parseDataviewQuery ───────────────────────────────────────────────────────

describe('parseDataviewQuery', () => {
  it('parses TABLE with fields', () => {
    const q = parseDataviewQuery('TABLE rating, time-played FROM "games"');
    expect(q.mode).toBe('TABLE');
    expect(q.fields).toHaveLength(2);
    expect(q.fields[0].path).toBe('rating');
    expect(q.fields[1].path).toBe('time-played');
    expect(q.sources).toHaveLength(1);
    expect(q.sources[0]).toEqual({ type: 'folder', value: 'games', negate: false });
  });

  it('parses TABLE with AS aliases', () => {
    const q = parseDataviewQuery('TABLE file.name AS "File", rating AS "Rating" FROM #book');
    expect(q.fields[0]).toEqual({ path: 'file.name', alias: 'File' });
    expect(q.fields[1]).toEqual({ path: 'rating', alias: 'Rating' });
    expect(q.sources[0]).toEqual({ type: 'tag', value: 'book', negate: false });
  });

  it('parses LIST mode', () => {
    const q = parseDataviewQuery('LIST FROM #game/moba');
    expect(q.mode).toBe('LIST');
    expect(q.sources[0]).toEqual({ type: 'tag', value: 'game/moba', negate: false });
  });

  it('parses TASK mode', () => {
    const q = parseDataviewQuery('TASK FROM #projects');
    expect(q.mode).toBe('TASK');
    expect(q.sources[0]).toEqual({ type: 'tag', value: 'projects', negate: false });
  });

  it('parses CALENDAR mode', () => {
    const q = parseDataviewQuery('CALENDAR created FROM "daily"');
    expect(q.mode).toBe('CALENDAR');
    expect(q.fields[0].path).toBe('created');
  });

  it('parses WHERE clause', () => {
    const q = parseDataviewQuery('TABLE FROM "games" WHERE rating > 8');
    expect(q.where).toHaveLength(1);
    expect(q.where[0].field).toBe('rating');
    expect(q.where[0].op).toBe('>');
    expect(q.where[0].value).toBe(8);
  });

  it('parses WHERE with AND/OR', () => {
    const q = parseDataviewQuery('TABLE FROM "games" WHERE rating > 5 AND genre != "MOBA"');
    expect(q.where).toHaveLength(2);
    expect(q.where[1].logic).toBe('AND');
  });

  it('parses WHERE contains', () => {
    const q = parseDataviewQuery('TABLE WHERE tags contains "sci-fi"');
    expect(q.where[0].op).toBe('contains');
    expect(q.where[0].value).toBe('sci-fi');
  });

  it('parses SORT clause', () => {
    const q = parseDataviewQuery('TABLE rating FROM "games" SORT rating DESC');
    expect(q.sort).toHaveLength(1);
    expect(q.sort[0]).toEqual({ field: 'rating', direction: 'DESC' });
  });

  it('parses SORT defaults to ASC', () => {
    const q = parseDataviewQuery('TABLE SORT file.name');
    expect(q.sort[0].direction).toBe('ASC');
  });

  it('parses GROUP BY', () => {
    const q = parseDataviewQuery('TABLE FROM "books" GROUP BY genre');
    expect(q.groupBy).toBe('genre');
  });

  it('parses LIMIT', () => {
    const q = parseDataviewQuery('LIST LIMIT 5');
    expect(q.limit).toBe(5);
  });

  it('parses FLATTEN', () => {
    const q = parseDataviewQuery('TABLE FLATTEN tags');
    expect(q.flattenField).toBe('tags');
  });

  it('parses complex query', () => {
    const q = parseDataviewQuery(
      'TABLE rating AS "Score", Genre FROM "games" WHERE rating >= 8 SORT rating DESC LIMIT 10'
    );
    expect(q.mode).toBe('TABLE');
    expect(q.fields).toHaveLength(2);
    expect(q.fields[0]).toEqual({ path: 'rating', alias: 'Score' });
    expect(q.sources[0].value).toBe('games');
    expect(q.where[0]).toMatchObject({ field: 'rating', op: '>=', value: 8 });
    expect(q.sort[0]).toEqual({ field: 'rating', direction: 'DESC' });
    expect(q.limit).toBe(10);
  });

  it('handles link source', () => {
    const q = parseDataviewQuery('LIST FROM [[My Note]]');
    expect(q.sources[0]).toEqual({ type: 'link', value: 'My Note', negate: false });
  });

  it('handles negated source', () => {
    const q = parseDataviewQuery('LIST FROM -"archive"');
    expect(q.sources[0].negate).toBe(true);
    expect(q.sources[0].value).toBe('archive');
  });
});

// ── compareValues ────────────────────────────────────────────────────────────

describe('compareValues', () => {
  it('compares equality', () => {
    expect(compareValues('hello', '=', 'hello')).toBe(true);
    expect(compareValues('hello', '!=', 'world')).toBe(true);
  });

  it('compares numbers', () => {
    expect(compareValues(10, '>', 5)).toBe(true);
    expect(compareValues(3, '<', 7)).toBe(true);
    expect(compareValues(5, '>=', 5)).toBe(true);
    expect(compareValues(5, '<=', 5)).toBe(true);
  });

  it('handles contains', () => {
    expect(compareValues('hello world', 'contains', 'world')).toBe(true);
    expect(compareValues(['a', 'b', 'c'], 'contains', 'b')).toBe(true);
    expect(compareValues('hello', '!contains', 'xyz')).toBe(true);
  });

  it('handles null/undefined', () => {
    expect(compareValues(null, '=', null)).toBe(true);
    expect(compareValues(undefined, '!=', 'something')).toBe(true);
    expect(compareValues(null, '>', 5)).toBe(false);
  });
});

// ── executeDataviewQuery ─────────────────────────────────────────────────────

describe('executeDataviewQuery', () => {
  const index = makeIndex();

  it('TABLE from folder', () => {
    const q = parseDataviewQuery('TABLE rating FROM "games"');
    const result = executeDataviewQuery(q, index);
    expect(result.mode).toBe('TABLE');
    expect(result.rows).toHaveLength(2);
    expect(result.rows.every((r) => r.record.file.folder === 'games')).toBe(true);
  });

  it('LIST from tag', () => {
    const q = parseDataviewQuery('LIST FROM #book');
    const result = executeDataviewQuery(q, index);
    expect(result.rows).toHaveLength(2);
  });

  it('LIST from subtag', () => {
    const q = parseDataviewQuery('LIST FROM #sci-fi');
    const result = executeDataviewQuery(q, index);
    expect(result.rows).toHaveLength(2);
  });

  it('WHERE filters by field value', () => {
    const q = parseDataviewQuery('TABLE rating WHERE rating > 8');
    const result = executeDataviewQuery(q, index);
    const ratings = result.rows.map((r) => r.record.frontmatter['rating']);
    expect(ratings.every((r) => Number(r) > 8)).toBe(true);
  });

  it('WHERE filters by equality', () => {
    const q = parseDataviewQuery('TABLE WHERE rating = 10');
    const result = executeDataviewQuery(q, index);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].record.file.name).toBe('dune');
  });

  it('SORT orders results', () => {
    const q = parseDataviewQuery('TABLE rating FROM "games" SORT rating DESC');
    const result = executeDataviewQuery(q, index);
    expect(result.rows[0].record.file.name).toBe('elden-ring');
    expect(result.rows[1].record.file.name).toBe('dota2');
  });

  it('LIMIT caps results', () => {
    const q = parseDataviewQuery('LIST LIMIT 2');
    const result = executeDataviewQuery(q, index);
    expect(result.rows).toHaveLength(2);
  });

  it('TASK extracts tasks from matching notes', () => {
    const q = parseDataviewQuery('TASK FROM "daily"');
    const result = executeDataviewQuery(q, index);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].text).toBe('Morning review');
  });

  it('WHERE with AND', () => {
    const q = parseDataviewQuery('TABLE WHERE rating >= 8 AND rating <= 9');
    const result = executeDataviewQuery(q, index);
    const ratings = result.rows.map((r) => Number(r.record.frontmatter['rating']));
    expect(ratings.every((r) => r >= 8 && r <= 9)).toBe(true);
  });

  it('GROUP BY groups results', () => {
    const q = parseDataviewQuery('TABLE rating GROUP BY file.folder');
    const result = executeDataviewQuery(q, index);
    expect(result.groups.length).toBeGreaterThan(0);
    const folderKeys = result.groups.map((g) => g.key);
    expect(folderKeys).toContain('games');
    expect(folderKeys).toContain('books');
  });

  it('field projection includes alias', () => {
    const q = parseDataviewQuery('TABLE rating AS "Score" FROM "books"');
    const result = executeDataviewQuery(q, index);
    expect(result.rows[0].values.has('Score')).toBe(true);
  });

  it('handles empty result set', () => {
    const q = parseDataviewQuery('LIST FROM "nonexistent"');
    const result = executeDataviewQuery(q, index);
    expect(result.rows).toHaveLength(0);
  });

  it('handles WHERE contains for tags', () => {
    const q = parseDataviewQuery('TABLE WHERE tags contains "rpg"');
    const result = executeDataviewQuery(q, index);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].record.file.name).toBe('elden-ring');
  });
});
