/**
 * versioningHook — note save lifecycle hook for knowledge versioning.
 *
 * Currently a stub. Wired into the editor save flow in a future integration
 * phase (Spec 051, Phase 4.1).
 *
 * Call from the editor save handler after a successful `write_note` IPC call.
 * Passes previous and new content so the versioning service can compute a
 * diff, classify the bump type, persist the diff entry, and update frontmatter.
 */
import { log } from '@/utils/logger';
import { get } from 'svelte/store';
import { settings } from '@/features/settings';

/**
 * Invoked after a note is successfully saved.
 *
 * @param vaultRoot   - Absolute path to the vault root directory.
 * @param noteId      - Relative note file path used as the versioning key.
 * @param oldContent  - Previous raw file content (snapshot taken before write).
 * @param newContent  - New raw file content (snapshot taken after write).
 */
export async function onNoteSave(
  _vaultRoot: string,
  noteId: string,
  oldContent: string,
  newContent: string
): Promise<void> {
  const currentSettings = get(settings);

  // Skip if versioning is disabled in user preferences
  if (!currentSettings.versioningEnabled) {
    return;
  }

  // Skip if content has not changed to avoid empty diff entries
  if (oldContent === newContent) {
    return;
  }

  try {
    // Future integration steps (Phase 4.1):
    //   1. computeDiffMetrics(oldContent, newContent)
    //   2. bumpVersion(metrics, currentVersion)  — where currentVersion is read
    //      from frontmatter, defaulting to "0.1.0" when absent
    //   3. saveDiff(vaultRoot, noteId, oldContent, newContent, currentVersion)
    //      → returns VersionEntry with the new semver string
    //   4. update_frontmatter_field("version", newVersion)
    //   5. update_frontmatter_field("version_history", last10Entries)
    log.debug('versioningHook: onNoteSave called (stub — integration pending)', {
      noteId,
      oldLen: oldContent.length,
      newLen: newContent.length,
    });
  } catch (err) {
    // Never propagate versioning errors to the save path
    log.error('versioningHook: unexpected error in onNoteSave', err as Error, { noteId });
  }
}
