import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { SharedStyle } from '@/features/canvas/stores/design/styleLibrary';

/** Load shared styles for a canvas document. */
export async function loadSharedStyles(canvasId: string): Promise<SharedStyle[]> {
  try {
    return await invoke<SharedStyle[]>('load_shared_styles', { canvasId });
  } catch (err) {
    log.error('Failed to load shared styles', err as Error);
    return [];
  }
}

/** Save shared styles for a canvas document. */
export async function saveSharedStyles(canvasId: string, styles: SharedStyle[]): Promise<void> {
  try {
    await invoke<void>('save_shared_styles', { canvasId, styles });
  } catch (err) {
    log.error('Failed to save shared styles', err as Error);
  }
}

/** Delete a single shared style by ID. */
export async function deleteSharedStyle(canvasId: string, styleId: string): Promise<void> {
  try {
    await invoke<void>('delete_shared_style', { canvasId, styleId });
  } catch (err) {
    log.error('Failed to delete shared style', err as Error);
  }
}

/** Sync styles across canvas documents within vault. */
export async function syncStyleLibrary(): Promise<SharedStyle[]> {
  try {
    return await invoke<SharedStyle[]>('sync_style_library');
  } catch (err) {
    log.error('Failed to sync style library', err as Error);
    return [];
  }
}
