/**
 * Version store for the knowledge versioning feature (spec 051).
 *
 * Holds the active file's version history and the currently selected entry
 * for diff viewing. Actions delegate to the versioning service wrappers.
 *
 * @module versioning/stores/versionStore
 */

import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { log } from '@/utils/logger';
import { listVersions } from '../services/versioning';
import type { VersionEntry, VersionHistory } from '../types/versioning';

/** The version history for the currently active note or canvas document. */
export const activeVersionHistory: Writable<VersionHistory | null> = writable(null);

/** The version entry selected for diff viewing. */
export const selectedEntry: Writable<VersionEntry | null> = writable(null);

/** True while an async version history load is in progress. */
export const isLoading: Writable<boolean> = writable(false);

/**
 * Derived: current version string from the active history's first entry,
 * or `null` when no history is loaded.
 */
export const currentVersion = derived(
  activeVersionHistory,
  ($h) => ($h?.entries[0]?.version ?? $h?.currentVersion ?? null),
);

/**
 * Load the version history for `fileId` and update `activeVersionHistory`.
 *
 * Sets `isLoading` to `true` for the duration of the async call.
 * Logs errors via the unified logger and leaves the store in its previous
 * state when the call fails.
 */
export async function loadVersionHistory(vaultRoot: string, fileId: string): Promise<void> {
  isLoading.set(true);
  try {
    const entries = await listVersions(vaultRoot, fileId);
    const currentVer = entries[0]?.version ?? '0.1.0';
    activeVersionHistory.set({
      fileId,
      currentVersion: currentVer,
      entries,
    });
    log.debug('Versioning: version history loaded', { fileId, count: entries.length });
  } catch (err) {
    log.warn('Versioning: failed to load version history', { fileId, error: String(err) });
  } finally {
    isLoading.set(false);
  }
}

/**
 * Select a version entry for diff viewing.
 * Updates `selectedEntry` and logs the selection.
 */
export function selectEntry(entry: VersionEntry): void {
  selectedEntry.set(entry);
  log.debug('Versioning: entry selected', { version: entry.version });
}

/**
 * Clear both the active history and the selected entry.
 * Called when the user navigates away from the current note.
 */
export function clearHistory(): void {
  activeVersionHistory.set(null);
  selectedEntry.set(null);
  log.debug('Versioning: history cleared');
}
