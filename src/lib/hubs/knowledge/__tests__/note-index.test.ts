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
import {
  buildNoteRecord,
  coerceFieldValue,
  extractTasks,
  getFieldValue,
  parseInlineFields,
} from '@/hubs/knowledge/services/note-index';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMeta(overrides: Partial<NoteMeta> = {}): NoteMeta {
  return {
    path: 'notes/test-note.md',
    title: 'Test Note',
    modifiedAt: 1720000000000,
    createdAt: 1719000000000,
    size: 512,
    ...overrides,
  };
}

// ── parseInlineFields ────────────────────────────────────────────────────────

describe('parseInlineFields', () => {
  it('extracts basic Key:: Value fields', () => {
    const content = 'Some text\nRating:: 8\nGenre:: sci-fi\n';
    const fields = parseInlineFields(content);
    expect(fields).toEqual([
      { key: 'Rating', value: '8' },
      { key: 'Genre', value: 'sci-fi' },
    ]);
  });

  it('extracts bracket [field:: value] syntax', () => {
    const content = 'You can write [field:: inline fields]; multiple [field2:: on the same line].';
    const fields = parseInlineFields(content);
    expect(fields).toContainEqual({ key: 'field', value: 'inline fields' });
    expect(fields).toContainEqual({ key: 'field2', value: 'on the same line' });
  });

  it('handles mixed inline and bracket fields', () => {
    const content = 'Status:: draft\nThis has a [priority:: high] tag.';
    const fields = parseInlineFields(content);
    expect(fields.length).toBe(2);
    expect(fields).toContainEqual({ key: 'Status', value: 'draft' });
    expect(fields).toContainEqual({ key: 'priority', value: 'high' });
  });

  it('returns empty array for content without fields', () => {
    const fields = parseInlineFields('Just some regular text.');
    expect(fields).toEqual([]);
  });

  it('handles dashed keys', () => {
    const content = 'time-played:: 42\nrelease-year:: 2024';
    const fields = parseInlineFields(content);
    expect(fields).toContainEqual({ key: 'time-played', value: '42' });
    expect(fields).toContainEqual({ key: 'release-year', value: '2024' });
  });
});

// ── coerceFieldValue ─────────────────────────────────────────────────────────

describe('coerceFieldValue', () => {
  it('coerces "true" to boolean true', () => {
    expect(coerceFieldValue('true')).toBe(true);
  });

  it('coerces "false" to boolean false', () => {
    expect(coerceFieldValue('false')).toBe(false);
  });

  it('coerces numeric strings to numbers', () => {
    expect(coerceFieldValue('42')).toBe(42);
    expect(coerceFieldValue('3.14')).toBe(3.14);
  });

  it('keeps date strings as strings', () => {
    expect(coerceFieldValue('2024-01-15')).toBe('2024-01-15');
  });

  it('parses bracket arrays', () => {
    expect(coerceFieldValue('[a, b, c]')).toEqual(['a', 'b', 'c']);
  });

  it('keeps regular strings as-is', () => {
    expect(coerceFieldValue('hello world')).toBe('hello world');
  });
});

// ── extractTasks ─────────────────────────────────────────────────────────────

describe('extractTasks', () => {
  it('extracts unchecked tasks', () => {
    const content = '- [ ] Buy groceries\n- [ ] Clean house';
    const tasks = extractTasks(content, 'notes/todo.md');
    expect(tasks).toHaveLength(2);
    expect(tasks[0].text).toBe('Buy groceries');
    expect(tasks[0].completed).toBe(false);
    expect(tasks[0].line).toBe(1);
  });

  it('extracts completed tasks', () => {
    const content = '- [x] Done task\n- [X] Also done';
    const tasks = extractTasks(content, 'notes/done.md');
    expect(tasks).toHaveLength(2);
    expect(tasks[0].completed).toBe(true);
    expect(tasks[1].completed).toBe(true);
  });

  it('handles custom checkbox statuses', () => {
    const content = '- [/] In progress\n- [-] Cancelled\n- [>] Deferred';
    const tasks = extractTasks(content, 'notes/mixed.md');
    expect(tasks).toHaveLength(3);
    expect(tasks[0].completed).toBe(false);
  });

  it('includes path in task', () => {
    const tasks = extractTasks('- [ ] Test', 'folder/note.md');
    expect(tasks[0].path).toBe('folder/note.md');
  });

  it('returns empty for content without tasks', () => {
    expect(extractTasks('No tasks here', 'notes/plain.md')).toEqual([]);
  });
});

