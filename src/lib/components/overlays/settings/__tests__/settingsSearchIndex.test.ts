import { describe, it, expect } from 'vitest';
import {
  searchSettings,
  matchingTabs,
  groupByTab,
  SETTINGS_INDEX,
} from '../settingsSearchIndex';

describe('SETTINGS_INDEX', () => {
  it('has unique IDs', () => {
    const ids = SETTINGS_INDEX.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has required fields', () => {
    for (const e of SETTINGS_INDEX) {
      expect(e.id).toBeTruthy();
      expect(e.tab).toBeTruthy();
      expect(e.group).toBeTruthy();
      expect(e.label).toBeTruthy();
      expect(e.description).toBeTruthy();
      expect(Array.isArray(e.keywords)).toBe(true);
    }
  });
});

describe('searchSettings', () => {
  it('returns empty for blank query', () => {
    expect(searchSettings('')).toEqual([]);
    expect(searchSettings('   ')).toEqual([]);
  });

  it('finds exact label match', () => {
    const results = searchSettings('Font Size');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe('Font Size');
    expect(results[0].score).toBe(0);
  });

  it('finds by label prefix', () => {
    const results = searchSettings('Auto-save');
    expect(results.some((r) => r.label.startsWith('Auto-save'))).toBe(true);
  });

  it('finds by label substring', () => {
    const results = searchSettings('line numbers');
    expect(results.some((r) => r.label.toLowerCase().includes('line numbers'))).toBe(true);
  });

  it('finds by description text', () => {
    const results = searchSettings('spell checking');
    expect(results.some((r) => r.id === 'ed-spellcheck')).toBe(true);
  });

  it('finds by keywords', () => {
    const results = searchSettings('wysiwyg');
    expect(results.some((r) => r.id === 'ed-preview')).toBe(true);
  });

  it('finds by group name', () => {
    const results = searchSettings('Typewriter');
    expect(results.filter((r) => r.group === 'Typewriter Scroll').length).toBeGreaterThanOrEqual(1);
  });

  it('is case insensitive', () => {
    const upper = searchSettings('FONT SIZE');
    const lower = searchSettings('font size');
    expect(upper.length).toBe(lower.length);
    expect(upper[0].id).toBe(lower[0].id);
  });

  it('scores exact match higher than substring', () => {
    const results = searchSettings('Scale');
    const exact = results.find((r) => r.label === 'Scale');
    const substring = results.find((r) => r.label !== 'Scale');
    if (exact && substring) {
      expect(exact.score).toBeLessThanOrEqual(substring.score);
    }
  });

  it('supports multi-word queries', () => {
    const results = searchSettings('auto save');
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('matchingTabs', () => {
  it('returns empty set for blank query', () => {
    expect(matchingTabs('').size).toBe(0);
  });

  it('returns correct tabs for font query', () => {
    const tabs = matchingTabs('font');
    expect(tabs.has('editor')).toBe(true);
    expect(tabs.has('appearance')).toBe(true);
  });
});

describe('groupByTab', () => {
  it('groups results by tab correctly', () => {
    const results = searchSettings('font');
    const grouped = groupByTab(results);
    for (const [tab, items] of grouped) {
      expect(items.every((r) => r.tab === tab)).toBe(true);
    }
  });

  it('returns empty map for empty results', () => {
    const grouped = groupByTab([]);
    expect(grouped.size).toBe(0);
  });
});
