/**
 * Navigator expanded actions — navigation history, tag/property selection,
 * search state, and note selection helpers.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { navigatorStore, selectFolder, setActiveTab, setActivePane } from './navigator';
import { notes } from '@/stores/vault/vault';
import type { Note } from '@/types/data/vault';

// ─── Navigation History ──────────────────────────────────────────────────────

interface NavHistoryEntry {
  type: 'folder' | 'tag' | 'property';
  path: string;
  tab: 'folders' | 'tags' | 'properties';
}

const MAX_HISTORY = 50;

export const navHistory = writable<NavHistoryEntry[]>([]);
export const navHistoryIndex = writable<number>(-1);

/** Push a navigation entry to history (truncates forward history). */
export function pushNavHistory(entry: NavHistoryEntry) {
  navHistory.update(h => {
    const idx = get(navHistoryIndex);
    const truncated = h.slice(0, idx + 1);
    truncated.push(entry);
    if (truncated.length > MAX_HISTORY) truncated.shift();
    return truncated;
  });
  navHistoryIndex.set(get(navHistory).length - 1);
}

/** Navigate back in history. */
export function navigateBack() {
  const idx = get(navHistoryIndex);
  if (idx <= 0) return;
  const newIdx = idx - 1;
  navHistoryIndex.set(newIdx);
  const entry = get(navHistory)[newIdx];
  applyNavEntry(entry);
  log.debug('Navigator: back', { index: newIdx, type: entry.type, path: entry.path });
}

/** Navigate forward in history. */
export function navigateForward() {
  const idx = get(navHistoryIndex);
  const h = get(navHistory);
  if (idx >= h.length - 1) return;
  const newIdx = idx + 1;
  navHistoryIndex.set(newIdx);
  const entry = h[newIdx];
  applyNavEntry(entry);
  log.debug('Navigator: forward', { index: newIdx, type: entry.type, path: entry.path });
}

function applyNavEntry(entry: NavHistoryEntry) {
  setActiveTab(entry.tab);
  if (entry.type === 'folder') {
    selectFolder(entry.path);
  } else if (entry.type === 'tag') {
    selectTag(entry.path, false);
  } else if (entry.type === 'property') {
    selectProperty(entry.path, false);
  }
}

export const canGoBack = derived(navHistoryIndex, ($idx) => $idx > 0);
export const canGoForward = derived(
  [navHistoryIndex, navHistory],
  ([$idx, $h]) => $idx < $h.length - 1
);

// ─── Tag Selection ───────────────────────────────────────────────────────────

export const selectedTag = writable<string | null>(null);

/** Select a tag and optionally push to history. Shows notes with that tag. */
export function selectTag(tagName: string | null, pushHistory = true) {
  selectedTag.set(tagName);
  navigatorStore.update(s => ({ ...s, activeTab: 'tags' }));
  if (tagName && pushHistory) {
    pushNavHistory({ type: 'tag', path: tagName, tab: 'tags' });
  }
  setActivePane('list');
}

/** Notes filtered by selected tag. */
export const tagFilteredNotes = derived(
  [notes, selectedTag],
  ([$notes, $tag]) => {
    if (!$tag) return [];
    return $notes.filter((note: Note) => {
      const fmTags = note.frontmatter?.['tags'];
      if (Array.isArray(fmTags) && fmTags.includes($tag)) return true;
      const inlineTags = note.content?.match(/#([a-zA-Z0-9_/-]+)/g) || [];
      return inlineTags.some((t: string) => t.slice(1) === $tag || t.slice(1).startsWith($tag + '/'));
    });
  }
);

// ─── Property Selection ──────────────────────────────────────────────────────

export interface PropertySelection {
  key: string;
  value?: string;
}

export const selectedProperty = writable<PropertySelection | null>(null);

/** Select a property key (and optionally value) to filter notes. */
export function selectProperty(keyOrPath: string, pushHistory = true) {
  const parts = keyOrPath.split('=');
  const sel: PropertySelection = parts.length > 1
    ? { key: parts[0], value: parts[1] }
    : { key: parts[0] };
  selectedProperty.set(sel);
  navigatorStore.update(s => ({ ...s, activeTab: 'properties' }));
  if (pushHistory) {
    pushNavHistory({ type: 'property', path: keyOrPath, tab: 'properties' });
  }
  setActivePane('list');
}

/** Notes filtered by selected property. */
export const propertyFilteredNotes = derived(
  [notes, selectedProperty],
  ([$notes, $prop]) => {
    if (!$prop) return [];
    return $notes.filter((note: Note) => {
      const fm = note.frontmatter;
      if (!fm) return false;
      const val = fm[$prop.key];
      if (val === undefined) return false;
      if ($prop.value === undefined) return true;
      return String(val).toLowerCase().includes($prop.value.toLowerCase());
    });
  }
);

// ─── Multi-Select ────────────────────────────────────────────────────────────

export const selectedNotes = writable<Set<string>>(new Set());

/** Toggle note selection (for Cmd/Ctrl+Click). */
export function toggleNoteSelection(path: string) {
  selectedNotes.update(s => {
    const next = new Set(s);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    return next;
  });
}

/** Select a range of notes between anchor and target. */
export function selectNoteRange(allPaths: string[], anchor: string, target: string) {
  const startIdx = allPaths.indexOf(anchor);
  const endIdx = allPaths.indexOf(target);
  if (startIdx === -1 || endIdx === -1) return;
  const low = Math.min(startIdx, endIdx);
  const high = Math.max(startIdx, endIdx);
  selectedNotes.set(new Set(allPaths.slice(low, high + 1)));
}

/** Select all notes in current view. */
export function selectAllNotes(paths: string[]) {
  selectedNotes.set(new Set(paths));
}

/** Clear selection. */
export function clearNoteSelection() {
  selectedNotes.set(new Set());
}

// ─── Folder Selection with History ───────────────────────────────────────────

/** Select folder and push to navigation history. */
export function selectFolderWithHistory(path: string | null) {
  selectFolder(path);
  if (path) {
    pushNavHistory({ type: 'folder', path, tab: 'folders' });
  }
}

// ─── Search State ────────────────────────────────────────────────────────────

export const searchOpen = writable<boolean>(false);
export const searchQuery = writable<string>('');

/** Toggle search visibility. */
export function toggleSearch() {
  searchOpen.update(v => !v);
}

/** Set search query and update navigator filter. */
export function setSearchQuery(query: string) {
  searchQuery.set(query);
}

// ─── Reset ───────────────────────────────────────────────────────────────────

/** Reset all ephemeral navigator state. Call on mount/refresh to clear stale HMR state. */
export function resetEphemeralState() {
  navHistory.set([]);
  navHistoryIndex.set(-1);
  selectedTag.set(null);
  selectedProperty.set(null);
  selectedNotes.set(new Set());
  searchOpen.set(false);
  searchQuery.set('');
}
