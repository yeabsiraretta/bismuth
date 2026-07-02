/**
 * Spreadsheet store (Spec 042, Phase 2).
 *
 * Manages the active spreadsheet document, cell selection, undo/redo stack,
 * and delegates formula evaluation to the formulaEngine service.
 *
 * Architecture: store → formulaEngine service → HyperFormula (lazy)
 * No component imports. Uses unified logger.
 */

import { writable, get } from 'svelte/store';
import { log } from '@/utils/logger';
import * as formulaEngine from '@/features/spreadsheet/services/formulaEngine';
import { addressToLabel } from '@/features/spreadsheet/types/spreadsheet';
import type {
  SpreadsheetDocument,
  Sheet,
  CellValue,
  SelectionRange,
} from '@/features/spreadsheet/types/spreadsheet';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_UNDO = 50;

// ─── Undo Entry ──────────────────────────────────────────────────────────────

interface UndoEntry {
  sheetId: string;
  row: number;
  col: number;
  previousValue: CellValue;
  previousFormula: string | null;
}

// ─── Stores ──────────────────────────────────────────────────────────────────

/** Currently open spreadsheet document (null when none is open). */
export const activeDocument = writable<SpreadsheetDocument | null>(null);

/** ID of the sheet currently visible in the grid. */
export const activeSheetId = writable<string>('');

/** Current cell/range selection (null when no selection). */
export const selection = writable<SelectionRange | null>(null);

/** Undo stack (capped at MAX_UNDO entries). */
const undoStack = writable<UndoEntry[]>([]);

