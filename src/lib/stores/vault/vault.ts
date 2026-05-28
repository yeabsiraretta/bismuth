/**
 * Vault store - Manages vault state
 */

import { writable, derived, get } from 'svelte/store';
import { listen } from '@tauri-apps/api/event';
import type { Vault, Note } from '@/types/vault';
import * as vaultService from '@/services/vault/vault';
import { log } from '@/utils/logger';

// Current vault
export const currentVault = writable<Vault | null>(null);

// All notes in the vault
export const notes = writable<Note[]>([]);

// Currently active note
export const activeNote = writable<Note | null>(null);

// Loading states
export const isLoadingVault = writable(false);
export const isLoadingNotes = writable(false);

// Show archived notes toggle
export const showArchived = writable(false);

// Derived store: vault is open
export const isVaultOpen = derived(currentVault, ($vault) => $vault !== null);

// Derived store: notes by path (for quick lookup)
export const notesByPath = derived(notes, ($notes) => {
	const map = new Map<string, Note>();
	$notes.forEach((note) => map.set(note.path, note));
	return map;
});

// Derived store: visible notes (excludes archived unless toggled)
export const visibleNotes = derived([notes, showArchived], ([$notes, $showArchived]) => {
	if ($showArchived) return $notes;
	return $notes.filter((n) => n.frontmatter?.archived !== true);
});

/**
 * Initializes the vault store and sets up event listeners
 */
export async function initializeVault() {
	log.info('Initializing vault store');
	isLoadingVault.set(true);
	try {
		// Try to load existing vault (will be null if none exists)
		// For now, we'll just set it to null - vault will be opened via welcome screen
		currentVault.set(null);
		log.debug('Vault state reset to null');

		// Set up Tauri event listeners
		log.debug('Setting up event listeners');
		await setupEventListeners();
		log.info('Vault store initialized successfully');
	} catch (error) {
		log.error('Failed to initialize vault store', error as Error);
	} finally {
		isLoadingVault.set(false);
	}
}

/**
 * Refreshes the notes list from the vault
 */
export async function refreshNotes() {
	log.debug('Refreshing notes list');
	isLoadingNotes.set(true);
	try {
		// Get current vault
		const vault = get(currentVault);

		if (!vault) {
			log.warn('Cannot refresh notes: no vault open');
			return;
		}

		// Use scan_vault for recursive enumeration of all notes
		const allNotes = await vaultService.scanVault();
		notes.set(allNotes);
		log.info('Notes refreshed', { count: allNotes.length });
	} catch (error) {
		log.error('Failed to refresh notes', error as Error);
	} finally {
		isLoadingNotes.set(false);
	}
}

/**
 * Sets the active note
 */
export function setActiveNote(note: Note | null) {
	activeNote.set(note);
}

/**
 * Updates a note in the store
 */
export function updateNoteInStore(updatedNote: Note) {
	notes.update(($notes) => {
		const index = $notes.findIndex((n) => n.path === updatedNote.path);
		if (index >= 0) {
			$notes[index] = updatedNote;
		} else {
			$notes.push(updatedNote);
		}
		return $notes;
	});

	// Update active note if it's the same
	activeNote.update(($active) => {
		if ($active && $active.path === updatedNote.path) {
			return updatedNote;
		}
		return $active;
	});
}

/**
 * Removes a note from the store
 */
export function removeNoteFromStore(path: string) {
	notes.update(($notes) => $notes.filter((n) => n.path !== path));

	// Clear active note if it was deleted
	activeNote.update(($active) => {
		if ($active && $active.path === path) {
			return null;
		}
		return $active;
	});
}

/**
 * Opens a vault and loads its notes
 */
export async function openVault(path: string): Promise<void> {
	log.info('Opening vault', { path });
	isLoadingVault.set(true);
	log.debug('isLoadingVault set to true');
	try {
		log.debug('Calling vault service to open vault');
		const vault = await vaultService.openVault(path);
		log.info('Vault opened successfully', { name: vault.name, rootPath: vault.root_path });
		log.debug('Setting currentVault', { vault });
		currentVault.set(vault);
		log.debug('currentVault set, refreshing notes');
		await refreshNotes();
		log.debug('Notes refreshed');
	} catch (error) {
		log.error('Failed to open vault', error as Error, { path });
		throw error;
	} finally {
		log.debug('Setting isLoadingVault to false');
		isLoadingVault.set(false);
		log.debug('isLoadingVault set to false');
	}
}

/**
 * Sets up Tauri event listeners for vault changes
 */
async function setupEventListeners() {
	// Listen for file created events
	await listen('vault://file-created', async (event) => {
		console.log('File created:', event.payload);
		await refreshNotes();
	});

	// Listen for file modified events
	await listen('vault://file-modified', async (event) => {
		console.log('File modified:', event.payload);
		await refreshNotes();
	});

	// Listen for file deleted events
	await listen('vault://file-deleted', async (event) => {
		console.log('File deleted:', event.payload);
		await refreshNotes();
	});
}
