import type { Note } from '@/types/data/vault';

export interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  shortcut?: string;
}

export function filterNotes(notes: Note[], query: string): Note[] {
  if (!query) return notes.slice(0, 20);
  const q = query.toLowerCase();
  return notes
    .filter((n) => n.title?.toLowerCase().includes(q) || n.path?.toLowerCase().includes(q))
    .slice(0, 20);
}

export function filterCommands(commands: Command[], query: string): Command[] {
  if (!query) return commands;
  const q = query.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
  );
}

export function navigateIndex(
  direction: 'up' | 'down',
  currentIndex: number,
  total: number
): number {
  if (direction === 'down') return Math.min(currentIndex + 1, total - 1);
  return Math.max(currentIndex - 1, 0);
}

export function scrollToIndex(index: number) {
  const element = document.querySelector(`[data-index="${index}"]`);
  element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
