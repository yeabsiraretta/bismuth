/**
 * Dialog service — wraps @tauri-apps/plugin-dialog for file picker operations.
 * Components MUST NOT import @tauri-apps/plugin-dialog directly.
 */

import { open, save } from '@tauri-apps/plugin-dialog';

export interface DialogOpenOptions {
  /** Dialog window title */
  title?: string;
  /** File type filters */
  filters?: Array<{ name: string; extensions: string[] }>;
  /** Allow selecting multiple files */
  multiple?: boolean;
  /** Starting directory */
  defaultPath?: string;
  /** Allow selecting directories instead of files */
  directory?: boolean;
}

export interface DialogSaveOptions {
  /** Dialog window title */
  title?: string;
  /** File type filters */
  filters?: Array<{ name: string; extensions: string[] }>;
  /** Default file name */
  defaultPath?: string;
}

/** Opens a file picker dialog. Returns selected path(s) or null if cancelled. */
export async function pickFile(options?: DialogOpenOptions): Promise<string | string[] | null> {
  return open(options) as Promise<string | string[] | null>;
}

/** Opens a file picker for importing a single file. Returns path or null. */
export async function pickImportFile(options?: DialogOpenOptions): Promise<string | null> {
  const result = await pickFile({ ...options, multiple: false });
  return Array.isArray(result) ? (result[0] ?? null) : result;
}

/** Opens a save dialog. Returns the selected path or null if cancelled. */
export async function pickSaveDestination(options?: DialogSaveOptions): Promise<string | null> {
  return save(options) as Promise<string | null>;
}
