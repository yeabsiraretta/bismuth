import { writable, derived, get } from 'svelte/store';
import type { Note } from '@/types/data/vault';
import type { PortentType, LifecycleState } from '@/types/data/entity';
import { deriveLifecycle } from '@/types/data/entity';
import { log } from '@/utils/logger';
import { notes, refreshNotes } from '@/stores/vault/vault';
import { assignNoteType, setNoteLifecycleState, quickCaptureNote } from '../services/capture';
import { subscribeVaultEvent } from '../services/captureEvents';

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
  await assignNoteType(path, type);
  await refreshNotes();
}

/** Set lifecycle state on a note */
export async function setLifecycleState(path: string, state: LifecycleState): Promise<void> {
  await setNoteLifecycleState(path, state);
  await refreshNotes();
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
    log.error('Batch classify failed', error as Error);
    throw error;
  } finally {
    isCaptureLoading.set(false);
  }
}

/** Quick capture — create a new note in the inbox within 200ms target */
export async function quickCapture(title?: string): Promise<string> {
  const note = await quickCaptureNote(title);
  await refreshNotes();
  return note.path;
}

/** Archive a note (hide from default views) */
export async function archiveNote(path: string): Promise<void> {
  await setLifecycleState(path, 'archived');
}

/** Set up real-time event listeners for capture dashboard */
export async function setupCaptureListeners(): Promise<() => void> {
  const unCreated = subscribeVaultEvent('vault://file-created', async () => refreshNotes());
  const unModified = subscribeVaultEvent('vault://file-modified', async () => refreshNotes());

  return async () => {
    await unCreated();
    await unModified();
  };
}
