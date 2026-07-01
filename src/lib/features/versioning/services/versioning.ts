/**
 * IPC service wrappers for the knowledge versioning feature (spec 051).
 *
 * All Tauri `invoke()` calls are centralized here. Components and stores
 * must NOT call `invoke()` directly — they use these wrappers only.
 *
 * @module versioning/services/versioning
 */

import { ipcCall } from '@/utils/ipc';
import { log } from '@/utils/logger';
import type { DiffMetrics, VersionEntry } from '../types/versioning';

/**
 * Compute diff metrics between old and new document content.
 *
 * Delegates to the Rust `compute_version_diff_metrics` command.
 */
export async function computeDiffMetrics(
  oldContent: string,
  newContent: string,
): Promise<DiffMetrics> {
  log.debug('Versioning: computeDiffMetrics', { oldLen: oldContent.length, newLen: newContent.length });
  return ipcCall<DiffMetrics>('compute_version_diff_metrics', {
    oldContent,
    newContent,
  });
}

/**
 * Derive a new semver string by bumping `currentVersion` according to `metrics`.
 *
 * Delegates to the Rust `bump_version` command.
 */
export async function bumpVersion(
  currentVersion: string,
  metrics: DiffMetrics,
): Promise<string> {
  log.debug('Versioning: bumpVersion', { currentVersion });
  return ipcCall<string>('bump_version', { currentVersion, metrics });
}

/**
 * Save a version diff entry for `fileId` in the vault.
 *
 * Creates `.bismuth/versions/{fileId}/` if absent, writes a timestamped JSON file,
 * and returns the created `VersionEntry`.
 */
export async function saveDiff(
  vaultRoot: string,
  fileId: string,
  oldContent: string,
  newContent: string,
  version: string,
): Promise<VersionEntry> {
  log.debug('Versioning: saveDiff', { fileId, version });
  return ipcCall<VersionEntry>('save_note_version', {
    vaultRoot,
    fileId,
    oldContent,
    newContent,
    version,
  });
}

/**
 * List stored versions for `fileId`, newest-first, capped at 50.
 */
export async function listVersions(
  vaultRoot: string,
  fileId: string,
): Promise<VersionEntry[]> {
  log.debug('Versioning: listVersions', { fileId });
  return ipcCall<VersionEntry[]>('list_note_versions', { vaultRoot, fileId });
}

/**
 * Retrieve the raw diff JSON string for a specific version file.
 *
 * `version` should be the filename or the `diffPath` value from `VersionEntry`.
 * The vault root and file_id are used for path validation on the Rust side.
 */
export async function getNoteDiff(
  vaultRoot: string,
  fileId: string,
  version: string,
): Promise<string> {
  log.debug('Versioning: getNoteDiff', { fileId, version });
  return ipcCall<string>('get_note_diff', { vaultRoot, fileId, version });
}
