/**
 * Mock stub for @/stores/vault/vault.
 * Used when the real vault store is in a sandbox-restricted directory.
 * Tests control vault state by calling notes.set([...]) etc. directly.
 */
import { writable } from 'svelte/store';
import type { Note } from '../../types/data/vault';

export const notes = writable<Note[]>([]);
export const activeNote = writable<Note | null>(null);
export const vaultPath = writable<string>('');
export const isVaultOpen = writable<boolean>(false);

export function setActiveNote(note: Note | null) {
  activeNote.set(note);
}
export const refreshNotes = () => Promise.resolve();
export const openVault = () => Promise.resolve();
export const scanVault = () => Promise.resolve();
export const getNote = (_path: string) => Promise.resolve(null as unknown as Note);
