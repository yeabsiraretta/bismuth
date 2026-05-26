import { invoke } from '@tauri-apps/api/core';
import type { Vault, Note } from '@/types/vault';
import { VaultTemplate } from '@/types/vault';
import { log } from '@/utils/logger';

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

export async function getNote(path: string): Promise<Note> {
  try {
    return await invoke<Note>('get_note', { path });
  } catch (error) {
    throw new Error(`Failed to get note: ${error}`);
  }
}

export async function writeNote(path: string, content: string): Promise<void> {
  try {
    await invoke('write_note', { path, content });
  } catch (error) {
    throw new Error(`Failed to write note: ${error}`);
  }
}

export async function deleteNote(path: string): Promise<void> {
  try {
    await invoke('delete_note', { path });
  } catch (error) {
    throw new Error(`Failed to delete note: ${error}`);
  }
}

export async function renameNote(oldPath: string, newPath: string): Promise<void> {
  try {
    await invoke('rename_note', { oldPath, newPath });
  } catch (error) {
    throw new Error(`Failed to rename note: ${error}`);
  }
}

export async function listNotes(vaultPath: string, folderPath: string = ''): Promise<Note[]> {
  log.debug('Vault service: listing notes', { vaultPath, folderPath });
  try {
    const notes = await invoke<Note[]>('list_notes', {
      vaultPath: vaultPath,
      folderPath: folderPath
    });
    log.info('Vault service: notes listed successfully', { count: notes.length });
    return notes;
  } catch (error) {
    log.error('Vault service: failed to list notes', error as Error, { vaultPath, folderPath });
    throw new Error(`Failed to list notes: ${error}`);
  }
}
