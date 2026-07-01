import { invoke } from '@tauri-apps/api/core';

/**
 * Frontmatter timestamp management service.
 *
 * Provides IPC wrappers for reading/writing frontmatter fields,
 * batch operations, and auto-timestamp injection on save.
 */

/** Gets the frontmatter of a note by reading it from the backend. */
export async function getFrontmatter(path: string): Promise<Record<string, unknown>> {
  const note = await invoke<{ frontmatter: Record<string, unknown> }>('read_note', { path });
  return note.frontmatter;
}

/** Sets a single frontmatter field on a note (read-modify-write). */
export async function setFrontmatterField(
  path: string,
  key: string,
  value: unknown
): Promise<void> {
  await invoke('update_frontmatter_field', { path, key, value });
}

/**
 * Batch-updates a single frontmatter field across multiple notes.
 * Security: Caller must confirm before invoking (>1 file).
 * @returns Number of notes successfully updated.
 */
export async function batchSetFrontmatterField(
  paths: string[],
  key: string,
  value: unknown
): Promise<number> {
  return invoke<number>('batch_update_frontmatter_field', { paths, key, value });
}
