import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { createPersistedStore } from '../persistedStore';

describe('createPersistedStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default when key is missing', () => {
    const store = createPersistedStore('test-key', { count: 0 });
    expect(get(store)).toEqual({ count: 0 });
  });

  it('loads stored value when present', () => {
    localStorage.setItem('test-key', JSON.stringify({ count: 42 }));
    const store = createPersistedStore('test-key', { count: 0 });
    expect(get(store)).toEqual({ count: 42 });
  });

  it('falls back to default on parse error', () => {
    localStorage.setItem('test-key', 'not-json{{{');
    const store = createPersistedStore('test-key', { count: 0 });
    expect(get(store)).toEqual({ count: 0 });
  });

  it('auto-persists on subscription update', () => {
    const store = createPersistedStore('test-key', { count: 0 });
    store.set({ count: 99 });
    const raw = localStorage.getItem('test-key');
    expect(JSON.parse(raw!)).toEqual({ count: 99 });
  });

  it('applies migration function to stored data', () => {
    localStorage.setItem('test-key', JSON.stringify({ old_field: 'hello' }));
    const store = createPersistedStore(
      'test-key',
      { name: 'default' },
      {
        migrate: (raw) => {
          const data = raw as { old_field?: string };
          return { name: data.old_field ?? 'default' };
        },
      }
    );
    expect(get(store)).toEqual({ name: 'hello' });
  });

  it('uses custom serializer and deserializer', () => {
    const store = createPersistedStore('test-key', 'hello', {
      serialize: (v) => v.toUpperCase(),
      deserialize: (raw) => raw.toLowerCase(),
    });
    store.set('world');
    expect(localStorage.getItem('test-key')).toBe('WORLD');

    const store2 = createPersistedStore('test-key', 'hello', {
      serialize: (v) => v.toUpperCase(),
      deserialize: (raw) => raw.toLowerCase(),
    });
    expect(get(store2)).toBe('world');
  });
});
