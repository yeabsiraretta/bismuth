import { invoke } from '@tauri-apps/api/core';
import type { Vault, Note, NoteMeta } from '@/types/data/vault';
import { VaultTemplate } from '@/types/data/vault';
import { log, scrubPaths } from '@/utils/logger';

/** Scrub a backend error before re-throwing to callers. */
function safeError(prefix: string, error: unknown): Error {
  const msg = error instanceof Error ? error.message : String(error);
  return new Error(`${prefix}: ${scrubPaths(msg)}`);
}

export async function openVault(path: string): Promise<Vault> {
  log.info('Vault service: opening vault');
  try {
    return await invoke<Vault>('open_vault', { path });
  } catch (error) {
    log.error('Vault service: failed to open vault', error as Error);
    throw safeError('Failed to open vault', error);
  }
}

export async function createVault(path: string, template?: VaultTemplate): Promise<Vault> {
  log.info('Vault service: creating vault');
  try {
    if (template && template !== VaultTemplate.Blank) {
      return await invoke<Vault>('create_vault_from_template', { path, template });
    }
    return await invoke<Vault>('create_vault', { path });
  } catch (error) {
    log.error('Vault service: failed to create vault', error as Error);
    throw safeError('Failed to create vault', error);
  }
}

export async function createNote(path: string, content: string): Promise<Note> {
  try {
    return await invoke<Note>('create_note', { path, content });
  } catch (error) {
    log.error('Vault service: failed to create note', error as Error);
    throw safeError('Failed to create note', error);
  }
}

export async function getNote(path: string): Promise<Note> {
  try {
    return await invoke<Note>('read_note', { path });
  } catch (error) {
    log.error('Vault service: failed to get note', error as Error);
    throw safeError('Failed to get note', error);
  }
}

export async function writeNote(path: string, content: string): Promise<void> {
  try {
    await invoke('write_note', { path, content });
  } catch (error) {
    log.error('Vault service: failed to write note', error as Error);
    throw safeError('Failed to write note', error);
  }
}

export async function deleteNote(path: string): Promise<void> {
  try {
    await invoke('delete_note', { path });
  } catch (error) {
    log.error('Vault service: failed to delete note', error as Error);
    throw safeError('Failed to delete note', error);
  }
}

export async function renameNote(oldPath: string, newPath: string): Promise<void> {
  try {
    await invoke('rename_note', { old_path: oldPath, new_path: newPath });
  } catch (error) {
    log.error('Vault service: failed to rename note', error as Error);
    throw safeError('Failed to rename note', error);
  }
}

export async function scanVault(): Promise<Note[]> {
  try {
    return await invoke<Note[]>('scan_vault');
  } catch (error) {
    log.error('Vault service: failed to scan vault', error as Error);
    throw safeError('Failed to scan vault', error);
  }
}

export async function scanVaultMeta(): Promise<NoteMeta[]> {
  try {
    return await invoke<NoteMeta[]>('scan_vault_meta');
  } catch (error) {
    log.error('Vault service: failed to scan vault metadata', error as Error);
    throw safeError('Failed to scan vault metadata', error);
  }
}

export async function readFileText(path: string): Promise<string> {
  try {
    return await invoke<string>('read_file_text', { path });
  } catch (error) {
    log.error('Vault service: failed to read file', error as Error);
    throw safeError('Failed to read file', error);
  }
}

export async function createFolder(path: string): Promise<void> {
  try {
    await invoke('create_folder', { path });
  } catch (error) {
    log.error('Vault service: failed to create folder', error as Error);
    throw safeError('Failed to create folder', error);
  }
}

export async function moveNote(oldPath: string, newFolder: string): Promise<Note> {
  try {
    return await invoke<Note>('move_note', { old_path: oldPath, new_folder: newFolder });
  } catch (error) {
    log.error('Vault service: failed to move note', error as Error);
    throw safeError('Failed to move note', error);
  }
}

export async function moveFolder(sourcePath: string, targetParent: string): Promise<string> {
  try {
    return await invoke<string>('move_folder', {
      source_path: sourcePath,
      target_parent: targetParent,
    });
  } catch (error) {
    log.error('Vault service: failed to move folder', error as Error);
    throw safeError('Failed to move folder', error);
  }
}

export async function updateLinksOnRename(oldPath: string, newPath: string): Promise<string[]> {
  try {
    return await invoke<string[]>('update_links_on_rename', {
      old_path: oldPath,
      new_path: newPath,
    });
  } catch (error) {
    log.error('Vault service: failed to update links', error as Error);
    throw safeError('Failed to update links', error);
  }
}

export async function listNotes(vaultPath: string, folderPath: string = ''): Promise<Note[]> {
  log.debug('Vault service: listing notes');
  try {
    const notes = await invoke<Note[]>('list_notes', {
      vault_path: vaultPath,
      folder_path: folderPath,
    });
    log.info('Vault service: notes listed', { count: notes.length });
    return notes;
  } catch (error) {
    log.error('Vault service: failed to list notes', error as Error);
    throw safeError('Failed to list notes', error);
  }
}

export async function listFolders(vaultPath: string): Promise<string[]> {
  try {
    return await invoke<string[]>('list_folders', { vault_path: vaultPath });
  } catch (error) {
    log.error('Vault service: failed to list folders', error as Error);
    throw safeError('Failed to list folders', error);
  }
}

export async function duplicateNote(path: string): Promise<Note> {
  try {
    return await invoke<Note>('duplicate_note', { path });
  } catch (error) {
    log.error('Vault service: failed to duplicate note', error as Error);
    throw safeError('Failed to duplicate note', error);
  }
}

export async function mergeNotes(paths: string[], targetPath: string): Promise<Note> {
  try {
    return await invoke<Note>('merge_notes', { paths, target_path: targetPath });
  } catch (error) {
    log.error('Vault service: failed to merge notes', error as Error);
    throw safeError('Failed to merge notes', error);
  }
}

export async function createNoteFromWikilink(title: string): Promise<Note> {
  try {
    return await invoke<Note>('create_note_from_wikilink', { title });
  } catch (error) {
    log.error('Vault service: failed to create note from wikilink', error as Error);
    throw safeError('Failed to create note from wikilink', error);
  }
}

export async function openInFileManager(path: string): Promise<void> {
  try {
    await invoke('open_in_file_manager', { path });
  } catch (error) {
    log.error('Vault service: failed to open in file manager', error as Error);
    throw safeError('Failed to open in file manager', error);
  }
}

export async function exportVaultMarkdown(outputPath: string): Promise<string> {
  try {
    return await invoke<string>('export_vault_markdown', { output_path: outputPath });
  } catch (error) {
    log.error('Vault service: failed to export vault', error as Error);
    throw safeError('Failed to export vault', error);
  }
}
