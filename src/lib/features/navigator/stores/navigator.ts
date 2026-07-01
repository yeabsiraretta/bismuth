/**
 * Navigator Store
 * Manages state for the two-pane Navigator component
 */

import { writable, derived, get } from 'svelte/store';
import type { Note } from '@/types/data/vault';
import { log } from '@/utils/logger';
import { readNavigatorState, writeNavigatorState } from '../services/navigator';

export interface NavigatorProfile {
  id: string;
  name: string;
  hiddenFolderGlobs: string[];
  hiddenTagPatterns: string[];
  sortPreference: 'name' | 'date' | 'pinned';
  sortDirection: 'asc' | 'desc';
}

export type NavigatorPane = 'navigation' | 'list';
export type NavigatorSortField = 'name' | 'modified' | 'created';

export interface NavigatorState {
  selectedFolder: string | null;
  selectedNote: Note | null;
  activeProfile: string;
  activeTab: 'folders' | 'tags' | 'properties';
  activePane: NavigatorPane;
  sortField: NavigatorSortField;
  sortDirection: 'asc' | 'desc';
  filterQuery: string;
  pinnedNotes: Record<string, string[]>; // folder path -> note paths
  folderColors: Record<string, string>;
  folderIcons: Record<string, string>;
  fileColors: Record<string, string>;
  fileIcons: Record<string, string>;
  shortcuts: Array<{
    type: 'note' | 'folder' | 'tag' | 'search';
    path: string;
    label: string;
  }>;
}

const defaultState: NavigatorState = {
  selectedFolder: null,
  selectedNote: null,
  activeProfile: 'default',
  activeTab: 'folders',
  activePane: 'navigation',
  sortField: 'name',
  sortDirection: 'asc',
  filterQuery: '',
  pinnedNotes: {},
  folderColors: {},
  folderIcons: {},
  fileColors: {},
  fileIcons: {},
  shortcuts: [],
};

export const navigatorStore = writable<NavigatorState>(defaultState);

export const profiles = writable<NavigatorProfile[]>([
  {
    id: 'default',
    name: 'Default',
    hiddenFolderGlobs: ['.git', 'node_modules', '.bismuth'],
    hiddenTagPatterns: [],
    sortPreference: 'name',
    sortDirection: 'asc',
  },
]);

// Derived stores
export const selectedFolder = derived(
  navigatorStore,
  ($store) => $store.selectedFolder
);

export const selectedNote = derived(
  navigatorStore,
  ($store) => $store.selectedNote
);

export const activeProfile = derived(
  [navigatorStore, profiles],
  ([$store, $profiles]) =>
    $profiles.find(p => p.id === $store.activeProfile) || $profiles[0]
);

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Sets the currently selected folder in the navigator. */
export function selectFolder(path: string | null) {
  navigatorStore.update(state => ({
    ...state,
    selectedFolder: path,
  }));
}

/** Sets the currently selected note in the navigator. */
export function selectNote(note: Note | null) {
  navigatorStore.update(state => ({
    ...state,
    selectedNote: note,
  }));
}

/** Switches the active navigator panel tab. */
export function setActiveTab(tab: 'folders' | 'tags' | 'properties') {
  navigatorStore.update(state => ({
    ...state,
    activeTab: tab,
  }));
}

/** Sets the active pane (navigation or list). */
export function setActivePane(pane: NavigatorPane) {
  navigatorStore.update(state => ({ ...state, activePane: pane }));
}

/** Toggles between navigation and list panes. */
export function togglePane() {
  navigatorStore.update(state => ({
    ...state,
    activePane: state.activePane === 'navigation' ? 'list' : 'navigation',
  }));
}

/** Sets the sort field for the file list. */
export function setSortField(field: NavigatorSortField) {
  navigatorStore.update(state => ({ ...state, sortField: field }));
}

/** Toggles sort direction. */
export function toggleSortDirection() {
  navigatorStore.update(state => ({
    ...state,
    sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
  }));
}

/** Sets the filter query. */
export function setFilterQuery(query: string) {
  navigatorStore.update(state => ({ ...state, filterQuery: query }));
}

