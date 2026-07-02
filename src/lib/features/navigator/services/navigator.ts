import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';

/** Loads persisted navigator state from .bismuth/navigator.json on disk. */
export async function readNavigatorState(): Promise<unknown | null> {
  try {
    return await invoke<unknown>('read_navigator_state');
  } catch {
    log.debug('Navigator state not found on disk');
    return null;
  }
}

/** Persists navigator state to .bismuth/navigator.json on disk. */
export async function writeNavigatorState(content: unknown): Promise<void> {
  try {
    await invoke('write_navigator_state', { content });
    log.debug('Navigator state saved to disk');
  } catch (error) {
    log.error('Failed to save navigator state', error as Error);
  }
}