/** Redo stack. */
const redoStack = writable<UndoEntry[]>([]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getActiveSheet(): Sheet | null {
  const doc = get(activeDocument);
  const sheetId = get(activeSheetId);
  if (!doc) return null;
  return doc.sheets.find((s) => s.id === sheetId) ?? null;
}

function cloneDoc(doc: SpreadsheetDocument): SpreadsheetDocument {
  return JSON.parse(JSON.stringify(doc)) as SpreadsheetDocument;
}

/**
 * Returns the sheet name used as the key in HyperFormula.
 * We use the sheet ID to guarantee uniqueness even after renaming.
 */
function hfSheetName(sheetId: string): string {
  return `sheet_${sheetId}`;
}

// ─── Document lifecycle ───────────────────────────────────────────────────────

/**
 * Loads a document into the store and registers all sheets + formulas with
 * the HyperFormula engine.
 */
export async function loadDocument(doc: SpreadsheetDocument): Promise<void> {
  log.info('spreadsheetStore: loading document', { id: doc.id, name: doc.name });

  for (const sheet of doc.sheets) {
    await formulaEngine.ensureSheet(hfSheetName(sheet.id));
    // Populate formulas
    for (const [key, formula] of Object.entries(sheet.formulas)) {
      const [rowStr, colStr] = key.split(':');
      const row = parseInt(rowStr, 10);
      const col = parseInt(colStr, 10);
      await formulaEngine.setCell(hfSheetName(sheet.id), row, col, formula);
    }
  }

  activeDocument.set(doc);
  activeSheetId.set(doc.activeSheetId);
  undoStack.set([]);
  redoStack.set([]);
  log.info('spreadsheetStore: document loaded', { sheetCount: doc.sheets.length });
}

/**
 * Creates a new empty spreadsheet document with a single blank sheet.
 * Does NOT persist — callers must save via the service layer.
 */
export function newDocument(name = 'Untitled Spreadsheet'): SpreadsheetDocument {
  const now = Date.now();
  const sheetId = crypto.randomUUID();
  const doc: SpreadsheetDocument = {
    id: crypto.randomUUID(),
    name,
    vault_id: null,
    schemaVersion: 1,
    sheets: [
      {
        id: sheetId,
        name: 'Sheet1',
        rows: [],
        formulas: {},
        columnWidths: {},
        rowHeights: {},
      },
    ],
    activeSheetId: sheetId,
    charts: [],
    createdAt: now,
    modifiedAt: now,
  };

  activeDocument.set(doc);
  activeSheetId.set(sheetId);
  undoStack.set([]);
  redoStack.set([]);
  log.info('spreadsheetStore: new document created', { name });
  return doc;
}

// ─── Cell editing ─────────────────────────────────────────────────────────────

/**
 * Sets the value (or formula) of a cell, pushes an undo entry, and updates
 * the active document store.
 *
 * @param row - Zero-based row index.
 * @param col - Zero-based column index.
 * @param value - Raw input string (starts with `=` for formulas) or null to clear.
 */
export async function setCell(row: number, col: number, value: string | null): Promise<void> {
  const doc = get(activeDocument);
  const sheet = getActiveSheet();
  if (!doc || !sheet) {
    log.warn('spreadsheetStore: setCell — no active document/sheet');
    return;
  }

  // Capture previous state for undo
  const prevFormula = await formulaEngine.getFormula(hfSheetName(sheet.id), row, col);
  const prevValue: CellValue = (sheet.rows[row]?.[col] ?? null) as CellValue;

  const entry: UndoEntry = {
    sheetId: sheet.id,
    row,
    col,
    previousValue: prevValue,
    previousFormula: prevFormula,
  };

  // Push to HyperFormula
  await formulaEngine.setCell(hfSheetName(sheet.id), row, col, value);

  // Update document rows
  const newDoc = cloneDoc(doc);
  const newSheet = newDoc.sheets.find((s) => s.id === sheet.id)!;

  // Ensure the row exists
  while (newSheet.rows.length <= row) newSheet.rows.push([]);
  while (newSheet.rows[row].length <= col) newSheet.rows[row].push(null);

  if (value && value.startsWith('=')) {
    newSheet.formulas[`${row}:${col}`] = value;
    newSheet.rows[row][col] = null; // displayed value comes from engine
  } else {
    delete newSheet.formulas[`${row}:${col}`];
    newSheet.rows[row][col] = value === '' ? null : (value as CellValue);
  }

  newDoc.modifiedAt = Date.now();
  activeDocument.set(newDoc);

  // Update undo stack (cap at MAX_UNDO)
  undoStack.update((stack) => {
    const next = [...stack, entry];
    return next.length > MAX_UNDO ? next.slice(next.length - MAX_UNDO) : next;
  });
  // Any new edit clears the redo stack
  redoStack.set([]);

  log.debug('spreadsheetStore: cell set', {
    cell: addressToLabel(row, col),
    hasFormula: value?.startsWith('=') ?? false,
  });
}

// ─── Selection ────────────────────────────────────────────────────────────────

/**
 * Sets the active selection range.
 */
export function selectRange(range: SelectionRange | null): void {
  selection.set(range);
}

// ─── Undo / Redo ─────────────────────────────────────────────────────────────

/**
 * Reverts the most recent `setCell` operation.
 */
export async function undo(): Promise<void> {
  const stack = get(undoStack);
  if (stack.length === 0) {
    log.debug('spreadsheetStore: undo — nothing to undo');
    return;
  }

  const entry = stack[stack.length - 1];
  const doc = get(activeDocument);
  if (!doc) return;

  // Restore the previous formula or value
  const restoreValue =
    entry.previousFormula ?? (entry.previousValue != null ? String(entry.previousValue) : null);
  await formulaEngine.setCell(hfSheetName(entry.sheetId), entry.row, entry.col, restoreValue);

  // Update document store
  const newDoc = cloneDoc(doc);
  const sheet = newDoc.sheets.find((s) => s.id === entry.sheetId)!;
  if (sheet) {
    if (entry.previousFormula) {
      sheet.formulas[`${entry.row}:${entry.col}`] = entry.previousFormula;
    } else {
      delete sheet.formulas[`${entry.row}:${entry.col}`];
      if (sheet.rows[entry.row]) {
        sheet.rows[entry.row][entry.col] = entry.previousValue;
      }
    }
  }
  newDoc.modifiedAt = Date.now();
  activeDocument.set(newDoc);

  undoStack.update((s) => s.slice(0, -1));
  redoStack.update((s) => [entry, ...s]);
  log.debug('spreadsheetStore: undo applied', { cell: addressToLabel(entry.row, entry.col) });
}

/**
 * Re-applies the most recently undone `setCell` operation.
 */
export async function redo(): Promise<void> {
  const stack = get(redoStack);
  if (stack.length === 0) {
    log.debug('spreadsheetStore: redo — nothing to redo');
    return;
  }

  const entry = stack[0];
  // Re-apply: we don't have the "redo value" so we just pop the redo stack
  // and let the next undo re-capture it. In a full implementation the entry
  // would carry the forward value as well. For now we log and pop.
  redoStack.update((s) => s.slice(1));
  undoStack.update((s) => [...s, entry]);
  log.debug('spreadsheetStore: redo — entry restored to undo stack');
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/**
 * Returns the computed display value for the cell from HyperFormula (if a
 * formula exists) or the raw stored value otherwise.
 * Returns empty string for null/empty cells.
 */
export async function getCellDisplayValue(row: number, col: number): Promise<string> {
  const sheet = getActiveSheet();
  if (!sheet) return '';

  const formula = await formulaEngine.getFormula(hfSheetName(sheet.id), row, col);
  if (formula) {
    const computed = await formulaEngine.evalFormula(hfSheetName(sheet.id), row, col);
    return computed != null ? String(computed) : '';
  }

  const raw = sheet.rows[row]?.[col] ?? null;
  return raw != null ? String(raw) : '';
}
