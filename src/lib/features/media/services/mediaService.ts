/**
 * mediaService.ts — File I/O for media export results via Tauri invoke.
 *
 * Hard guard: destPath must never equal sourcePath — originals are never overwritten.
 * Uses Tauri's write_binary_file command via invoke rather than plugin-fs.
 */

import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { log } from '@/utils/logger';

const MEDIA_EDITS_SEGMENT = 'media-edits';

export class MediaServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'MediaServiceError';
  }
}

/**
 * Write exported media bytes to disk via Tauri.
 *
 * Rejects if destPath equals sourcePath (source protection).
 */
export async function writeMediaExport(
  destPath: string,
  sourcePath: string,
  data: Uint8Array
): Promise<void> {
  if (destPath === sourcePath) {
    throw new MediaServiceError(
      'Destination path must not equal source path — originals are never overwritten',
      'SOURCE_OVERWRITE_DENIED'
    );
  }
  if (!destPath.includes(MEDIA_EDITS_SEGMENT)) {
    throw new MediaServiceError(
      `Export destination must be within a ${MEDIA_EDITS_SEGMENT} directory`,
      'WRITE_SCOPE_VIOLATION'
    );
  }

  try {
    await invoke('write_binary_file', { path: destPath, data: Array.from(data) });
    log.info('mediaService: export written', { destPath, bytes: data.byteLength });
  } catch (err) {
    log.error('mediaService: writeMediaExport failed', err as Error);
    throw new MediaServiceError(
      `Failed to write export: ${(err as Error).message}`,
      'WRITE_FAILED'
    );
  }
}

/**
 * Open a save dialog and return the chosen path.
 */
export async function promptSavePath(
  sourcePath: string,
  extension: string
): Promise<string | null> {
  const baseName =
    sourcePath
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '') ?? 'export';
  const suggested = `${baseName}-edited.${extension}`;

  const result = await save({
    defaultPath: suggested,
    filters: [{ name: 'Image', extensions: [extension] }],
  });

  return result ?? null;
}

/** Convert a Blob to a Uint8Array for writeMediaExport. */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}
