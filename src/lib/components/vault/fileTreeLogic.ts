/**
 * FileTree logic: tree building, sorting, drag-and-drop, and folder management.
 */
import { refreshNotes } from '@/stores/vault/vault';
import { openNoteTab } from '@/stores/editor/tabs';
import { createFolder as createFolderService, moveNote as moveNoteService, moveFolder as moveFolderService, updateLinksOnRename, getNote, writeNote, renameNote as renameNoteService, deleteNote as deleteNoteService } from '@/services/vault/vault';
import type { Note } from '@/types/data/vault';
import { log } from '@/utils/logger';

// --- Tree structure types ---
export interface TreeNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children: TreeNode[];
  note?: Note;
}

export type SortKey = 'name' | 'modified' | 'created';

// --- Persistence ---
const STORAGE_KEY = 'bismuth-filetree-expanded';

/** Loads the set of expanded folder paths from localStorage. Returns empty set on error. */
export function loadExpandedFolders(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch (e) { log.warn('Failed to load expanded folders from localStorage', { error: String(e) }); }
  return new Set();
}

/** Persists the current set of expanded folder paths to localStorage. */
export function persistExpanded(expandedFolders: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...expandedFolders]));
}

/** Creates a new folder in the vault root and auto-expands it in the tree. */
export async function createFolder(
  name: string,
  vaultRootPath: string,
  expandedFolders: Set<string>
): Promise<Set<string>> {
  const folderPath = `${vaultRootPath}/${name.trim()}`;
  await createFolderService(folderPath);
  await refreshNotes();
  const updated = new Set(expandedFolders);
  updated.add(folderPath);
  persistExpanded(updated);
  return updated;
}

/** Moves a note to a different folder via drag-and-drop, updating wikilinks. */
export async function moveNoteToFolder(note: Note, folderPath: string) {
  const sourceDir = note.path.substring(0, note.path.lastIndexOf('/'));
  if (folderPath === sourceDir) return;

  const oldPath = note.path;
  log.info('Moving note via drag-and-drop', { from: oldPath, toFolder: folderPath });
  const movedNote = await moveNoteService(oldPath, folderPath);
  await updateLinksOnRename(oldPath, movedNote.path);
  await refreshNotes();
  log.info('Note moved successfully', { newPath: movedNote.path });
}

/** Moves a folder into a different parent folder via drag-and-drop. */
export async function moveFolderToFolder(sourcePath: string, targetFolderPath: string) {
  const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
  if (targetFolderPath === sourceDir) return;

  log.info('Moving folder via drag-and-drop', { from: sourcePath, toFolder: targetFolderPath });
  await moveFolderService(sourcePath, targetFolderPath);
  await refreshNotes();
  log.info('Folder moved successfully');
}

// --- File name template ---
function resolveFileNameTemplate(template: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(':', '');
  return template
    .replace(/\{date\}/gi, date)
    .replace(/\{time\}/gi, time)
    .replace(/\{title\}/gi, 'Untitled');
}

/** Creates a note directly in the file tree using the configured name template, then opens it. */
export async function createInlineNote(parentPath: string): Promise<string> {
  const { get } = await import('svelte/store');
  const { settings } = await import('@/features/settings');
  const tmpl = get(settings).newFileNameTemplate || 'Untitled';
  const baseName = resolveFileNameTemplate(tmpl);

  let name = baseName;
  let suffix = 0;
  let notePath = `${parentPath}/${name}.md`;

  // Find unique name (check up to 100 suffixes)
  for (let i = 0; i < 100; i++) {
    try {
      await getNote(notePath);
      suffix++;
      name = `${baseName} ${suffix}`;
      notePath = `${parentPath}/${name}.md`;
    } catch {
      break; // Note doesn't exist — path is available
    }
  }

  const content = `# ${name}\n\n`;
  await writeNote(notePath, content);
  await refreshNotes();
  const fullNote = await getNote(notePath);
  openNoteTab(fullNote);
  log.info('Inline note created', { path: notePath });
  return notePath;
}

/** Renames a folder by moving it to a new path in the same parent. */
export async function renameFolder(oldPath: string, newName: string): Promise<void> {
  const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/'));
  const newPath = `${parentDir}/${newName.trim()}`;
  if (newPath === oldPath) return;
  await renameNoteService(oldPath, newPath);
  await refreshNotes();
  log.info('Folder renamed', { from: oldPath, to: newPath });
}

