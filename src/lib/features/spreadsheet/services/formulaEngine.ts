/**
 * HyperFormula engine wrapper (Spec 042, Phase 2).
 *
 * Lazy-loads HyperFormula on first call and exposes a typed, stateless-looking
 * API over the underlying engine singleton. The engine instance is created once
 * and reused across all calls.
 *
 * No store imports. No component imports. Pure service layer.
 * Uses the unified logger for all output.
 */

import { log } from '@/utils/logger';
import type { CellValue } from '@/features/spreadsheet/types/spreadsheet';

// ─── HyperFormula type surface (optional dependency) ─────────────────────────

/** Minimal typed surface for a HyperFormula engine instance. */
interface HyperFormulaEngine {
  getSheetNames(): string[];
  addSheet(name: string): void;
  removeSheet(index: number): void;
  setCellContents(address: { sheet: number; row: number; col: number }, value: string): void;
  getCellValue(address: { sheet: number; row: number; col: number }): CellValue | { type: string };
  getCellFormula(address: { sheet: number; row: number; col: number }): string | undefined;
  destroy(): void;
}

/** Minimal typed surface for the HyperFormula static class. */
interface HyperFormulaStatic {
  buildEmpty(options: { licenseKey: string }): HyperFormulaEngine;
  version: string;
}

// ─── Engine Singleton ────────────────────────────────────────────────────────

let hf: HyperFormulaEngine | null = null;
let HyperFormulaClass: HyperFormulaStatic | null = null;

/**
 * Returns the shared HyperFormula engine instance, lazy-initialising it on
 * first call via a dynamic import so it is excluded from the initial bundle.
 *
 * HyperFormula is an optional dependency — install with: pnpm add hyperformula
 */
async function getEngine(): Promise<HyperFormulaEngine> {
  if (!hf) {
    log.debug('formulaEngine: loading HyperFormula (first use)');
    const mod = await import(/* @vite-ignore */ 'hyperformula') as { HyperFormula: HyperFormulaStatic };
    HyperFormulaClass = mod.HyperFormula;
    hf = HyperFormulaClass.buildEmpty({ licenseKey: 'gpl-v3' });
    log.info('formulaEngine: HyperFormula initialised', {
      version: HyperFormulaClass.version,
    });
  }
  return hf;
}

// ─── Sheet lifecycle ─────────────────────────────────────────────────────────

/**
 * Ensures a sheet with the given name is registered in HyperFormula.
 * If it already exists this is a no-op.
 */
export async function ensureSheet(sheetName: string): Promise<void> {
  const engine = await getEngine();
  const names: string[] = engine.getSheetNames();
  if (!names.includes(sheetName)) {
    engine.addSheet(sheetName);
    log.debug('formulaEngine: sheet added', { sheetName });
  }
}

/**
 * Removes a sheet from HyperFormula.
 * No-op if the sheet does not exist.
 */
export async function removeSheet(sheetName: string): Promise<void> {
  const engine = await getEngine();
  const names: string[] = engine.getSheetNames();
  const idx = names.indexOf(sheetName);
  if (idx !== -1) {
    engine.removeSheet(idx);
    log.debug('formulaEngine: sheet removed', { sheetName });
  }
}

// ─── Cell operations ─────────────────────────────────────────────────────────

/**
 * Sets the raw content of a cell. If `value` starts with `=` it is treated as
 * a formula; otherwise it is set as a scalar.
 *
 * @param sheetName - Sheet name used when the engine was initialised.
 * @param row - Zero-based row index.
 * @param col - Zero-based column index.
 * @param value - Raw cell string (formula or literal), or null to clear.
 */
export async function setCell(
  sheetName: string,
  row: number,
  col: number,
  value: string | null
): Promise<void> {
  const engine = await getEngine();
  const names: string[] = engine.getSheetNames();
  const sheetId = names.indexOf(sheetName);
  if (sheetId === -1) {
    log.warn('formulaEngine: setCell — sheet not found', { sheetName });
    return;
  }
  engine.setCellContents({ sheet: sheetId, row, col }, value ?? '');
}

/**
 * Returns the computed (display) value for the cell at [row, col].
 * If HyperFormula returns an error object the formatted error string is
 * returned instead.
 */
export async function evalFormula(
  sheetName: string,
  row: number,
  col: number
): Promise<CellValue> {
  const engine = await getEngine();
  const names: string[] = engine.getSheetNames();
  const sheetId = names.indexOf(sheetName);
  if (sheetId === -1) return null;

  const result = engine.getCellValue({ sheet: sheetId, row, col });
  // HyperFormula error objects expose `#` in their string form
  if (result !== null && typeof result === 'object' && 'type' in result) {
    return String(result);
  }
  return result as CellValue;
}

/**
 * Returns the raw formula string for a cell, or `null` if the cell contains
 * a plain value.
 */
export async function getFormula(
  sheetName: string,
  row: number,
  col: number
): Promise<string | null> {
  const engine = await getEngine();
  const names: string[] = engine.getSheetNames();
  const sheetId = names.indexOf(sheetName);
  if (sheetId === -1) return null;
  const formula = engine.getCellFormula({ sheet: sheetId, row, col });
  return formula ?? null;
}

/**
 * Returns a formatted error string (e.g. "#CIRCULAR!", "#REF!") if the cell
 * has an evaluation error, or `null` if the cell is error-free.
 */
export async function getCellError(
  sheetName: string,
  row: number,
  col: number
): Promise<string | null> {
  const engine = await getEngine();
  const names: string[] = engine.getSheetNames();
  const sheetId = names.indexOf(sheetName);
  if (sheetId === -1) return null;

  const value = engine.getCellValue({ sheet: sheetId, row, col });
  if (value !== null && typeof value === 'object' && 'type' in value) {
    return String(value);
  }
  return null;
}

// ─── Engine lifecycle ────────────────────────────────────────────────────────

/**
 * Destroys the HyperFormula engine instance and releases its memory.
 * Should be called when the spreadsheet panel is unmounted.
 */
export function destroyEngine(): void {
  if (hf) {
    try {
      hf.destroy();
      log.debug('formulaEngine: engine destroyed');
    } catch (err) {
      log.warn('formulaEngine: destroy failed', { error: String(err) });
    }
    hf = null;
  }
}

/**
 * Returns `true` if the HyperFormula engine has been initialised.
 * Useful for conditional rendering in components.
 */
export function isEngineReady(): boolean {
  return hf !== null;
}
