import { writable } from 'svelte/store';

export interface Hotkey {
  id: string;
  name: string;
  description: string;
  keys: string;
  action: () => void;
}

export interface HotkeyState {
  hotkeys: Map<string, Hotkey>;
  enabled: boolean;
}

const initialState: HotkeyState = {
  hotkeys: new Map(),
  enabled: true,
};

function createHotkeyStore() {
  const { subscribe, set, update } = writable<HotkeyState>(initialState);

  return {
    subscribe,
    
    register: (hotkey: Hotkey) => {
      update(state => {
        state.hotkeys.set(hotkey.id, hotkey);
        return state;
      });
    },

    unregister: (id: string) => {
      update(state => {
        state.hotkeys.delete(id);
        return state;
      });
    },

    execute: (keys: string) => {
      update(state => {
        if (!state.enabled) return state;
        
        for (const [, hotkey] of state.hotkeys) {
          if (hotkey.keys === keys) {
            hotkey.action();
            break;
          }
        }
        return state;
      });
    },

    toggle: () => {
      update(state => ({
        ...state,
        enabled: !state.enabled,
      }));
    },

    reset: () => set(initialState),
  };
}

export const hotkeyStore = createHotkeyStore();

// Default hotkeys
export const defaultHotkeys: Hotkey[] = [
  {
    id: 'new-note',
    name: 'New Note',
    description: 'Create a new note',
    keys: 'Cmd+N',
    action: () => console.log('New note'),
  },
  {
    id: 'search',
    name: 'Search',
    description: 'Open search panel',
    keys: 'Cmd+P',
    action: () => console.log('Search'),
  },
  {
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Open command palette',
    keys: 'Cmd+Shift+P',
    action: () => console.log('Command palette'),
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Open settings',
    keys: 'Cmd+,',
    action: () => console.log('Settings'),
  },
  {
    id: 'toggle-sidebar-left',
    name: 'Toggle Left Sidebar',
    description: 'Show/hide left sidebar',
    keys: 'Cmd+\\',
    action: () => console.log('Toggle left sidebar'),
  },
  {
    id: 'toggle-sidebar-right',
    name: 'Toggle Right Sidebar',
    description: 'Show/hide right sidebar',
    keys: 'Cmd+Shift+\\',
    action: () => console.log('Toggle right sidebar'),
  },
];

// Initialize default hotkeys
defaultHotkeys.forEach(hotkey => hotkeyStore.register(hotkey));
