import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { PortentType, LifecycleState } from '@/types/data/entity';
import { updateFrontmatterField } from '@/services/frontmatter';

/** Assign a Portent type to a note via frontmatter. */
export async function assignNoteType(path: string, type: PortentType): Promise<void> {
  await updateFrontmatterField(path, 'type', type);
}

/** Set lifecycle state (organized/archived) on a note via frontmatter. */
export async function setNoteLifecycleState(path: string, state: LifecycleState): Promise<void> {
  await updateFrontmatterField(path, 'organized', state === 'organized' || state === 'archived');
  await updateFrontmatterField(path, 'archived', state === 'archived');
}

/** Quick capture — create a new note in the inbox. */
export async function quickCaptureNote(title?: string): Promise<{ path: string }> {
  try {
    return await invoke<{ path: string }>('quick_capture', { title: title || null });
  } catch (error) {
    log.error('Quick capture failed', error as Error);
    throw error;
  }
}

/** Archive a note using the backend archive_note command. */
export async function archiveNoteCmd(path: string): Promise<void> {
  try {
    await invoke('archive_note', { path });
  } catch (error) {
    log.error('Failed to archive note', error as Error, { path });
    throw error;
  }
}

/** Organize a note by moving it to a destination folder. */
export async function organizeNoteCmd(path: string, folder: string): Promise<void> {
  try {
    await invoke('organize_note', { path, folder });
  } catch (error) {
    log.error('Failed to organize note', error as Error, { path, folder });
    throw error;
  }
}

/** Merge multiple notes into a single target note. */
export async function mergeNotesCmd(sources: string[], targetPath: string): Promise<void> {
  try {
    await invoke('merge_notes', { sources, targetPath });
  } catch (error) {
    log.error('Failed to merge notes', error as Error, { sources, targetPath });
    throw error;
  }
}
