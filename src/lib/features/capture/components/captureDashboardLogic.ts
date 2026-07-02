import { assignType, setLifecycleState, batchClassify, quickCapture } from '../stores/capture';
import { archiveNoteCmd, organizeNoteCmd } from '../services/capture';
import { refreshNotes, setActiveNote } from '@/stores/vault/vault';
import type { PortentType, LifecycleState } from '@/types/data/entity';
import type { ClassificationData } from '@/types/features/capture';
import * as vaultService from '@/services/vault/vault';
import { log } from '@/utils/logger';
import { openConfirm } from '@/stores/confirm';

export async function openClassification(path: string) {
  try {
    const fullNote = await vaultService.getNote(path);
    setActiveNote(fullNote);
  } catch (error) {
    log.error('Failed to open note', error);
  }
}

export async function handleClassificationSave(
  activeNotePath: string,
  data: ClassificationData,
  closeClassification: () => void
) {
  try {
    if (data.type) await assignType(activeNotePath, data.type);
    if (data.lifecycle) await setLifecycleState(activeNotePath, data.lifecycle);
    await vaultService.writeNote(activeNotePath, data.content);
    await refreshNotes();
    closeClassification();
  } catch (error) {
    log.error('Failed to save classification', error);
  }
}

export function handleClassificationDelete(
  activeNotePath: string,
  closeClassification: () => void
): void {
  openConfirm({
    title: 'Delete Note',
    message: 'Delete this note? This cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'danger',
    onConfirm: async () => {
      try {
        await vaultService.deleteNote(activeNotePath);
        closeClassification();
        await refreshNotes();
      } catch (error) {
        log.error('Failed to delete note', error);
      }
    },
  });
}

export async function handleAssignType(path: string, type: string) {
  try {
    await assignType(path, type as PortentType);
  } catch (error) {
    log.error('Failed to assign type', error);
  }
}

export async function handleSetLifecycle(path: string, lifecycle: string) {
  try {
    await setLifecycleState(path, lifecycle as LifecycleState);
  } catch (error) {
    log.error('Failed to set lifecycle', error);
  }
}

export async function handleBatchClassify(type: string, lifecycle: string) {
  try {
    await batchClassify(
      type ? (type as PortentType) : null,
      lifecycle ? (lifecycle as LifecycleState) : null
    );
  } catch (error) {
    log.error('Batch classify failed', error);
  }
}

export function handleDelete(path: string): void {
  const name = path.split('/').pop() ?? path;
  openConfirm({
    title: 'Delete Note',
    message: `Delete "${name}"? This cannot be undone.`,
    confirmLabel: 'Delete',
    variant: 'danger',
    onConfirm: async () => {
      try {
        await vaultService.deleteNote(path);
        await refreshNotes();
      } catch (error) {
        log.error('Failed to delete note', error);
      }
    },
  });
}

export async function handleQuickCapture() {
  try {
    await quickCapture();
  } catch (error) {
    log.error('Quick capture failed', error);
  }
}

export async function handleArchiveNote(path: string): Promise<void> {
  try {
    await archiveNoteCmd(path);
    await refreshNotes();
  } catch {
    try {
      await setLifecycleState(path, 'archived');
      await refreshNotes();
    } catch (error) {
      log.error('Failed to archive note', error, { path });
    }
  }
}

export async function handleOrganizeNote(path: string, folder: string): Promise<void> {
  try {
    await organizeNoteCmd(path, folder);
    await refreshNotes();
  } catch {
    try {
      await setLifecycleState(path, 'organized');
      await refreshNotes();
    } catch (error) {
      log.error('Failed to organize note', error, { path, folder });
    }
  }
}
