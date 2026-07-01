/**
 * LRU query cache for Dataview.
 *
 * Caches parsed query results keyed by query string + index version.
 * Automatically invalidates on index rebuild (version bump).
 * Configurable max size to bound memory usage.
 */

import type { DvResult } from '@/features/dataview/types/dataview';
import { log } from '@/utils/logger';

interface CacheEntry {
  result: DvResult;
  version: number;
  timestamp: number;
}

const DEFAULT_MAX_SIZE = 64;
const DEFAULT_TTL_MS = 30_000;

export class QueryCache {
  private cache = new Map<string, CacheEntry>();
  private version = 0;
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = DEFAULT_MAX_SIZE, ttlMs = DEFAULT_TTL_MS) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /** Get a cached result if valid. */
  get(queryStr: string): DvResult | null {
    const entry = this.cache.get(queryStr);
    if (!entry) return null;
    if (entry.version !== this.version) {
      this.cache.delete(queryStr);
      return null;
    }
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(queryStr);
      return null;
    }
    // Move to end (most recently used)
    this.cache.delete(queryStr);
    this.cache.set(queryStr, entry);
    return entry.result;
  }

  /** Store a result in the cache. */
  set(queryStr: string, result: DvResult): void {
    if (this.cache.size >= this.maxSize) {
      // Evict oldest (first key)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(queryStr, { result, version: this.version, timestamp: Date.now() });
  }

  /** Bump version to invalidate all entries. Called on index rebuild. */
  invalidate(): void {
    this.version++;
    this.cache.clear();
    log.debug('Dataview cache invalidated', { version: this.version });
  }

  /** Number of cached entries. */
  get size(): number {
    return this.cache.size;
  }

  /** Current version (increments on each invalidation). */
  get currentVersion(): number {
    return this.version;
  }

  /** Clear the entire cache without bumping version. */
  clear(): void {
    this.cache.clear();
  }

  /** Get cache hit/miss stats. */
  stats(): { size: number; version: number; maxSize: number; ttlMs: number } {
    return {
      size: this.cache.size,
      version: this.version,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
    };
  }
}

/** Singleton query cache instance. */
export const queryCache = new QueryCache();
