import { writable } from 'svelte/store';
import { log } from '@/utils/logger';

export interface RecentFileEntry {
  path: string;
  title: string;
  timestamp: number;
}

const STORAGE_KEY = 'bismuth-recent-files';
const MAX_ENTRIES = 50;

function loadRecent(): RecentFileEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as RecentFileEntry[];
    }
  } catch (e) { log.warn('Failed to load recent files from localStorage', { error: String(e) }); }
  return [];
}

function persistRecent(entries: RecentFileEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) { log.warn('Failed to persist recent files to localStorage', { error: String(e) }); }
}

function createRecentFilesStore() {
  const { subscribe, set, update } = writable<RecentFileEntry[]>(loadRecent());

  return {
    subscribe,
    /** Add a file to the recent list (moves to top if already present) */
    addRecent(path: string, title: string): void {
      update((current) => {
        const filtered = current.filter(e => e.path !== path);
        const next = [{ path, title, timestamp: Date.now() }, ...filtered].slice(0, MAX_ENTRIES);
        persistRecent(next);
        return next;
      });
    },
    /** Remove a specific entry from the recent list */
    removeRecent(path: string): void {
      update((current) => {
        const next = current.filter(e => e.path !== path);
        persistRecent(next);
        return next;
      });
    },
    /** Clear all recent files */
    clearRecent(): void {
      localStorage.removeItem(STORAGE_KEY);
      set([]);
    },
    /** Clear on vault switch */
    clearForVaultSwitch(): void {
      localStorage.removeItem(STORAGE_KEY);
      set([]);
    },
  };
}

export const recentFiles = createRecentFilesStore();
