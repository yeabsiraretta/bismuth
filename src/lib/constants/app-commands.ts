import { togglePalette } from '@/hubs/core/stores/command-store.svelte';
import {
  setActiveHub,
  toggleLeftSidebar,
  toggleRightSidebar,
} from '@/hubs/core/stores/layout-store.svelte';
import { openSettings } from '@/hubs/core/stores/settings-modal.svelte';
import { rescanVault } from '@/hubs/core/stores/vault-store.svelte';
import { toggleOmnisearch } from '@/hubs/navigator/stores/omnisearch-store.svelte';
import { openVaultDialog } from '@/sal/vault-service';

export interface CommandHandlers {
  navigateTo: (route: string) => void;
  handleNewNote: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  switchVault: () => void;
}

const nav = (handlers: CommandHandlers, route: string) => ({
  category: 'Navigate' as const,
  action: () => handlers.navigateTo(route),
});

const editorEvent = (evt: string) => () => {
  window.dispatchEvent(new CustomEvent(evt));
};

export function buildCommands(h: CommandHandlers) {
  return [
    {
      id: 'new-note',
      name: 'New Note',
      description: 'Create a new note',
      category: 'Notes',
      shortcut: 'Cmd+N',
      action: h.handleNewNote,
    },
    {
      id: 'open-settings',
      name: 'Settings',
      description: 'Open settings',
      category: 'App',
      shortcut: 'Cmd+,',
      action: () => openSettings(),
    },
    { id: 'nav-home', name: 'Go to Home', description: 'Navigate to home', ...nav(h, '/') },
    {
      id: 'nav-editor',
      name: 'Go to Editor',
      description: 'Navigate to editor',
      ...nav(h, '/editor'),
    },
    {
      id: 'nav-graph',
      name: 'Open Graph',
      description: 'Open graph sidebar',
      category: 'Navigate',
      action: () => {
        setActiveHub('right', 'graph', 'local-graph');
      },
    },
    {
      id: 'nav-calendar',
      name: 'Go to Calendar',
      description: 'Navigate to calendar',
      ...nav(h, '/calendar'),
    },
    {
      id: 'nav-projects',
      name: 'Go to Projects',
      description: 'Navigate to projects',
      ...nav(h, '/projects'),
    },
    {
      id: 'nav-writing',
      name: 'Go to Writing',
      description: 'Navigate to writing',
      ...nav(h, '/writing'),
    },
    {
      id: 'nav-import',
      name: 'Go to Import',
      description: 'Navigate to import',
      ...nav(h, '/import'),
    },
    {
      id: 'nav-creative',
      name: 'Go to Creative',
      description: 'Navigate to creative',
      ...nav(h, '/creative'),
    },
    {
      id: 'nav-pokemon',
      name: 'Go to Pokémon',
      description: 'Navigate to Pokémon tools',
      ...nav(h, '/pokemon'),
    },
    {
      id: 'nav-media',
      name: 'Go to Media',
      description: 'Navigate to media',
      ...nav(h, '/media'),
    },
    {
      id: 'nav-gamification',
      name: 'Go to Gamification',
      description: 'Navigate to XP and achievements',
      ...nav(h, '/gamification'),
    },
    {
      id: 'nav-flashcards',
      name: 'Go to Flashcards',
      description: 'Navigate to flashcards',
      shortcut: 'Cmd+Shift+F',
      ...nav(h, '/flashcards'),
    },
    {
      id: 'nav-graph-page',
      name: 'Go to Graph',
      description: 'Navigate to graph view',
      ...nav(h, '/graph'),
    },
    {
      id: 'toggle-left',
      name: 'Toggle Left Sidebar',
      description: 'Toggle left sidebar',
      category: 'View',
      shortcut: 'Cmd+B',
      action: toggleLeftSidebar,
    },
    {
      id: 'toggle-right',
      name: 'Toggle Right Sidebar',
      description: 'Toggle right sidebar',
      category: 'View',
      shortcut: 'Cmd+Shift+B',
      action: toggleRightSidebar,
    },
    {
      id: 'cmd-palette',
      name: 'Command Palette',
      description: 'Toggle command palette',
      category: 'App',
      shortcut: 'Cmd+P',
      action: togglePalette,
    },
    {
      id: 'enhanced-copy',
      name: 'Enhanced Copy',
      description: 'Copy with Markdown transforms',
      category: 'Editor',
      shortcut: 'Cmd+Shift+C',
      action: editorEvent('editor:enhanced-copy'),
    },
    {
      id: 'rescan-vault',
      name: 'Rescan Vault',
      description: 'Re-scan vault',
      category: 'Vault',
      action: () => rescanVault(),
    },
    {
      id: 'open-vault',
      name: 'Open Vault',
      description: 'Open a vault folder',
      category: 'Vault',
      action: () => {
        openVaultDialog();
      },
    },
    {
      id: 'switch-vault',
      name: 'Switch Vault',
      description: 'Close vault and return to welcome',
      category: 'Vault',
      action: h.switchVault,
    },
    {
      id: 'zoom-in',
      name: 'Zoom In',
      description: 'Increase UI scale',
      category: 'View',
      shortcut: 'Cmd+=',
      action: h.zoomIn,
    },
    {
      id: 'zoom-out',
      name: 'Zoom Out',
      description: 'Decrease UI scale',
      category: 'View',
      shortcut: 'Cmd+-',
      action: h.zoomOut,
    },
    {
      id: 'zoom-reset',
      name: 'Reset Zoom',
      description: 'Reset UI scale',
      category: 'View',
      shortcut: 'Cmd+0',
      action: h.zoomReset,
    },
    {
      id: 'omnisearch',
      name: 'Omnisearch',
      description: 'Vault-wide search',
      category: 'Search',
      shortcut: 'Cmd+Shift+O',
      action: toggleOmnisearch,
    },
    {
      id: 'find',
      name: 'Find',
      description: 'Search in current note',
      category: 'Editor',
      shortcut: 'Cmd+F',
      action: editorEvent('editor:open-search'),
    },
    {
      id: 'save',
      name: 'Save Note',
      description: 'Force save note',
      category: 'Editor',
      shortcut: 'Cmd+S',
      action: editorEvent('editor:save'),
    },
  ] as const;
}
