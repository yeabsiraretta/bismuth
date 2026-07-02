/**
 * Vitest alias mock for @/stores/vault/vault.
 * Used when the real vault directory is sandboxed or unavailable in the test environment.
 */
import { writable } from 'svelte/store';

export const notes = writable<unknown[]>([]);
export const activeNote = writable<unknown>(null);
export const refreshNotes = async () => {};
export const vaultPath = writable<string>('');
