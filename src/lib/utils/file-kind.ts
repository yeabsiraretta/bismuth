const TEXT_NOTE_EXTENSIONS = ['.md', '.pen'] as const;

export type TextNoteExtension = 'md' | 'pen';

export function isTextNotePath(path: string): boolean {
  return TEXT_NOTE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export function getTextNoteExtension(path: string): TextNoteExtension | null {
  if (path.endsWith('.md')) return 'md';
  if (path.endsWith('.pen')) return 'pen';
  return null;
}

export function stripTextNoteExtension(name: string): string {
  if (name.endsWith('.md')) return name.slice(0, -3);
  if (name.endsWith('.pen')) return name.slice(0, -4);
  return name;
}

export function titleFromPath(path: string): string {
  const leaf = path.split('/').pop() ?? path;
  return stripTextNoteExtension(leaf) || 'Untitled';
}
