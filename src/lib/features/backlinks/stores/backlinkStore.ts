/**
 * Backlink store — reactive Svelte store wrapping BacklinkCache.
 * Provides auto-invalidation when notes change and a safe() async mode.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { BacklinkCache, type NoteInput } from '../services/backlinkCache';
import type { CachedBacklink, CacheStats, BacklinkCacheSettings } from '../types';
import { DEFAULT_CACHE_SETTINGS } from '../types';

// ─── Storage ─────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'bismuth-backlink-cache-settings';

function loadSettings(): BacklinkCacheSettings {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    return s ? { ...DEFAULT_CACHE_SETTINGS, ...JSON.parse(s) } : DEFAULT_CACHE_SETTINGS;
  } catch { return DEFAULT_CACHE_SETTINGS; }
}

// ─── Core stores ─────────────────────────────────────────────────────────────

export const cacheSettings = writable<BacklinkCacheSettings>(loadSettings());
export const cacheStats = writable<CacheStats>({
  totalFiles: 0, totalLinks: 0, buildTime: 0,
  canvasFiles: 0, isComplete: false, lastBuild: 0,
});
export const cacheBuilding = writable(false);
export const cacheVersion = writable(0);

cacheSettings.subscribe(v => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(v));
});

// ─── Singleton cache instance ────────────────────────────────────────────────

let cacheInstance: BacklinkCache | null = null;

function getCache(): BacklinkCache {
  if (!cacheInstance) {
    cacheInstance = new BacklinkCache(get(cacheSettings));
  }
  return cacheInstance;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Build cache from all vault notes. Call on startup. */
export function buildCache(notes: NoteInput[]): void {
  cacheBuilding.set(true);
  try {
    const cache = getCache();
    cache.buildFromNotes(notes);
    cacheStats.set(cache.getStats());
    cacheVersion.update(v => v + 1);
    log.info('Backlink cache built', { ...cache.getStats() });
  } catch (error) {
    log.error('Failed to build backlink cache', error as Error);
  } finally {
    cacheBuilding.set(false);
  }
}

/** Update cache for a single changed file */
export function updateCacheForFile(note: NoteInput): void {
  const cache = getCache();
  const changed = cache.updateFile(note);
  if (changed) {
    cacheStats.set(cache.getStats());
    cacheVersion.update(v => v + 1);
  }
}

/** Remove a file from the cache */
export function removeCacheForFile(path: string): void {
  const cache = getCache();
  cache.removeFile(path);
  cacheStats.set(cache.getStats());
  cacheVersion.update(v => v + 1);
}

/** Get backlinks for a file path (fast, cached) */
export function getCachedBacklinks(pathOrTitle: string): CachedBacklink[] {
  return getCache().getBacklinksForFile(pathOrTitle);
}

/** Get backlinks count for a file */
export function getCachedBacklinkCount(path: string): number {
  return getCache().getBacklinkCount(path);
}

/**
 * Safe backlink lookup — rebuilds cache from fresh data first.
 * Ensures 100% accuracy after recent file changes.
 */
export async function getCachedBacklinksSafe(pathOrTitle: string): Promise<CachedBacklink[]> {
  const { scanVaultMeta } = await import('@/services/vault/vault');
  const { getNote } = await import('@/services/vault/vault');
  const meta = await scanVaultMeta();
  const notes: NoteInput[] = [];
  for (const m of meta) {
    try {
      const full = await getNote(m.path);
      notes.push({ path: m.path, title: m.title, content: full.content, frontmatter: full.frontmatter });
    } catch { /* skip unreadable */ }
  }
  buildCache(notes);
  return getCachedBacklinks(pathOrTitle);
}

/** Clear the cache completely */
export function clearCache(): void {
  getCache().clear();
  cacheStats.set({ totalFiles: 0, totalLinks: 0, buildTime: 0, canvasFiles: 0, isComplete: false, lastBuild: 0 });
  cacheVersion.update(v => v + 1);
}

/** Update cache settings and rebuild */
export function updateCacheSettings(updates: Partial<BacklinkCacheSettings>): void {
  cacheSettings.update(s => ({ ...s, ...updates }));
  cacheInstance = new BacklinkCache(get(cacheSettings));
}

// ─── Derived for active note ─────────────────────────────────────────────────

/** Create a derived store of backlinks for a given path */
export function backlinkCountForPath(path: string) {
  return derived(cacheVersion, () => getCache().getBacklinkCount(path));
}
