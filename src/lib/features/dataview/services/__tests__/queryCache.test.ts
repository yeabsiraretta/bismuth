import { describe, it, expect, beforeEach } from 'vitest';
import { QueryCache } from '../queryCache';
import type { DvListResult } from '../../types/dataview';

function fakeResult(count: number): DvListResult {
  return {
    type: 'list',
    items: Array(count).fill({ value: 'x', page: { type: 'link', path: 'a.md' } }),
    totalCount: count,
  };
}

describe('QueryCache', () => {
  let cache: QueryCache;

  beforeEach(() => {
    cache = new QueryCache(4, 60_000);
  });

  it('returns null for missing entries', () => {
    expect(cache.get('LIST')).toBeNull();
  });

  it('caches and retrieves a result', () => {
    const r = fakeResult(3);
    cache.set('LIST', r);
    expect(cache.get('LIST')).toBe(r);
    expect(cache.size).toBe(1);
  });

  it('invalidate clears all entries and bumps version', () => {
    cache.set('a', fakeResult(1));
    cache.set('b', fakeResult(2));
    expect(cache.size).toBe(2);
    cache.invalidate();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeNull();
    expect(cache.currentVersion).toBe(1);
  });

  it('evicts oldest entry when max size is reached', () => {
    cache.set('a', fakeResult(1));
    cache.set('b', fakeResult(2));
    cache.set('c', fakeResult(3));
    cache.set('d', fakeResult(4));
    expect(cache.size).toBe(4);
    cache.set('e', fakeResult(5));
    expect(cache.size).toBe(4);
    expect(cache.get('a')).toBeNull();
    expect(cache.get('e')).not.toBeNull();
  });

  it('expires entries past TTL', () => {
    const shortCache = new QueryCache(4, 10);
    shortCache.set('a', fakeResult(1));
    const orig = Date.now;
    Date.now = () => orig() + 20;
    expect(shortCache.get('a')).toBeNull();
    Date.now = orig;
  });

  it('stats returns cache metadata', () => {
    cache.set('a', fakeResult(1));
    const s = cache.stats();
    expect(s.size).toBe(1);
    expect(s.maxSize).toBe(4);
    expect(s.version).toBe(0);
  });

  it('clear empties cache without bumping version', () => {
    cache.set('a', fakeResult(1));
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.currentVersion).toBe(0);
  });
});
