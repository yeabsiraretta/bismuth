/**
 * MD5 hash utility for attachment files.
 * Uses the Web Crypto API (SHA-256 fallback) or Tauri invoke for on-disk files.
 */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';

/**
 * Compute an MD5 hex digest for a file at the given path via Tauri.
 * Falls back to a path-based hash if the backend command is unavailable.
 */
export async function computeMd5Hex(filePath: string): Promise<string> {
  try {
    return await invoke<string>('compute_file_md5', { path: filePath });
  } catch {
    log.debug('md5: backend unavailable, using path-based hash', { filePath });
    return pathHash(filePath);
  }
}

/**
 * Simple hash from a string (fallback when native MD5 is unavailable).
 * NOT cryptographic — only used for deduplication keys.
 */
function pathHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0');
}
