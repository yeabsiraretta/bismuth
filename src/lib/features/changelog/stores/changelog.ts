import { writable, get } from 'svelte/store';
import { getRecentChangelog, appendChangelog } from '../services/changelog';
import type { ChangelogEntry } from '../types';
import { writeNote } from '@/services/vault/vault';
import { currentVault } from '@/stores/vault/vault';
import { settings } from '@/features/settings';
import { log } from '@/utils/logger';
import { subscribeChangelogEvent } from '../services/changelogEvents';

/** Recent changelog entries for the active vault. */
export const changelogEntries = writable<ChangelogEntry[]>([]);

/** Loading state for changelog fetches. */
export const changelogLoading = writable(false);

/** Accumulated event unlisten handles. */
let unlisteners: Array<() => Promise<void>> = [];

/** Refreshes changelog entries from the backend. */
export async function refreshChangelog(limit?: number): Promise<void> {
  const s = get(settings);
  changelogLoading.set(true);
  try {
    const entries = await getRecentChangelog(limit ?? s.changelogMaxFiles);
    const excluded = parseExcludedFolders(s.changelogExcludedFolders);
    const filtered = excluded.length > 0
      ? entries.filter(e => !excluded.some(folder => e.path.includes(`/${folder}/`) || e.path.startsWith(`${folder}/`)))
      : entries;
    changelogEntries.set(filtered.slice(0, s.changelogMaxFiles));
  } catch {
    // Silently fail — changelog is non-critical
  } finally {
    changelogLoading.set(false);
  }
}

/** Writes the changelog to a dedicated .md file in the vault. */
export async function writeChangelogFile(): Promise<void> {
  const vault = get(currentVault);
  if (!vault) return;

  const s = get(settings);
  const entries = get(changelogEntries);
  const lines: string[] = [];

  if (s.changelogHeading) {
    lines.push(s.changelogHeading);
    lines.push('');
  }

  for (const entry of entries) {
    const datetime = formatDatetime(entry.timestamp, s.changelogDatetimeFormat);
    const name = entry.path.split('/').pop()?.replace(/\.md$/, '') ?? entry.path;
    const formatted = s.changelogUseWikilinks ? `[[${name}]]` : name;
    lines.push(`- ${datetime} · ${formatted}`);
  }

  const content = lines.join('\n') + '\n';
  const fullPath = `${vault.root_path}/${s.changelogPath}`;

  try {
    await writeNote(fullPath, content);
    log.info('Changelog file written', { path: fullPath });
  } catch (err) {
    log.error('Failed to write changelog file', err as Error);
  }
}

/** Updates changelog: appends the entry, refreshes store, and optionally writes file. */
export async function updateChangelog(path: string, action: ChangelogEntry['action'], wordsDelta = 0): Promise<void> {
  const s = get(settings);
  const excluded = parseExcludedFolders(s.changelogExcludedFolders);

  // Skip excluded folders
  if (excluded.some(folder => path.includes(`/${folder}/`) || path.startsWith(`${folder}/`))) {
    return;
  }

  // Skip the changelog file itself
  if (path.endsWith(s.changelogPath)) return;

  try {
    await appendChangelog(path, action, wordsDelta);
    await refreshChangelog();
    await writeChangelogFile();
  } catch (err) {
    log.error('Failed to update changelog', err as Error);
  }
}

/** Sets up auto-update listeners for vault file events. */
export async function setupChangelogAutoUpdate(): Promise<void> {
  cleanupChangelogListeners();

  const onFile = (action: ChangelogEntry['action']) => (payload: { path: string }) => {
    const s = get(settings);
    if (!s.changelogAutoUpdate) return;
    updateChangelog(payload.path, action);
  };

  unlisteners.push(subscribeChangelogEvent('vault://file-created', onFile('created')));
  unlisteners.push(subscribeChangelogEvent('vault://file-modified', onFile('modified')));
  unlisteners.push(subscribeChangelogEvent('vault://file-deleted', onFile('deleted')));
}

/** Tears down auto-update event listeners. */
export function cleanupChangelogListeners(): void {
  unlisteners.forEach((fn) => fn());
  unlisteners = [];
}

/** Parses comma-separated excluded folders string. */
function parseExcludedFolders(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/** Formats an ISO timestamp to the configured datetime format. */
function formatDatetime(iso: string, format: string): string {
  try {
    const d = new Date(iso);
    const yyyy = d.getFullYear().toString();
    const MM = (d.getMonth() + 1).toString().padStart(2, '0');
    const DD = d.getDate().toString().padStart(2, '0');
    const HH = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const ss = d.getSeconds().toString().padStart(2, '0');

    return format
      .replace('YYYY', yyyy)
      .replace('MM', MM)
      .replace('DD', DD)
      .replace('HH', HH)
      .replace('mm', mm)
      .replace('ss', ss);
  } catch {
    return iso;
  }
}
