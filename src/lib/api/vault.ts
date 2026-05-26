/**
 * Vault API - TypeScript bindings for Tauri vault commands
 */

import { invoke } from '@tauri-apps/api/core';

export interface Vault {
	root_path: string;
	settings_path: string;
	name: string;
}

export interface Note {
	path: string;
	title: string;
	content: string;
	frontmatter: Record<string, unknown>;
	created_at: string;
	modified_at: string;
}

/**
 * Opens an existing vault
 */
export async function openVault(path: string): Promise<Vault> {
	return await invoke<Vault>('open_vault', { path });
}

/**
 * Creates a new vault
 */
export async function createVault(path: string): Promise<Vault> {
	return await invoke<Vault>('create_vault', { path });
}

/**
 * Gets the currently open vault
 */
export async function getCurrentVault(): Promise<Vault | null> {
	return await invoke<Vault | null>('get_current_vault');
}

/**
 * Scans the vault for all notes
 */
export async function scanVault(): Promise<Note[]> {
	return await invoke<Note[]>('scan_vault');
}

/**
 * Reads a note by path
 */
export async function readNote(path: string): Promise<Note> {
	return await invoke<Note>('read_note', { path });
}

/**
 * Writes a note
 */
export async function writeNote(path: string, content: string): Promise<void> {
	await invoke('write_note', { path, content });
}

/**
 * Deletes a note
 */
export async function deleteNote(path: string): Promise<void> {
	await invoke('delete_note', { path });
}

/**
 * Renames a note
 */
export async function renameNote(oldPath: string, newPath: string): Promise<void> {
	await invoke('rename_note', { oldPath, newPath });
}
