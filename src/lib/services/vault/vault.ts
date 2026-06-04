import { invoke } from '@tauri-apps/api/core';
import type { Vault, Note } from '@/types/vault';
import { VaultTemplate } from '@/types/vault';
import { log } from '@/utils/logger';

/**
 * Opens an existing vault at the given path and initializes the backend state.
 * @param path - Absolute path to the vault root directory.
 * @returns The opened vault descriptor.
 */
export async function openVault(path: string): Promise<Vault> {
  log.info('Vault service: opening vault', { path });
  try {
    const vault = await invoke<Vault>('open_vault', { path });
    log.info('Vault service: vault opened successfully', { name: vault.name, rootPath: vault.root_path });
    return vault;
  } catch (error) {
    log.error('Vault service: failed to open vault', error as Error, { path });
    throw new Error(`Failed to open vault: ${error}`);
  }
}

/**
 * Creates a new vault on disk, optionally using a starter template.
 * @param path - Absolute path where the vault folder will be created.
 * @param template - Optional organizational template (defaults to Blank).
 * @returns The newly created vault descriptor.
 */
export async function createVault(path: string, template?: VaultTemplate): Promise<Vault> {
  log.info('Vault service: creating vault', { path, template: template ? VaultTemplate[template] : 'Blank' });
  try {
    let vault: Vault;
    if (template && template !== VaultTemplate.Blank) {
      log.debug('Vault service: invoking create_vault_from_template command');
      vault = await invoke<Vault>('create_vault_from_template', { path, template });
    } else {
      log.debug('Vault service: invoking create_vault command');
      vault = await invoke<Vault>('create_vault', { path });
    }
    log.info('Vault service: vault created successfully', { name: vault.name, rootPath: vault.root_path });
    return vault;
  } catch (error) {
    log.error('Vault service: failed to create vault', error as Error, { path, template: template ? VaultTemplate[template] : 'Blank' });
    throw new Error(`Failed to create vault: ${error}`);
  }
}

/**
 * Reads a single note's content and metadata from the backend.
 * @param path - Absolute path to the `.md` file.
 */
export async function getNote(path: string): Promise<Note> {
  try {
    return await invoke<Note>('read_note', { path });
  } catch (error) {
    throw new Error(`Failed to get note: ${error}`);
  }
}

/**
 * Writes markdown content to a note file (creates or overwrites).
 * @param path - Absolute path to the note file.
 * @param content - Raw markdown string to write.
 */
export async function writeNote(path: string, content: string): Promise<void> {
  try {
    await invoke('write_note', { path, content });
  } catch (error) {
    throw new Error(`Failed to write note: ${error}`);
  }
}

/**
 * Permanently deletes a note file from disk.
 * @param path - Absolute path to the note file.
 */
export async function deleteNote(path: string): Promise<void> {
  try {
    await invoke('delete_note', { path });
  } catch (error) {
    throw new Error(`Failed to delete note: ${error}`);
  }
}

/**
 * Renames/moves a note and updates all inbound wikilinks.
 * @param oldPath - Current absolute path of the note.
 * @param newPath - Desired new absolute path.
 */
export async function renameNote(oldPath: string, newPath: string): Promise<void> {
  try {
    await invoke('rename_note', { old_path: oldPath, new_path: newPath });
  } catch (error) {
    throw new Error(`Failed to rename note: ${error}`);
  }
}

/**
 * Lists notes within a specific folder (non-recursive).
 * @param vaultPath - Vault root path.
 * @param folderPath - Relative subfolder path (empty string for root).
 */
export async function listNotes(vaultPath: string, folderPath: string = ''): Promise<Note[]> {
  log.debug('Vault service: listing notes', { vaultPath, folderPath });
  try {
    const notes = await invoke<Note[]>('list_notes', {
      vault_path: vaultPath,
      folder_path: folderPath
    });
    log.info('Vault service: notes listed successfully', { count: notes.length });
    return notes;
  } catch (error) {
    log.error('Vault service: failed to list notes', error as Error, { vaultPath, folderPath });
    throw new Error(`Failed to list notes: ${error}`);
  }
}

/**
 * Recursively scans the entire vault, returning all discovered notes.
 * Triggers index rebuild in the backend.
 */
export async function scanVault(): Promise<Note[]> {
  log.debug('Vault service: scanning vault recursively');
  try {
    const notes = await invoke<Note[]>('scan_vault');
    log.info('Vault service: scan complete', { count: notes.length });
    return notes;
  } catch (error) {
    log.error('Vault service: failed to scan vault', error as Error);
    throw new Error(`Failed to scan vault: ${error}`);
  }
}
