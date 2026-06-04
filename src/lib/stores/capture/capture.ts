/**
 * Capture store — manages inbox/captured notes, lifecycle transitions, and quick capture.
 * Phase 7: US11 (Capture & Lifecycle Dashboard)
 */
import { writable, derived, get } from 'svelte/store';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { Note } from '@/types/vault';
import type { PortentType, LifecycleState } from '@/types/entity';
import { deriveLifecycle } from '@/types/entity';
import { notes, refreshNotes } from '@/stores/vault/vault';

/** Captured notes (not yet organized or archived) */
export const capturedNotes = derived(notes, ($notes) =>
  $notes.filter((n) => deriveLifecycle(n.frontmatter) === 'captured')
);

/** All notes by lifecycle */
export const notesByLifecycle = derived(notes, ($notes) => {
  const grouped: Record<LifecycleState, Note[]> = {
    captured: [],
    organized: [],
    archived: [],
  };
  $notes.forEach((n) => {
    const lc = deriveLifecycle(n.frontmatter);
    grouped[lc].push(n);
  });
  return grouped;
});

/** Selected note paths for batch actions */
export const selectedCaptures = writable<Set<string>>(new Set());

/** Loading state for capture operations */
export const isCaptureLoading = writable(false);

/** Toggle selection of a capture note */
export function toggleCaptureSelection(path: string) {
  selectedCaptures.update((s) => {
    const next = new Set(s);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    return next;
  });
}

/** Select all captured notes */
export function selectAllCaptures() {
  const captured = get(capturedNotes);
  selectedCaptures.set(new Set(captured.map((n) => n.path)));
}

/** Clear capture selection */
export function clearCaptureSelection() {
  selectedCaptures.set(new Set());
}

/** Assign a Portent type to a note via frontmatter update */
export async function assignType(path: string, type: PortentType): Promise<void> {
  try {
    await invoke('update_frontmatter_field', {
      path,
      key: 'type',
      value: type,
    });
    await refreshNotes();
  } catch (error) {
    console.error('Failed to assign type:', error);
    throw error;
  }
}

/** Set lifecycle state on a note */
export async function setLifecycleState(path: string, state: LifecycleState): Promise<void> {
  try {
    // Set organized/archived flags
    await invoke('update_frontmatter_field', {
      path,
      key: 'organized',
      value: state === 'organized' || state === 'archived',
    });
    await invoke('update_frontmatter_field', {
      path,
      key: 'archived',
      value: state === 'archived',
    });
    await refreshNotes();
  } catch (error) {
    console.error('Failed to set lifecycle:', error);
    throw error;
  }
}

/** Batch classify selected notes */
export async function batchClassify(
  type: PortentType | null,
  lifecycle: LifecycleState | null
): Promise<void> {
  const selected = get(selectedCaptures);
  if (selected.size === 0) return;

  isCaptureLoading.set(true);
  try {
    const paths = Array.from(selected);
    for (const path of paths) {
      if (type) await assignType(path, type);
      if (lifecycle) await setLifecycleState(path, lifecycle);
    }
    clearCaptureSelection();
  } catch (error) {
    console.error('Batch classify failed:', error);
    throw error;
  } finally {
    isCaptureLoading.set(false);
  }
}

/** Quick capture — create a new note in the inbox within 200ms target */
export async function quickCapture(title?: string): Promise<string> {
  try {
    const note = await invoke<{ path: string }>('quick_capture', {
      title: title || null,
    });
    await refreshNotes();
    return note.path;
  } catch (error) {
    console.error('Quick capture failed:', error);
    throw error;
  }
}

/** Archive a note (hide from default views) */
export async function archiveNote(path: string): Promise<void> {
  await setLifecycleState(path, 'archived');
}

/** Set up real-time event listeners for capture dashboard */
export async function setupCaptureListeners(): Promise<() => void> {
  const unlistenCreated = await listen('vault://file-created', async () => {
    await refreshNotes();
  });
  const unlistenModified = await listen('vault://file-modified', async () => {
    await refreshNotes();
  });

  return () => {
    unlistenCreated();
    unlistenModified();
  };
}
