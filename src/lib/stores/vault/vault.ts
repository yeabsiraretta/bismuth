/**
 * Vault Store
 *
 * Central state management for the currently open vault, its notes,
 * and the active editor target. Exposes reactive Svelte stores and
 * async actions that delegate to the Tauri backend via IPC.
 *
 * @module stores/vault
 */

import { writable, derived, get } from 'svelte/store';
import { listen } from '@tauri-apps/api/event';
import type { Vault, Note } from '@/types/vault';
import * as vaultService from '@/services/vault/vault';
import { log } from '@/utils/logger';

/** The currently open vault, or `null` if no vault is loaded. */
export const currentVault = writable<Vault | null>(null);

/** Flat list of all notes discovered in the vault. */
export const notes = writable<Note[]>([]);

/** The note currently open in the editor, or `null` if none is selected. */
export const activeNote = writable<Note | null>(null);

/** `true` while the vault is being opened or initialized. */
export const isLoadingVault = writable(false);

/** `true` while the note list is being refreshed from disk. */
export const isLoadingNotes = writable(false);

/** When `true`, archived notes are included in {@link visibleNotes}. */
export const showArchived = writable(false);

/** Derived boolean indicating whether a vault is currently open. */
export const isVaultOpen = derived(currentVault, ($vault: Vault | null) => $vault !== null);

/**
 * Derived lookup map from absolute note path to its {@link Note} object.
 * Provides O(1) access when resolving wikilinks or navigating by path.
 */
export const notesByPath = derived(notes, ($notes: Note[]) => {
	const map = new Map<string, Note>();
	$notes.forEach((note: Note) => map.set(note.path, note));
	return map;
});

/**
 * Derived list of notes visible in the sidebar/file list.
 * Excludes notes with `frontmatter.archived === true` unless
 * {@link showArchived} is toggled on.
 */
export const visibleNotes = derived([notes, showArchived], ([$notes, $showArchived]: [Note[], boolean]) => {
	if ($showArchived) return $notes;
	return $notes.filter((n: Note) => n.frontmatter?.archived !== true);
});

/**
 * Initializes the vault store and registers Tauri event listeners.
 *
 * Resets vault state to `null` (the welcome screen will trigger
 * {@link openVault} once the user selects a directory). Should be
 * called once at application startup.
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
 * Re-scans the vault directory tree and replaces the {@link notes} store
 * with the updated list. No-ops silently if no vault is open.
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
 * Sets the currently active note displayed in the editor.
 *
 * @param note - The note to activate, or `null` to deselect.
 */
export function setActiveNote(note: Note | null) {
	activeNote.set(note);
}

/**
 * Upserts a note in the {@link notes} store.
 *
 * If a note with the same path exists it is replaced in-place;
 * otherwise the note is appended. Also updates {@link activeNote}
 * if it references the same path.
 *
 * @param updatedNote - The note object with updated content/metadata.
 */
export function updateNoteInStore(updatedNote: Note) {
	notes.update(($notes: Note[]) => {
		const index = $notes.findIndex((n: Note) => n.path === updatedNote.path);
		if (index >= 0) {
			$notes[index] = updatedNote;
		} else {
			$notes.push(updatedNote);
		}
		return $notes;
	});

	// Update active note if it's the same
	activeNote.update(($active: Note | null) => {
		if ($active && $active.path === updatedNote.path) {
			return updatedNote;
		}
		return $active;
	});
}

/**
 * Removes a note from the {@link notes} store by path.
 *
 * Clears {@link activeNote} if the removed note was selected.
 *
 * @param path - Absolute path of the note to remove.
 */
export function removeNoteFromStore(path: string) {
	notes.update(($notes: Note[]) => $notes.filter((n: Note) => n.path !== path));

	// Clear active note if it was deleted
	activeNote.update(($active: Note | null) => {
		if ($active && $active.path === path) {
			return null;
		}
		return $active;
	});
}

/**
 * Opens a vault at the given directory path.
 *
 * Delegates to the Tauri backend `open_vault` IPC command, then
 * triggers a full note scan via {@link refreshNotes}.
 *
 * @param path - Absolute filesystem path to the vault root directory.
 * @throws Re-throws any backend error after logging.
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
		// Load component library for this vault
		try {
			const { loadLibrary } = await import('../canvas/componentLibrary');
			await loadLibrary();
			log.debug('Component library loaded');
		} catch (compError) {
			log.warn('Component library load failed (non-fatal)', { error: compError });
		}
	} catch (error) {
		log.error('Failed to open vault', error as Error, { path });
		throw error;
	} finally {
		log.debug('Setting isLoadingVault to false');
		isLoadingVault.set(false);
		log.debug('isLoadingVault set to false');
	}
}

/** Accumulated Tauri event unlisten handles for teardown. */
let eventUnlisteners: Array<() => void> = [];

/**
 * Registers Tauri event listeners for filesystem changes.
 *
 * Subscribes to `vault://file-created`, `vault://file-modified`, and
 * `vault://file-deleted` events emitted by the backend file watcher.
 * Each event triggers a full {@link refreshNotes} call.
 */
async function setupEventListeners() {
	// Clean up any existing listeners first
	eventUnlisteners.forEach((unlisten) => unlisten());
	eventUnlisteners = [];

	// Listen for file created events
	const unlistenCreated = await listen('vault://file-created', async (event: { payload: unknown }) => {
		log.debug('File created', { payload: event.payload });
		await refreshNotes();
	});
	eventUnlisteners.push(unlistenCreated);

	// Listen for file modified events
	const unlistenModified = await listen('vault://file-modified', async (event: { payload: unknown }) => {
		log.debug('File modified', { payload: event.payload });
		await refreshNotes();
	});
	eventUnlisteners.push(unlistenModified);

	// Listen for file deleted events
	const unlistenDeleted = await listen('vault://file-deleted', async (event: { payload: unknown }) => {
		log.debug('File deleted', { payload: event.payload });
		await refreshNotes();
	});
	eventUnlisteners.push(unlistenDeleted);
}

/**
 * Tears down all registered Tauri event listeners.
 *
 * Call during application unmount to prevent memory leaks and
 * stale event handlers.
 */
export function cleanupVaultListeners() {
	eventUnlisteners.forEach((unlisten) => unlisten());
	eventUnlisteners = [];
}