// ── buildNoteRecord ──────────────────────────────────────────────────────────

describe('buildNoteRecord', () => {
  it('builds record with frontmatter', () => {
    const content =
      '---\ntitle: My Note\ntags: [book, fiction]\ncategory: research\n---\n\nBody text.';
    const record = buildNoteRecord(makeMeta(), content);
    expect(record.file.name).toBe('test-note');
    expect(record.file.folder).toBe('notes');
    expect(record.frontmatter['title']).toBe('My Note');
    expect(record.frontmatter['tags']).toEqual(['book', 'fiction']);
    expect(record.frontmatter['category']).toBe('research');
  });

  it('builds record with inline fields', () => {
    const content = 'Rating:: 9\nGenre:: horror';
    const record = buildNoteRecord(makeMeta(), content);
    expect(record.fields['Rating']).toBe(9);
    expect(record.fields['Genre']).toBe('horror');
  });

  it('promotes fields to top-level', () => {
    const content = '---\nstatus: draft\n---\nPriority:: high';
    const record = buildNoteRecord(makeMeta(), content);
    expect(record['status']).toBe('draft');
    expect(record['Priority']).toBe('high');
  });

  it('extracts tags from both frontmatter and inline', () => {
    const content = '---\ntags: [book]\n---\nSome #fiction content #2024';
    const record = buildNoteRecord(makeMeta(), content);
    expect(record.file.tags).toContain('book');
    expect(record.file.tags).toContain('fiction');
  });

  it('extracts outgoing wikilinks', () => {
    const content = 'Link to [[Other Note]] and [[Second Note|alias]]';
    const record = buildNoteRecord(makeMeta(), content);
    expect(record.file.outlinks).toContain('Other Note');
    expect(record.file.outlinks).toContain('Second Note');
  });

  it('extracts tasks from content', () => {
    const content = '- [ ] Task one\n- [x] Task two';
    const record = buildNoteRecord(makeMeta(), content);
    expect(record.tasks).toHaveLength(2);
    expect(record.tasks[0].text).toBe('Task one');
    expect(record.tasks[1].completed).toBe(true);
  });

  it('extracts date from filename', () => {
    const meta = makeMeta({ path: 'daily/2024-03-15.md', title: '2024-03-15' });
    const record = buildNoteRecord(meta, 'Daily note');
    expect(record.file.day).toBe('2024-03-15');
  });

  it('uses created date over filename date', () => {
    const content = '---\ncreated: 2024-01-01\n---\n';
    const meta = makeMeta({ path: 'daily/2024-03-15.md' });
    const record = buildNoteRecord(meta, content);
    expect(record.file.day).toBe('2024-01-01');
  });
});

// ── getFieldValue ────────────────────────────────────────────────────────────

describe('getFieldValue', () => {
  const record = buildNoteRecord(makeMeta(), '---\ntitle: Test\n---\nRating:: 8');

  it('resolves file.name', () => {
    expect(getFieldValue(record, 'file.name')).toBe('test-note');
  });

  it('resolves file.path', () => {
    expect(getFieldValue(record, 'file.path')).toBe('notes/test-note.md');
  });

  it('resolves file.folder', () => {
    expect(getFieldValue(record, 'file.folder')).toBe('notes');
  });

  it('returns undefined for non-existent paths', () => {
    expect(getFieldValue(record, 'file.nonexistent')).toBeUndefined();
  });

  it('resolves nested paths', () => {
    expect(getFieldValue(record, 'file.tags')).toEqual([]);
  });
});
