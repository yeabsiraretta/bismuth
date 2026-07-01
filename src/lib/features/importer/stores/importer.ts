/**
 * Importer store — tracks import state, progress, and history.
 */

import { writable, derived } from 'svelte/store';
import type { ImportSource, ImportOptions, ImportResult, ImportProgress } from '../types/importer';
import { DEFAULT_IMPORT_OPTIONS } from '../types/importer';
import { runImport } from '../services/importerService';
import { log } from '@/utils/logger';

/** Whether an import is currently in progress. */
export const isImporting = writable(false);

/** Current import progress (null when idle). */
export const importProgress = writable<ImportProgress | null>(null);

/** Current import options (user-configurable). */
export const importOptions = writable<ImportOptions>({ ...DEFAULT_IMPORT_OPTIONS });

/** Result of the last import (null if none). */
export const lastImportResult = writable<ImportResult | null>(null);

/** Import history (in-memory, resets on refresh). */
export const importHistory = writable<
  Array<ImportResult & { source: ImportSource; timestamp: string }>
>([]);

/** Whether the importer panel is open. */
export const importerPanelOpen = writable(false);

/** Derived: human-readable progress string. */
export const progressLabel = derived(importProgress, ($p) => {
  if (!$p) return '';
  const phase =
    $p.phase === 'reading' ? 'Reading' : $p.phase === 'converting' ? 'Converting' : 'Writing';
  return `${phase}: ${$p.currentTitle} (${$p.current}/${$p.total})`;
});

/** Set the import source and reset options to defaults for that source. */
export function selectSource(source: ImportSource): void {
  importOptions.update((o) => ({ ...o, source }));
}

/** Update a single import option. */
export function updateOption<K extends keyof ImportOptions>(key: K, value: ImportOptions[K]): void {
  importOptions.update((o) => ({ ...o, [key]: value }));
}

/** Execute the import with current options. */
export async function executeImport(): Promise<ImportResult | null> {
  let opts: ImportOptions;
  importOptions.subscribe((v) => {
    opts = v;
  })();

  if (!opts!) {
    log.warn('Importer: no options set');
    return null;
  }

  isImporting.set(true);
  importProgress.set(null);
  lastImportResult.set(null);

  try {
    const result = await runImport(opts, (progress) => {
      importProgress.set(progress);
    });

    lastImportResult.set(result);

    // Add to history
    if (result.imported > 0 || result.failed > 0) {
      importHistory.update((h) =>
        [{ ...result, source: opts.source, timestamp: new Date().toISOString() }, ...h].slice(0, 20)
      );
    }

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('Importer: import failed', err as Error);
    const failResult: ImportResult = {
      totalFound: 0,
      imported: 0,
      failed: 1,
      skipped: 0,
      errors: [{ title: 'Import', error: msg }],
      durationMs: 0,
    };
    lastImportResult.set(failResult);
    return failResult;
  } finally {
    isImporting.set(false);
    importProgress.set(null);
  }
}

/** Toggle the importer panel visibility. */
export function toggleImporterPanel(): void {
  importerPanelOpen.update((v) => !v);
}

/** Reset the importer to initial state. */
export function resetImporter(): void {
  isImporting.set(false);
  importProgress.set(null);
  lastImportResult.set(null);
  importOptions.set({ ...DEFAULT_IMPORT_OPTIONS });
}
