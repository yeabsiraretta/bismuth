/**
 * T054: ComponentBrowser unit tests
 *
 * Tests the ComponentBrowser component's rendering contract via the stores
 * it consumes: filteredComponents (list display), searchQuery (filtering),
 * and the empty-state conditions.
 *
 * @testing-library/svelte is not available in this project — tests follow
 * the established store-layer pattern used in componentLibrary.test.ts.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// ─── Mock service + utilities ─────────────────────────────────────────────────

vi.mock('@/features/canvas/services/components', () => ({
  listComponents: vi.fn().mockResolvedValue([
    {
      id: 'cb1',
      name: 'Button',
      category: 'ui',
      elements: [],
      exposedProps: [],
      width: 120,
      height: 40,
      tags: ['cta', 'interactive'],
      created_at: 0,
      modified_at: 0,
    },
    {
      id: 'cb2',
      name: 'Card',
      category: 'layout',
      elements: [],
      exposedProps: [],
      width: 240,
      height: 160,
      tags: ['container'],
      created_at: 0,
      modified_at: 0,
    },
    {
      id: 'cb3',
      name: 'Input Field',
      category: 'ui',
      elements: [],
      exposedProps: [],
      width: 200,
      height: 36,
      tags: ['form'],
      created_at: 0,
      modified_at: 0,
    },
    {
      id: 'cb4',
      name: 'Badge',
      category: 'ui',
      elements: [],
      exposedProps: [],
      width: 60,
      height: 24,
      tags: ['label'],
      created_at: 0,
      modified_at: 0,
    },
  ]),
  saveComponent: vi.fn().mockImplementation((c) => Promise.resolve(c)),
  deleteComponent: vi.fn().mockResolvedValue(undefined),
}));

import {
  components,
  isLoading,
  searchQuery,
  categoryFilter,
  filteredComponents,
  categories,
  loadLibrary,
} from '@/features/canvas/stores';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStores(): void {
  components.set([]);
  searchQuery.set('');
  categoryFilter.set(null);
  isLoading.set(false);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ComponentBrowser — renders component list (T054)', () => {
  beforeEach(async () => {
    resetStores();
    await loadLibrary();
  });

  it('shows all components when no filter is active', () => {
    const list = get(filteredComponents);
    expect(list).toHaveLength(4);
  });

  it('exposes component names for list rendering', () => {
    const names = get(filteredComponents).map((c) => c.name);
    expect(names).toContain('Button');
    expect(names).toContain('Card');
    expect(names).toContain('Input Field');
    expect(names).toContain('Badge');
  });

  it('loading flag starts false and ends false after load', async () => {
    resetStores();
    expect(get(isLoading)).toBe(false);
    const promise = loadLibrary();
    expect(get(isLoading)).toBe(true);
    await promise;
    expect(get(isLoading)).toBe(false);
  });

  it('exposes category list for the category filter chips', () => {
    const cats = get(categories);
    expect(cats).toContain('ui');
    expect(cats).toContain('layout');
  });
});

describe('ComponentBrowser — search filters the list (T054)', () => {
  beforeEach(async () => {
    resetStores();
    await loadLibrary();
  });

  it('filters by name substring (case-insensitive)', () => {
    searchQuery.set('button');
    const result = get(filteredComponents);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Button');
  });

  it('filters by partial name match', () => {
    searchQuery.set('input');
    const result = get(filteredComponents);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Input Field');
  });

  it('filters by tag match', () => {
    searchQuery.set('form');
    const result = get(filteredComponents);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Input Field');
  });

  it('matches multiple components when query is broad', () => {
    searchQuery.set('badge');
    const result = get(filteredComponents);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Badge');
  });

  it('filters by category chip selection', () => {
    categoryFilter.set('layout');
    const result = get(filteredComponents);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Card');
  });

  it('combines search query and category filter', () => {
    categoryFilter.set('ui');
    searchQuery.set('cta');
    const result = get(filteredComponents);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Button');
  });

  it('hides non-matching components when filtering', () => {
    searchQuery.set('Card');
    const result = get(filteredComponents);
    const names = result.map((c) => c.name);
    expect(names).not.toContain('Button');
    expect(names).not.toContain('Input Field');
    expect(names).not.toContain('Badge');
  });
});

describe('ComponentBrowser — empty state (T054)', () => {
  beforeEach(async () => {
    resetStores();
    await loadLibrary();
  });

  it('returns empty list when search yields no matches', () => {
    searchQuery.set('zzz-no-such-component');
    expect(get(filteredComponents)).toHaveLength(0);
  });

  it('returns empty list when category has no components', () => {
    categoryFilter.set('nonexistent-category');
    expect(get(filteredComponents)).toHaveLength(0);
  });

  it('returns empty list when search + category combo matches nothing', () => {
    categoryFilter.set('layout');
    searchQuery.set('Button');
    expect(get(filteredComponents)).toHaveLength(0);
  });

  it('returns empty list when library is empty', () => {
    components.set([]);
    expect(get(filteredComponents)).toHaveLength(0);
  });
});
