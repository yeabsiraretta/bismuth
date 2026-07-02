/**
 * Vault store stub for testing.
 * Replaces the sandboxed @/stores/vault/vault module in test environments.
 */
import { writable } from 'svelte/store';

export const notes = writable<unknown[]>([]);
export const activeNote = writable<unknown>(null);
export const vaultPath = writable<string>('');
export const refreshNotes = async (): Promise<void> => {};
export const openNote = async (_path: string): Promise<void> => {};
