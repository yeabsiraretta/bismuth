/**
 * FileTree logic: tree building, sorting, drag-and-drop, and folder management.
 * Extracted from FileTree.svelte for the 300-line limit.
 */

import { invoke } from '@tauri-apps/api/core';
import { setActiveNote, refreshNotes } from '@/stores/vault/vault';
import type { Note } from '@/types/vault';
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

export function loadExpandedFolders(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch (_) { /* ignore parse errors */ }
  return new Set();
}

export function persistExpanded(expandedFolders: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...expandedFolders]));
}

// --- Tree building ---
export function buildTree(notes: Note[], vaultRoot: string, sortBy: SortKey): TreeNode[] {
  const root: TreeNode = { name: '', path: '', type: 'folder', children: [] };

  for (const note of notes) {
    const relativePath = vaultRoot && note.path.startsWith(vaultRoot)
      ? note.path.slice(vaultRoot.length + 1)
      : note.path;
    const parts = relativePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      const folderPath = vaultRoot + '/' + parts.slice(0, i + 1).join('/');
      let folder = current.children.find(c => c.type === 'folder' && c.name === folderName);
      if (!folder) {
        folder = { name: folderName, path: folderPath, type: 'folder', children: [] };
        current.children.push(folder);
      }
      current = folder;
    }

    current.children.push({
      name: parts[parts.length - 1],
      path: note.path,
      type: 'file',
      children: [],
      note,
    });
  }

  return sortNodes(root.children, sortBy);
}

function sortNodes(nodes: TreeNode[], sortBy: SortKey): TreeNode[] {
  const folders = nodes.filter(n => n.type === 'folder');
  const files = nodes.filter(n => n.type === 'file');

  folders.sort((a, b) => a.name.localeCompare(b.name));
  folders.forEach(f => { f.children = sortNodes(f.children, sortBy); });

  files.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'modified') {
      const aDate = a.note?.modified_at || '';
      const bDate = b.note?.modified_at || '';
      return bDate.localeCompare(aDate);
    }
    const aDate = a.note?.created_at || '';
    const bDate = b.note?.created_at || '';
    return bDate.localeCompare(aDate);
  });

  return [...folders, ...files];
}

// --- Folder creation ---
export async function createFolder(
  name: string,
  vaultRootPath: string,
  expandedFolders: Set<string>
): Promise<Set<string>> {
  const folderPath = `${vaultRootPath}/${name.trim()}`;
  await invoke('create_folder', { path: folderPath });
  await refreshNotes();
  const updated = new Set(expandedFolders);
  updated.add(folderPath);
  persistExpanded(updated);
  return updated;
}

// --- Drag and drop ---
export async function moveNoteToFolder(note: Note, folderPath: string) {
  const sourceDir = note.path.substring(0, note.path.lastIndexOf('/'));
  if (folderPath === sourceDir) return;

  const oldPath = note.path;
  log.info('Moving note via drag-and-drop', { from: oldPath, toFolder: folderPath });
  const movedNote = await invoke<Note>('move_note', { oldPath, newFolder: folderPath });
  await invoke('update_links_on_rename', { oldPath, newPath: movedNote.path });
  await refreshNotes();
  log.info('Note moved successfully', { newPath: movedNote.path });
}

// --- Note interaction ---
export async function openNote(note: Note) {
  const fullNote = await invoke<Note>('read_note', { path: note.path });
  setActiveNote(fullNote);
}