/** Activates a different navigator profile by ID. */
export function switchProfile(profileId: string) {
  navigatorStore.update(state => ({
    ...state,
    activeProfile: profileId,
  }));
}

/** Pins a note to the top of a folder's file list. */
export function pinNote(folderPath: string, notePath: string) {
  navigatorStore.update(state => {
    const pinnedInFolder = state.pinnedNotes[folderPath] || [];
    if (!pinnedInFolder.includes(notePath)) {
      return {
        ...state,
        pinnedNotes: {
          ...state.pinnedNotes,
          [folderPath]: [...pinnedInFolder, notePath],
        },
      };
    }
    return state;
  });
}

/** Removes a note's pin from a folder's file list. */
export function unpinNote(folderPath: string, notePath: string) {
  navigatorStore.update(state => {
    const pinnedInFolder = state.pinnedNotes[folderPath] || [];
    return {
      ...state,
      pinnedNotes: {
        ...state.pinnedNotes,
        [folderPath]: pinnedInFolder.filter(p => p !== notePath),
      },
    };
  });
}

/** Assigns a custom accent color to a folder in the navigator. */
export function setFolderColor(path: string, color: string) {
  navigatorStore.update(state => ({
    ...state,
    folderColors: {
      ...state.folderColors,
      [path]: color,
    },
  }));
}

/** Assigns a custom icon to a folder in the navigator. */
export function setFolderIcon(path: string, icon: string) {
  navigatorStore.update(state => ({
    ...state,
    folderIcons: {
      ...state.folderIcons,
      [path]: icon,
    },
  }));
}

/** Assigns a custom accent color to a file in the navigator. */
export function setFileColor(path: string, color: string) {
  navigatorStore.update(state => ({
    ...state,
    fileColors: {
      ...state.fileColors,
      [path]: color,
    },
  }));
}

/** Assigns a custom icon to a file in the navigator. */
export function setFileIcon(path: string, icon: string) {
  navigatorStore.update(state => ({
    ...state,
    fileIcons: {
      ...state.fileIcons,
      [path]: icon,
    },
  }));
}

/** Adds a quick-access shortcut to the navigator (max 9). */
export function addShortcut(shortcut: NavigatorState['shortcuts'][0]) {
  navigatorStore.update(state => {
    if (state.shortcuts.length >= 9) {
      return state; // Max 9 shortcuts
    }
    return {
      ...state,
      shortcuts: [...state.shortcuts, shortcut],
    };
  });
}

/** Removes a quick-access shortcut by its index. */
export function removeShortcut(index: number) {
  navigatorStore.update(state => ({
    ...state,
    shortcuts: state.shortcuts.filter((_, i) => i !== index),
  }));
}

// ─── Persistence ─────────────────────────────────────────────────────────────

/** Loads the navigator state from `.bismuth/navigator.json` on disk. */
export async function loadNavigatorState() {
  const result = await readNavigatorState();
  if (result && typeof result === 'object') {
    const saved = result as Partial<NavigatorState>;
    navigatorStore.set({ ...defaultState, ...saved });
    log.info('Navigator state loaded from disk');
  } else {
    log.debug('No saved navigator state found, using defaults');
  }
}

/** Persists the current navigator state to `.bismuth/navigator.json`. */
export async function saveNavigatorState() {
  const state = get(navigatorStore);
  await writeNavigatorState(state);
}

/** Save profiles list to disk alongside navigator state */
export async function saveProfiles() {
  const currentProfiles = get(profiles);
  const state = get(navigatorStore);
  await writeNavigatorState({ ...state, _profiles: currentProfiles });
}

/** Add a new navigator profile */
export function addProfile(profile: NavigatorProfile) {
  profiles.update((p: NavigatorProfile[]) => [...p, profile]);
  saveProfiles();
}

/** Remove a profile by ID (cannot remove 'default') */
export function removeProfile(profileId: string) {
  if (profileId === 'default') return;
  profiles.update((p: NavigatorProfile[]) => p.filter((pr: NavigatorProfile) => pr.id !== profileId));
  navigatorStore.update((state: NavigatorState) => ({
    ...state,
    activeProfile: state.activeProfile === profileId ? 'default' : state.activeProfile,
  }));
  saveProfiles();
}
