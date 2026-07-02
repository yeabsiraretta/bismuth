import { invoke } from '@tauri-apps/api/core';
import type { ChangelogEntry } from '../types';

/** Appends a changelog entry for the current vault. */
export async function appendChangelog(
  path: string,
  action: ChangelogEntry['action'],
  wordsDelta: number
): Promise<void> {
  await invoke('changelog_append', {
    path,
    action,
    wordsDelta,
  });
}

/** Fetches the most recent changelog entries. */
export async function getRecentChangelog(limit?: number): Promise<ChangelogEntry[]> {
  return invoke<ChangelogEntry[]>('changelog_recent', { limit: limit ?? 100 });
}
