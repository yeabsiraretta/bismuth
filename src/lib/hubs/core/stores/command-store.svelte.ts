import { pushState } from '$app/navigation';
import { page } from '$app/state';

export interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  shortcut?: string;
  action: () => void | Promise<void>;
}

let commandMap = $state<Map<string, Command>>(new Map());
let paletteQuery = $state('');

export function getCommands(): Command[] {
  return Array.from(commandMap.values());
}

export function isPaletteOpen(): boolean {
  return !!page.state?.showPalette;
}

export function getPaletteQuery(): string {
  return paletteQuery;
}

export function openPalette() {
  if (isPaletteOpen()) return;
  paletteQuery = '';
  // Close settings if open to prevent stacking modals
  if (page.state?.showSettings) {
    history.back();
    setTimeout(() => pushState('', { showPalette: true }), 0);
    return;
  }
  pushState('', { showPalette: true });
}

export function closePalette() {
  paletteQuery = '';
  if (page.state?.showPalette) {
    history.back();
  }
}

export function togglePalette() {
  if (isPaletteOpen()) closePalette();
  else openPalette();
}

export function setPaletteQuery(q: string) {
  paletteQuery = q;
}

export function registerCommand(cmd: Command) {
  const next = new Map(commandMap);
  next.set(cmd.id, cmd);
  commandMap = next;
}

export function unregisterCommand(id: string) {
  const next = new Map(commandMap);
  next.delete(id);
  commandMap = next;
}

export async function executeCommand(id: string): Promise<void> {
  const cmd = commandMap.get(id);
  if (cmd) await cmd.action();
}

export function searchCommands(query: string): Command[] {
  const all = getCommands();
  if (!query) return all;

  const lower = query.toLowerCase();
  return all
    .filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower)
    )
    .sort((a, b) => {
      const aExact = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
      const bExact = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
      return aExact - bExact || a.name.localeCompare(b.name);
    });
}
