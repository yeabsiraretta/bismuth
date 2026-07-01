import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  recordFeatureUse,
  getPreloadHints,
  preloadPreviouslyUsedFeatures,
  clearStalePreloadHints,
} from '@/utils/storage/featurePreload';

const PRELOAD_KEY = 'bismuth-preloaded-features';
const PRUNE_KEY = 'bismuth-preload-pruned';

describe('featurePreload', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('recordFeatureUse', () => {
    it('persists a new feature ID to localStorage', () => {
      recordFeatureUse('graph');
      const hints = getPreloadHints();
      expect(hints).toContain('graph');
    });

    it('deduplicates — calling with same ID twice stores once', () => {
      recordFeatureUse('canvas');
      recordFeatureUse('canvas');
      const stored = JSON.parse(localStorage.getItem(PRELOAD_KEY) ?? '[]');
      const canvasEntries = stored.filter((e: { id: string }) => e.id === 'canvas');
      expect(canvasEntries).toHaveLength(1);
    });

    it('replaces an old entry with a fresh timestamp when re-used', () => {
      recordFeatureUse('graph');
      const first = JSON.parse(localStorage.getItem(PRELOAD_KEY) ?? '[]');
      const firstTime = first.find((e: { id: string }) => e.id === 'graph')?.usedAt;

      // Simulate time passing
      vi.useFakeTimers();
      vi.advanceTimersByTime(5000);
      recordFeatureUse('graph');
      vi.useRealTimers();

      const second = JSON.parse(localStorage.getItem(PRELOAD_KEY) ?? '[]');
      const graphEntries = second.filter((e: { id: string }) => e.id === 'graph');
      expect(graphEntries).toHaveLength(1);
      expect(graphEntries[0].usedAt).not.toBe(firstTime);
    });

    it('caps list at 10 entries (oldest evicted)', () => {
      for (let i = 0; i < 12; i++) recordFeatureUse(`feature-${i}`);
      const stored = JSON.parse(localStorage.getItem(PRELOAD_KEY) ?? '[]');
      expect(stored).toHaveLength(10);
      // feature-0 and feature-1 should be evicted
      expect(stored.map((e: { id: string }) => e.id)).not.toContain('feature-0');
    });
  });

  describe('getPreloadHints', () => {
    it('returns empty array on empty localStorage', () => {
      expect(getPreloadHints()).toEqual([]);
    });

    it('returns empty array on corrupted JSON', () => {
      localStorage.setItem(PRELOAD_KEY, 'not-valid-json{{{');
      expect(getPreloadHints()).toEqual([]);
    });

    it('returns empty array when stored value is wrong type (object)', () => {
      localStorage.setItem(PRELOAD_KEY, JSON.stringify({ id: 'canvas' }));
      expect(getPreloadHints()).toEqual([]);
    });

    it('returns empty array when stored value is array of non-objects', () => {
      localStorage.setItem(PRELOAD_KEY, JSON.stringify(['canvas', 'graph']));
      expect(getPreloadHints()).toEqual([]);
    });

    it('filters out entries older than 30 days', () => {
      const oldDate = new Date(Date.now() - 31 * 86_400_000).toISOString();
      const recentDate = new Date().toISOString();
      localStorage.setItem(
        PRELOAD_KEY,
        JSON.stringify([
          { id: 'old-feature', usedAt: oldDate },
          { id: 'recent-feature', usedAt: recentDate },
        ])
      );
      const hints = getPreloadHints();
      expect(hints).not.toContain('old-feature');
      expect(hints).toContain('recent-feature');
    });

    it('rejects entries with id longer than 50 chars', () => {
      const longId = 'a'.repeat(51);
      localStorage.setItem(
        PRELOAD_KEY,
        JSON.stringify([
          { id: longId, usedAt: new Date().toISOString() },
          { id: 'valid', usedAt: new Date().toISOString() },
        ])
      );
      const hints = getPreloadHints();
      expect(hints).not.toContain(longId);
      expect(hints).toContain('valid');
    });
  });

  describe('preloadPreviouslyUsedFeatures', () => {
    it('silently skips unknown feature IDs', () => {
      localStorage.setItem(
        PRELOAD_KEY,
        JSON.stringify([{ id: 'unknown-feature-xyz', usedAt: new Date().toISOString() }])
      );
      // Should not throw
      expect(() => preloadPreviouslyUsedFeatures()).not.toThrow();
    });

    it('does not throw if localStorage is empty', () => {
      expect(() => preloadPreviouslyUsedFeatures()).not.toThrow();
    });
  });

  describe('clearStalePreloadHints', () => {
    it('removes entries older than 30 days', () => {
      const oldDate = new Date(Date.now() - 31 * 86_400_000).toISOString();
      localStorage.setItem(
        PRELOAD_KEY,
        JSON.stringify([
          { id: 'stale', usedAt: oldDate },
          { id: 'fresh', usedAt: new Date().toISOString() },
        ])
      );
      clearStalePreloadHints();
      const stored = JSON.parse(localStorage.getItem(PRELOAD_KEY) ?? '[]');
      expect(stored.map((e: { id: string }) => e.id)).not.toContain('stale');
      expect(stored.map((e: { id: string }) => e.id)).toContain('fresh');
    });

    it('skips pruning if run within 7 days of last prune', () => {
      const recentPrune = new Date().toISOString();
      localStorage.setItem(PRUNE_KEY, recentPrune);
      const oldDate = new Date(Date.now() - 31 * 86_400_000).toISOString();
      localStorage.setItem(PRELOAD_KEY, JSON.stringify([{ id: 'stale', usedAt: oldDate }]));
      clearStalePreloadHints();
      // Stale entry should NOT be removed (prune skipped)
      const stored = JSON.parse(localStorage.getItem(PRELOAD_KEY) ?? '[]');
      expect(stored.map((e: { id: string }) => e.id)).toContain('stale');
    });
  });
});