/** Deletes a folder (must be empty or backend handles recursive delete). */
export async function deleteFolder(folderPath: string): Promise<void> {
  await deleteNoteService(folderPath);
  await refreshNotes();
  log.info('Folder deleted', { path: folderPath });
}

// --- Note interaction ---
/** Opens a note by loading its full content and opening it in a tab. */
export async function openNote(note: Note) {
  const fullNote = await getNote(note.path);
  openNoteTab(fullNote);
}

/** Expands all parent folders of the given note path so it becomes visible in the tree. */
export function revealNote(notePath: string, vaultRoot: string, expandedFolders: Set<string>): Set<string> {
  const relativePath = notePath.startsWith(vaultRoot) ? notePath.slice(vaultRoot.length + 1) : notePath;
  const parts = relativePath.split('/');
  if (parts.length <= 1) return expandedFolders;
  const updated = new Set(expandedFolders);
  for (let i = 1; i < parts.length; i++) {
    const folderPath = vaultRoot + '/' + parts.slice(0, i).join('/');
    updated.add(folderPath);
  }
  persistExpanded(updated);
  return updated;
}

/** Collects all folder paths in the tree for expand-all. */
export function collectAllFolderPaths(nodes: TreeNode[]): Set<string> {
  const paths = new Set<string>();
  function walk(items: TreeNode[]) {
    for (const node of items) {
      if (node.type === 'folder') {
        paths.add(node.path);
        walk(node.children);
      }
    }
  }
  walk(nodes);
  return paths;
}

/** Returns the total file count for a folder node, including nested children. */
export function deepFileCount(node: TreeNode): number {
  if (node.type === 'file') return 1;
  let count = 0;
  for (const child of node.children) count += deepFileCount(child);
  return count;
}

// --- Tree building ---

/** Builds a hierarchical tree structure from flat note paths and folder paths. */
export function buildTree(notes: Note[], vaultRoot: string, sortBy: SortKey, folderPaths: string[] = []): TreeNode[] {
  const root: TreeNode = { name: '', path: '', type: 'folder', children: [] };
  for (const relPath of folderPaths) {
    const parts = relPath.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const folderName = parts[i];
      const folderPath = vaultRoot + '/' + parts.slice(0, i + 1).join('/');
      let folder = current.children.find(c => c.type === 'folder' && c.name === folderName);
      if (!folder) { folder = { name: folderName, path: folderPath, type: 'folder', children: [] }; current.children.push(folder); }
      current = folder;
    }
  }
  for (const note of notes) {
    const relativePath = vaultRoot && note.path.startsWith(vaultRoot) ? note.path.slice(vaultRoot.length + 1) : note.path;
    const parts = relativePath.split('/');
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      const folderPath = vaultRoot + '/' + parts.slice(0, i + 1).join('/');
      let folder = current.children.find(c => c.type === 'folder' && c.name === folderName);
      if (!folder) { folder = { name: folderName, path: folderPath, type: 'folder', children: [] }; current.children.push(folder); }
      current = folder;
    }
    current.children.push({ name: parts[parts.length - 1], path: note.path, type: 'file', children: [], note });
  }
  return sortNodes(root.children, sortBy);
}

function getNewestDate(node: TreeNode, field: 'modified_at' | 'created_at'): string {
  if (node.type === 'file') return node.note?.[field] || '';
  let newest = '';
  for (const child of node.children) { const d = getNewestDate(child, field); if (d > newest) newest = d; }
  return newest;
}

function sortNodes(nodes: TreeNode[], sortBy: SortKey): TreeNode[] {
  const folders = nodes.filter(n => n.type === 'folder');
  const files = nodes.filter(n => n.type === 'file');
  folders.forEach(f => { f.children = sortNodes(f.children, sortBy); });
  if (sortBy === 'name') { folders.sort((a, b) => a.name.localeCompare(b.name)); }
  else {
    const field = sortBy === 'modified' ? 'modified_at' : 'created_at';
    folders.sort((a, b) => getNewestDate(b, field).localeCompare(getNewestDate(a, field)));
  }
  files.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    const field = sortBy === 'modified' ? 'modified_at' : 'created_at';
    return (b.note?.[field] || '').localeCompare(a.note?.[field] || '');
  });
  return [...folders, ...files];
}

// --- Display utilities ---
export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getPreview(note: Note): string {
  if (!note.content) return '';
  for (const line of note.content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---')) continue;
    const clean = trimmed.replace(/^[-*>]+\s*/, '').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/\*\*|__|\*|_/g, '');
    if (clean.length > 0) return clean.length > 80 ? clean.slice(0, 80) + '\u2026' : clean;
  }
  return '';
}
