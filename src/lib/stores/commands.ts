/**
 * Command registry — central registry for all Bismuth commands.
 * Phase 13: T104 (Command Palette)
 */
import { writable, derived } from 'svelte/store';

export interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  shortcut?: string;
  action: () => void | Promise<void>;
}

const commandMap = writable<Map<string, Command>>(new Map());

/** All registered commands as array */
export const commands = derived(commandMap, ($map) => Array.from($map.values()));

/** Register a command */
export function registerCommand(command: Command) {
  commandMap.update((map) => {
    map.set(command.id, command);
    return new Map(map);
  });
}

/** Unregister a command */
export function unregisterCommand(id: string) {
  commandMap.update((map) => {
    map.delete(id);
    return new Map(map);
  });
}

/** Execute a command by ID */
export async function executeCommand(id: string): Promise<void> {
  let cmd: Command | undefined;
  commandMap.subscribe((map) => {
    cmd = map.get(id);
  })();
  if (cmd) {
    await cmd.action();
  }
}

/** Search commands by fuzzy name match */
export function searchCommands(query: string): Command[] {
  let allCmds: Command[] = [];
  commands.subscribe((cmds) => {
    allCmds = cmds;
  })();

  if (!query) return allCmds;

  const lower = query.toLowerCase();
  return allCmds
    .filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(lower) ||
        cmd.description.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower)
    )
    .sort((a, b) => {
      // Exact name match first
      const aExact = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
      const bExact = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
      return aExact - bExact || a.name.localeCompare(b.name);
    });
}

/** Register default Bismuth commands */
export function registerDefaultCommands(actions: {
  newNote?: () => void;
  openSearch?: () => void;
  openCommandPalette?: () => void;
  openSettings?: () => void;
  toggleLeftSidebar?: () => void;
  toggleRightSidebar?: () => void;
  quickCapture?: () => void;
  openGraph?: () => void;
  openCaptureDashboard?: () => void;
}) {
  const defaults: Command[] = [
    {
      id: 'note:new',
      name: 'New Note',
      description: 'Create a new note',
      category: 'Notes',
      shortcut: 'Cmd+N',
      action: actions.newNote ?? (() => {}),
    },
    {
      id: 'search:open',
      name: 'Search',
      description: 'Open search panel',
      category: 'Navigation',
      shortcut: 'Cmd+P',
      action: actions.openSearch ?? (() => {}),
    },
    {
      id: 'palette:open',
      name: 'Command Palette',
      description: 'Open command palette',
      category: 'Navigation',
      shortcut: 'Cmd+Shift+P',
      action: actions.openCommandPalette ?? (() => {}),
    },
    {
      id: 'settings:open',
      name: 'Settings',
      description: 'Open settings modal',
      category: 'General',
      shortcut: 'Cmd+,',
      action: actions.openSettings ?? (() => {}),
    },
    {
      id: 'layout:toggle-left',
      name: 'Toggle Left Sidebar',
      description: 'Show or hide the left sidebar',
      category: 'Layout',
      shortcut: 'Cmd+\\',
      action: actions.toggleLeftSidebar ?? (() => {}),
    },
    {
      id: 'layout:toggle-right',
      name: 'Toggle Right Sidebar',
      description: 'Show or hide the right sidebar',
      category: 'Layout',
      shortcut: 'Cmd+Shift+\\',
      action: actions.toggleRightSidebar ?? (() => {}),
    },
    {
      id: 'capture:quick',
      name: 'Quick Capture',
      description: 'Create a quick capture note',
      category: 'Capture',
      shortcut: 'Cmd+Shift+N',
      action: actions.quickCapture ?? (() => {}),
    },
    {
      id: 'view:graph',
      name: 'Open Graph View',
      description: 'Open the graph visualization',
      category: 'Views',
      action: actions.openGraph ?? (() => {}),
    },
    {
      id: 'view:capture-dashboard',
      name: 'Open Capture Dashboard',
      description: 'Open the capture/inbox dashboard',
      category: 'Views',
      action: actions.openCaptureDashboard ?? (() => {}),
    },
  ];

  defaults.forEach(registerCommand);
}
