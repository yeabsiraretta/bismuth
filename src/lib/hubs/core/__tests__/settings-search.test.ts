import { describe, expect, it } from 'vitest';

import { searchSettings } from '@/hubs/core/services/settings-search';

describe('searchSettings', () => {
  it('returns empty for blank query', () => {
    expect(searchSettings('')).toEqual([]);
    expect(searchSettings('   ')).toEqual([]);
  });

  it('finds setting by label', () => {
    const results = searchSettings('Vim mode');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.entry.id === 'vim-mode')).toBe(true);
  });

  it('finds setting by hint text', () => {
    const results = searchSettings('spell checking');
    expect(results.some((r) => r.entry.id === 'spell-check')).toBe(true);
  });

  it('returns correct tab label', () => {
    const results = searchSettings('Font Size');
    const editorResult = results.find((r) => r.entry.id === 'font-size');
    expect(editorResult?.tabLabel).toBe('Editor');
  });

  it('matches multiple terms (AND logic)', () => {
    const results = searchSettings('auto save');
    expect(results.some((r) => r.entry.id === 'auto-save')).toBe(true);
    // Should NOT match something with only 'auto' or only 'save'
    for (const r of results) {
      const haystack = `${r.entry.label} ${r.entry.hint} ${r.entry.section}`.toLowerCase();
      expect(haystack).toContain('auto');
      expect(haystack).toContain('save');
    }
  });

  it('is case-insensitive', () => {
    const results = searchSettings('VIM MODE');
    expect(results.some((r) => r.entry.id === 'vim-mode')).toBe(true);
  });

  it('returns no results for nonsense query', () => {
    expect(searchSettings('xyzzyflurb')).toEqual([]);
  });

  it('matches by section name', () => {
    const results = searchSettings('Grid');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((r) => r.entry.tab === 'canvas')).toBe(true);
  });
});
