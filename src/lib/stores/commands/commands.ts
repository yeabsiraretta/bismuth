/**
 * Command registry — central registry for all Bismuth commands.
 * Phase 13: T104 (Command Palette)
 */
import { writable, derived } from 'svelte/store';
import { buildDefaultCommands, type DefaultCommandActions } from './defaultCommands';

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
export const commands = derived(commandMap, ($map: Map<string, Command>) => Array.from($map.values()));

/** Register a command */
export function registerCommand(command: Command) {
  commandMap.update((map: Map<string, Command>) => {
    map.set(command.id, command);
    return new Map(map);
  });
}

/** Unregister a command */
export function unregisterCommand(id: string) {
  commandMap.update((map: Map<string, Command>) => {
    map.delete(id);
    return new Map(map);
  });
}

/** Execute a command by ID */
export async function executeCommand(id: string): Promise<void> {
  let cmd: Command | undefined;
  commandMap.subscribe((map: Map<string, Command>) => {
    cmd = map.get(id);
  })();
  if (cmd) {
    await cmd.action();
  }
}

/** Search commands by fuzzy name match */
export function searchCommands(query: string): Command[] {
  let allCmds: Command[] = [];
  commands.subscribe((cmds: Command[]) => {
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
export function registerDefaultCommands(actions: DefaultCommandActions) {
  buildDefaultCommands(actions).forEach(registerCommand);
}
