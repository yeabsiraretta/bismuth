/**
 * Chem feature types — SMILES rendering configuration and block parsing.
 *
 * Inspired by the Obsidian Chem plugin (Smiles Drawer + RDKit.js).
 */

// ─── SMILES block parsing ──────────────────────────────────────────────────────

/** A single SMILES entry parsed from a code block. */
export interface SmilesEntry {
  /** The SMILES string */
  smiles: string;
  /** Optional label (from comment after //) */
  label?: string;
}

/** A parsed ```smiles code block. */
export interface SmilesBlock {
  from: number;
  to: number;
  entries: SmilesEntry[];
}

/** An inline SMILES match (e.g. $smiles=C1=CC=CC=C1). */
export interface InlineSmiles {
  from: number;
  to: number;
  smiles: string;
}

// ─── Rendering configuration ───────────────────────────────────────────────────

export type ChemTheme = 'light' | 'dark' | 'auto';

export interface ChemConfig {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Bond thickness multiplier */
  bondThickness: number;
  /** Theme for structure images */
  theme: ChemTheme;
  /** Enable inline SMILES rendering */
  inlineEnabled: boolean;
  /** Prefix for inline SMILES syntax */
  inlinePrefix: string;
  /** Whether copy exports transparent background */
  transparentExport: boolean;
  /** Whether to show the SMILES string below the structure */
  showLabel: boolean;
}

export const DEFAULT_CHEM_CONFIG: ChemConfig = {
  width: 300,
  height: 200,
  bondThickness: 1,
  theme: 'auto',
  inlineEnabled: false,
  inlinePrefix: '$smiles=',
  transparentExport: false,
  showLabel: true,
};
