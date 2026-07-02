/**
 * Spreadsheet feature types — Spec 042.
 *
 * Defines the core data model for spreadsheet documents, cells, charts,
 * and import/export format discriminants used across the feature module.
 * Schema version 1.
 */

/** Primitive value that can occupy a spreadsheet cell. */
export type CellValue = string | number | boolean | null;

/** Zero-based row/col address within a sheet. */
export interface CellAddress {
  /** Sheet document ID (used when addressing across sheets). */
  sheetId: string;
  /** Zero-based row index. */
  row: number;
  /** Zero-based column index. */
  col: number;
}

/** A contiguous rectangular selection range within one sheet. */
export interface SelectionRange {
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

/** A single sheet within a spreadsheet document. */
export interface Sheet {
  /** UUID v4. */
  id: string;
  /** Display name, e.g. "Sheet1". */
  name: string;
  /**
   * Sparse cell value store: rows[rowIndex][colIndex].
   * null means the cell is empty. Formulas are stored separately
   * in HyperFormula's internal graph and not reflected here directly.
   */
  rows: CellValue[][];
  /**
   * Raw formula strings per cell, keyed as "R:C" (e.g. "0:3").
   * On load the service calls hf.setCellContents() for each entry.
   */
  formulas: Record<string, string>;
  /** Per-column pixel widths overrides. col index → pixel width. */
  columnWidths: Record<number, number>;
  /** Per-row pixel height overrides. row index → pixel height. */
  rowHeights: Record<number, number>;
}

/** Chart embedded in a spreadsheet document. */
export interface ChartConfig {
  /** UUID v4. */
  id: string;
  type: 'bar' | 'line' | 'pie';
  title: string;
  sheetId: string;
  /** Data range bounding box (zero-based, inclusive). */
  dataRange: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
}

/** Supported import/export formats. */
export type ImportFormat = 'csv' | 'tsv' | 'json';

/** Top-level spreadsheet document stored as a .bsheet.json vault file. */
export interface SpreadsheetDocument {
  /** UUID v4. */
  id: string;
  /** Display name shown in the file tree. */
  name: string;
  /** Vault ID (null when not associated with a specific vault). */
  vault_id: string | null;
  /** Schema version — always 1 for this release. */
  schemaVersion: 1;
  /** Ordered array of sheets. At least one sheet must be present. */
  sheets: Sheet[];
  /** ID of the currently active sheet. */
  activeSheetId: string;
  /** Embedded chart configurations. */
  charts: ChartConfig[];
  /** Unix timestamp (ms) when the document was first created. */
  createdAt: number;
  /** Unix timestamp (ms) of the last modification. */
  modifiedAt: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Schema version constant. */
export const SCHEMA_VERSION = 1 as const;

/**
 * Converts a zero-based column index to its letter label (A, B, … Z, AA, AB, …).
 */
export function colIndexToLabel(col: number): string {
  let label = '';
  let n = col;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/**
 * Converts a zero-based row/col pair to spreadsheet notation (A1, B3, AA12).
 */
export function addressToLabel(row: number, col: number): string {
  return `${colIndexToLabel(col)}${row + 1}`;
}
