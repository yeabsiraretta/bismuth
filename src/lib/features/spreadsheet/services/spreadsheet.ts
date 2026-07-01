/**
 * Spreadsheet IPC service wrappers (Spec 042).
 *
 * Typed async wrappers for the Rust spreadsheet commands.
 * All Tauri calls are isolated here — no other file in the feature may call
 * `invoke()` directly.
 *
 * Uses the unified logger for all debug/info/error output.
 */

import { ipcCall } from '@/utils/ipc/invoke';
import { log } from '@/utils/logger';
import type { SpreadsheetDocument } from '@/features/spreadsheet/types/spreadsheet';

// Vault root is retrieved lazily from the app state; components pass it via
// the service functions to keep the service stateless.
// An empty string disables path validation in the Rust layer (dev mode).
let cachedVaultRoot = '';

/** Sets the vault root path used for path-safety validation. */
export function setVaultRoot(root: string): void {
  cachedVaultRoot = root;
}

/** Returns the currently cached vault root. */
export function getVaultRoot(): string {
  return cachedVaultRoot;
}

// ─── Raw CSV ─────────────────────────────────────────────────────────────────

/**
 * Reads a CSV file from the vault and returns it as a 2-D string grid.
 * @param path - Absolute or vault-relative file path.
 */
export async function readCsv(path: string): Promise<string[][]> {
  log.info('spreadsheet: reading CSV', { path });
  return ipcCall<string[][]>('read_csv', { path, vaultRoot: cachedVaultRoot });
}

/**
 * Writes a 2-D string grid to a CSV file inside the vault.
 * @param path - Absolute or vault-relative file path.
 * @param rows - Two-dimensional cell data.
 */
export async function writeCsv(path: string, rows: string[][]): Promise<void> {
  log.info('spreadsheet: writing CSV', { path, rowCount: rows.length });
  return ipcCall<void>('write_csv', { path, rows, vaultRoot: cachedVaultRoot });
}

// ─── JSON ────────────────────────────────────────────────────────────────────

/**
 * Reads a JSON table file (array-of-objects or array-of-arrays) and returns
 * it as a 2-D array of JSON values.
 * @param path - Absolute or vault-relative file path.
 */
export async function readJsonTable(path: string): Promise<unknown[][]> {
  log.info('spreadsheet: reading JSON table', { path });
  return ipcCall<unknown[][]>('read_json_table', { path, vaultRoot: cachedVaultRoot });
}

/**
 * Serialises a full `SpreadsheetDocument` to JSON and writes it to `path`.
 * @param path - Target file path (must be within vault).
 * @param doc - Document to persist.
 */
export async function writeJson(path: string, doc: SpreadsheetDocument): Promise<void> {
  log.info('spreadsheet: writing JSON', { path });
  return ipcCall<void>('write_json', { path, doc, vaultRoot: cachedVaultRoot });
}

// ─── Higher-level helpers ────────────────────────────────────────────────────

/**
 * Imports a CSV file and returns it as a 2-D string grid.
 * Alias for `readCsv` with semantic intent.
 */
export async function importCsv(path: string): Promise<string[][]> {
  log.interaction('ipc', 'spreadsheet:import-csv', { path });
  return readCsv(path);
}

/**
 * Exports a 2-D string grid as a CSV file.
 * Alias for `writeCsv` with semantic intent.
 */
export async function exportCsv(path: string, rows: string[][]): Promise<void> {
  log.interaction('ipc', 'spreadsheet:export-csv', { path });
  return writeCsv(path, rows);
}

/**
 * Imports a JSON table file and returns normalised rows.
 */
export async function importJsonTable(path: string): Promise<unknown[][]> {
  log.interaction('ipc', 'spreadsheet:import-json', { path });
  return readJsonTable(path);
}

/**
 * Persists a `SpreadsheetDocument` to a .bsheet.json file.
 */
export async function saveSpreadsheet(doc: SpreadsheetDocument, path: string): Promise<void> {
  log.interaction('ipc', 'spreadsheet:save', { path });
  return writeJson(path, doc);
}
