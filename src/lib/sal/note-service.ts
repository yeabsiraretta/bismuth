import { getVault } from '@/hubs/core/stores/vault-store.svelte';
import { invokeCommand } from '@/ipc/invoke';
import {
  createBrowserNote,
  deleteBrowserNote,
  isBrowserVaultPath,
  readBrowserNote,
  renameBrowserNote,
  writeBrowserNote,
} from '@/sal/browser-vault-service';
import { titleFromPath, type TextNoteExtension } from '@/utils/file-kind';
import { isTauriAvailable } from '@/utils/platform';

export interface NoteResponse {
  path: string;
  title: string;
  content: string;
  modifiedAt: number;
  createdAt: number;
}

function mockNote(path: string, title: string, content = ''): NoteResponse {
  const now = Date.now();
  return { path, title, content, modifiedAt: now, createdAt: now };
}

function normalizePenFolder(folder?: string): string {
  const trimmed = folder?.trim().replace(/^\/+|\/+$/g, '') ?? '';
  if (!trimmed) return 'design';
  if (trimmed.toLowerCase() === 'design' || trimmed.toLowerCase().startsWith('design/')) {
    return trimmed;
  }
  return `design/${trimmed}`;
}

export function readNote(path: string): Promise<NoteResponse> {
  if (!isTauriAvailable()) {
    const rootPath = getVault()?.rootPath;
    if (rootPath && isBrowserVaultPath(rootPath)) {
      return readBrowserNote(rootPath, path);
    }
    const title = titleFromPath(path);
    return Promise.resolve(mockNote(path, title, `# ${title}\n\nStart writing here…`));
  }
  return invokeCommand<NoteResponse>('read_note', { path });
}

export function writeNote(path: string, content: string): Promise<void> {
  if (!isTauriAvailable()) {
    const rootPath = getVault()?.rootPath;
    if (rootPath && isBrowserVaultPath(rootPath)) {
      return writeBrowserNote(rootPath, path, content);
    }
    return Promise.resolve();
  }
  return invokeCommand<void>('write_note', { path, content });
}

export function deleteNote(path: string): Promise<void> {
  if (!isTauriAvailable()) {
    const rootPath = getVault()?.rootPath;
    if (rootPath && isBrowserVaultPath(rootPath)) {
      return deleteBrowserNote(rootPath, path);
    }
    return Promise.resolve();
  }
  return invokeCommand<void>('delete_note', { path });
}

export async function createNote(
  title: string,
  folder?: string,
  content?: string,
  extension: TextNoteExtension = 'md'
): Promise<NoteResponse> {
  if (!isTauriAvailable()) {
    const rootPath = getVault()?.rootPath;
    const targetFolder = extension === 'pen' ? normalizePenFolder(folder) : folder;
    if (rootPath && isBrowserVaultPath(rootPath)) {
      return createBrowserNote(rootPath, title, targetFolder, content ?? '', extension);
    }
    const path = targetFolder ? `${targetFolder}/${title}.${extension}` : `${title}.${extension}`;
    return mockNote(path, title, content ?? '');
  }
  const note = await invokeCommand<NoteResponse>('create_note', { title, folder, extension });
  if (content) {
    await writeNote(note.path, content);
    note.content = content;
  }
  return note;
}

export function renameNote(oldPath: string, newTitle: string): Promise<NoteResponse> {
  if (!isTauriAvailable()) {
    const rootPath = getVault()?.rootPath;
    if (rootPath && isBrowserVaultPath(rootPath)) {
      return renameBrowserNote(rootPath, oldPath, newTitle);
    }
    const ext = oldPath.endsWith('.pen') ? 'pen' : 'md';
    const dir = oldPath.split('/').slice(0, -1).join('/');
    const newPath = dir ? `${dir}/${newTitle}.${ext}` : `${newTitle}.${ext}`;
    return Promise.resolve(mockNote(newPath, newTitle));
  }
  return invokeCommand<NoteResponse>('rename_note', { oldPath, newTitle });
}
