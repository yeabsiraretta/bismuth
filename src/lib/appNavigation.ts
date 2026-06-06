/**
 * App navigation and command registration logic.
 * Extracted from App.svelte for 300-line compliance.
 */

import { getNote } from '@/services/vault/vault';
import { setActiveNote, refreshNotes } from '@/stores/vault/vault';
import { quickCapture } from '@/stores/capture/capture';
import {
  toggleLeftSidebar,
  toggleRightSidebar,
  setActiveTab,
} from '@/stores/layout/layout';
import { registerDefaultCommands } from '@/stores/commands';

export interface AppCallbacks {
  openCommandPalette: () => void;
  openAutoLinker: () => void;
  setLeftTab: (tab: string) => void;
}

export function registerAppCommands(callbacks: AppCallbacks): void {
  registerDefaultCommands({
    openSearch: callbacks.openCommandPalette,
    openCommandPalette: callbacks.openCommandPalette,
    toggleLeftSidebar,
    toggleRightSidebar,
    quickCapture: () => quickCapture(),
    openGraph: () => callbacks.setLeftTab('graph'),
    openCaptureDashboard: () => callbacks.setLeftTab('inbox'),
    openAutoLinker: callbacks.openAutoLinker,
  });
}

export function handleGlobalKeydown(
  e: KeyboardEvent,
  openCommandPalette: () => void
): void {
  if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
    e.preventDefault();
    openCommandPalette();
  }
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
    e.preventDefault();
    quickCapture();
  }
}

export async function openNote(path: string): Promise<void> {
  try {
    const note = await getNote(path);
    setActiveNote(note);
  } catch (error) {
    console.error('Failed to open note:', error);
  }
}

export async function doRefresh(): Promise<void> {
  await refreshNotes();
}

export function changeTab(side: 'left' | 'right', tabId: string): void {
  setActiveTab(side, tabId);
}
