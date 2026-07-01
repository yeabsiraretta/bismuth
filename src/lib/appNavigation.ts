/**
 * Navigation primitives — note opening, tab switching, global keyboard shortcuts.
 * Command registration lives in app/appCommands.ts.
 */

import { get } from 'svelte/store';
import { getNote } from '@/services/vault/vault';
import { log } from '@/utils/logger';
import { refreshNotes, activeNote } from '@/stores/vault/vault';
import { quickCapture } from '@/features/capture';
import { toggleLeftSidebar, toggleRightSidebar, setActiveTab } from '@/stores/layout/layout';
import { openNoteTab, closeActiveTab, nextTab, prevTab } from '@/stores/editor/tabs';

/** Opens a note by path, loading full content and opening it in a tab. */
export async function openNote(path: string): Promise<void> {
  const current = get(activeNote);
  if (current && current.path === path) return;
  try {
    const note = await getNote(path);
    openNoteTab(note);
  } catch (error) {
    log.error('Failed to open note', error);
  }
}

/** Refreshes the vault note list from the backend. */
export async function doRefresh(): Promise<void> {
  await refreshNotes();
}

/** Switches the active tab on the specified sidebar side. */
export function changeTab(side: 'left' | 'right', tabId: string): void {
  setActiveTab(side, tabId);
}

/**
 * Global keyboard shortcut handler attached to the document.
 */
export function handleGlobalKeydown(e: KeyboardEvent, openCommandPalette: () => void): void {
  const mod = e.metaKey || e.ctrlKey;

  if (mod && e.key === 'p') { e.preventDefault(); openCommandPalette(); }
  if (mod && e.shiftKey && e.key === 'N') { e.preventDefault(); quickCapture(); }
  if (mod && e.key === 'w') { e.preventDefault(); closeActiveTab(); }
  if (mod && !e.shiftKey && e.key === 'Tab') { e.preventDefault(); nextTab(); }
  if (mod && e.shiftKey && e.key === 'Tab') { e.preventDefault(); prevTab(); }
  if (mod && e.key === 'h' && !e.shiftKey) { e.preventDefault(); import('@/stores/layout/presets').then(m => m.setViewportMode('home')); }
  if (mod && e.shiftKey && e.key === 'T') { e.preventDefault(); import('@/stores/editor/tabFeatures').then(m => m.reopenClosedTab()); }
  if (mod && e.key === 'b' && !e.shiftKey) { e.preventDefault(); toggleLeftSidebar(); }
  if (mod && e.shiftKey && e.key === 'B') { e.preventDefault(); toggleRightSidebar(); }
}
