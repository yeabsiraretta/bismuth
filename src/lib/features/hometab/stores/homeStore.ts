/** Home tab store — manages recent files, bookmarks, and settings. */

import { writable, derived, get } from 'svelte/store';
import { notes, activeNote } from '@/stores/vault/vault';
import { log } from '@/utils/logger';
import type { HomeBookmark, HomeTabSettings } from '../types';
import { DEFAULT_HOME_SETTINGS } from '../types';

const SETTINGS_KEY = 'bismuth:home-tab-settings';
const BOOKMARKS_KEY = 'bismuth:home-bookmarks';
const RECENT_KEY = 'bismuth:home-recent-files';
const MAX_RECENT = 20;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveJson<T>(key: string, val: T): void {
  try { localStorage.setItem(key, JSON.stringify(val)); }
  catch (e) { log.warn('Failed to persist home tab data', { key, error: String(e) }); }
}

export const homeSettings = writable<HomeTabSettings>(loadJson(SETTINGS_KEY, DEFAULT_HOME_SETTINGS));
export const bookmarks = writable<HomeBookmark[]>(loadJson(BOOKMARKS_KEY, []));
export const recentFilePaths = writable<string[]>(loadJson(RECENT_KEY, []));

homeSettings.subscribe(v => saveJson(SETTINGS_KEY, v));
bookmarks.subscribe(v => saveJson(BOOKMARKS_KEY, v));
recentFilePaths.subscribe(v => saveJson(RECENT_KEY, v));

/** Recent notes derived from paths + vault notes. */
export const recentNotes = derived(
  [recentFilePaths, notes],
  ([$paths, $notes]) => {
    const noteMap = new Map($notes.map(n => [n.path, n]));
    return $paths
      .map(p => noteMap.get(p))
      .filter((n): n is NonNullable<typeof n> => !!n);
  },
);

export const bookmarkCount = derived(bookmarks, $b => $b.length);

/** Record a file open as a recent access. */
export function recordRecentFile(path: string): void {
  recentFilePaths.update(paths => {
    const updated = [path, ...paths.filter(p => p !== path)].slice(0, MAX_RECENT);
    return updated;
  });
}

/** Add a bookmark. */
export function addBookmark(path: string, title: string, icon?: string): void {
  bookmarks.update(list => {
    if (list.some(b => b.path === path)) return list;
    return [...list, { path, title, icon, addedAt: new Date().toISOString() }];
  });
}

/** Remove a bookmark. */
export function removeBookmark(path: string): void {
  bookmarks.update(list => list.filter(b => b.path !== path));
}

/** Check if a path is bookmarked. */
export function isBookmarked(path: string): boolean {
  return get(bookmarks).some(b => b.path === path);
}

/** Update home tab settings. */
export function updateHomeSettings(partial: Partial<HomeTabSettings>): void {
  homeSettings.update(s => ({ ...s, ...partial }));
}

/** Track the active note in recent files. */
let lastTrackedPath = '';
export function setupRecentTracking(): () => void {
  return activeNote.subscribe(note => {
    if (note?.path && note.path !== lastTrackedPath) {
      lastTrackedPath = note.path;
      recordRecentFile(note.path);
    }
  });
}
