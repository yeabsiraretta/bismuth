/**
 * Navigator Store
 * Manages state for the two-pane Navigator component
 */

import { writable, derived } from 'svelte/store';
import type { Note } from '@/types/vault';

export interface NavigatorProfile {
  id: string;
  name: string;
  hiddenFolderGlobs: string[];
  hiddenTagPatterns: string[];
  sortPreference: 'name' | 'date' | 'pinned';
  sortDirection: 'asc' | 'desc';
}

export interface NavigatorState {
  selectedFolder: string | null;
  selectedNote: Note | null;
  activeProfile: string;
  activeTab: 'folders' | 'tags' | 'properties';
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

// Actions
export function selectFolder(path: string | null) {
  navigatorStore.update(state => ({
    ...state,
    selectedFolder: path,
  }));
}

export function selectNote(note: Note | null) {
  navigatorStore.update(state => ({
    ...state,
    selectedNote: note,
  }));
}

export function setActiveTab(tab: 'folders' | 'tags' | 'properties') {
  navigatorStore.update(state => ({
    ...state,
    activeTab: tab,
  }));
}

export function switchProfile(profileId: string) {
  navigatorStore.update(state => ({
    ...state,
    activeProfile: profileId,
  }));
}

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

export function setFolderColor(path: string, color: string) {
  navigatorStore.update(state => ({
    ...state,
    folderColors: {
      ...state.folderColors,
      [path]: color,
    },
  }));
}

export function setFolderIcon(path: string, icon: string) {
  navigatorStore.update(state => ({
    ...state,
    folderIcons: {
      ...state.folderIcons,
      [path]: icon,
    },
  }));
}

export function setFileColor(path: string, color: string) {
  navigatorStore.update(state => ({
    ...state,
    fileColors: {
      ...state.fileColors,
      [path]: color,
    },
  }));
}

export function setFileIcon(path: string, icon: string) {
  navigatorStore.update(state => ({
    ...state,
    fileIcons: {
      ...state.fileIcons,
      [path]: icon,
    },
  }));
}

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

export function removeShortcut(index: number) {
  navigatorStore.update(state => ({
    ...state,
    shortcuts: state.shortcuts.filter((_, i) => i !== index),
  }));
}

// Persistence
export async function loadNavigatorState() {
  try {
    // TODO: Implement state persistence via backend IPC
    // const content = await invoke('read_navigator_state');
    // const saved = JSON.parse(content);
    // navigatorStore.set({ ...defaultState, ...saved });
    console.log('Navigator state persistence not yet implemented');
  } catch (error) {
    // File doesn't exist yet, use defaults
    console.log('Navigator state not found, using defaults');
  }
}

export async function saveNavigatorState() {
  try {
    // TODO: Implement state persistence via backend IPC
    // const state = await new Promise<NavigatorState>(resolve => {
    //   navigatorStore.subscribe(s => resolve(s))();
    // });
    // await invoke('write_navigator_state', { content: JSON.stringify(state, null, 2) });
    console.log('Navigator state persistence not yet implemented');
  } catch (error) {
    console.error('Failed to save navigator state:', error);
  }
}
