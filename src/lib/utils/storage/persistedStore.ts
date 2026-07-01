import { writable, type Writable } from 'svelte/store';
import { log } from '@/utils/logger';
import { schemaRegistry, versionedRead, versionedWrite } from '@/utils/compat';

export interface PersistedStoreOptions<T> {
  /** Optional migration function for schema changes */
  migrate?: (raw: unknown) => T;
  /** Optional custom serializer (default: JSON.stringify) */
  serialize?: (value: T) => string;
  /** Optional custom deserializer (default: JSON.parse) */
  deserialize?: (raw: string) => T;
  /** Disable N-1 version envelopes for this key (raw persistence). */
  disableVersioning?: boolean;
}

/**
 * Creates a Svelte writable store that auto-persists to localStorage.
 * Handles parse errors gracefully by falling back to defaultValue.
 *
 * If the key is registered in the N-1 compat schema registry:
 *   - Reads use `versionedRead` (auto-migration + forward-compat check).
 *   - Writes use `versionedWrite` (auto-stamps version envelope).
 * Unregistered keys or keys with `disableVersioning` use raw JSON.
 */
export function createPersistedStore<T>(
  key: string,
  defaultValue: T,
  options?: PersistedStoreOptions<T>
): Writable<T> {
  const serialize = options?.serialize ?? JSON.stringify;
  const deserialize = options?.deserialize ?? JSON.parse;
  const useEnvelope = !options?.disableVersioning && schemaRegistry.has(key);

  function load(): T {
    try {
      if (useEnvelope) {
        const { data } = versionedRead<T>(key, defaultValue);
        return options?.migrate ? options.migrate(data) : data;
      }
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      const parsed = deserialize(stored);
      return options?.migrate ? options.migrate(parsed) : (parsed as T);
    } catch {
      log.warn(`Failed to load persisted store "${key}", using default`);
      return defaultValue;
    }
  }

  const store = writable<T>(load());

  store.subscribe((value) => {
    try {
      if (useEnvelope) {
        versionedWrite(key, value);
      } else {
        localStorage.setItem(key, serialize(value));
      }
    } catch {
      log.warn(`Failed to persist store "${key}"`);
    }
  });

  return store;
}
