/**
 * Public API barrel for the spreadsheet feature module (Spec 042).
 *
 * External consumers MUST import only from this barrel:
 *   import { SpreadsheetDocument, activeDocument } from '@/features/spreadsheet'
 *
 * Internal paths (stores/, services/) are NOT exported to other features.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  CellValue,
  CellAddress,
  SelectionRange,
  Sheet,
  ChartConfig,
  ImportFormat,
  SpreadsheetDocument,
} from './types/spreadsheet';

export {
  colIndexToLabel,
  addressToLabel,
  SCHEMA_VERSION,
} from './types/spreadsheet';

// ─── Store (read-only subscription surface) ───────────────────────────────────
export { activeDocument, activeSheetId, selection } from './stores/spreadsheetStore';

// ─── Components (used by sidebar/panel host only) ─────────────────────────────
export { default as SpreadsheetPanel } from './components/SpreadsheetPanel.svelte';
export { default as SpreadsheetGrid } from './components/SpreadsheetGrid.svelte';
export { default as SpreadsheetToolbar } from './components/SpreadsheetToolbar.svelte';
export { default as CellEditor } from './components/CellEditor.svelte';
