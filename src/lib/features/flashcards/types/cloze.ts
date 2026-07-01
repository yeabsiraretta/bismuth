/**
 * Cloze feature types — configuration for the interactive cloze deletion system.
 *
 * Inspired by Obsidian Cloze plugin: click-to-toggle, hover-reveal,
 * hints, fixed-width blanks, and auto-convert from markdown formatting.
 */

// ─── Auto-convert settings ─────────────────────────────────────────────────────

export interface ClozeAutoConvert {
  /** Auto-convert ==highlighted== text */
  highlights: boolean;
  /** Auto-convert **bold** text */
  bold: boolean;
  /** Auto-convert <u>underlined</u> text */
  underline: boolean;
  /** Auto-convert {curly brace} text */
  curly: boolean;
}

// ─── Hint settings ─────────────────────────────────────────────────────────────

export type ClozeHintMode = 'none' | 'first-letters' | 'percentage';

export interface ClozeHintConfig {
  /** Hint mode for auto-converted clozes */
  mode: ClozeHintMode;
  /** Number of first letters to show (when mode = 'first-letters') */
  firstLetterCount: number;
  /** Percentage of text to show (when mode = 'percentage', 0–100) */
  percentage: number;
}

// ─── Main config ───────────────────────────────────────────────────────────────

export interface ClozeConfig {
  /** Whether cloze rendering is active */
  enabled: boolean;
  /** Initial visibility of clozes (true = revealed by default) */
  defaultRevealed: boolean;
  /** Hover to reveal hidden clozes */
  hoverReveal: boolean;
  /** Use fixed-width blanks to hide text length */
  fixedWidth: boolean;
  /** Fixed width in px (when fixedWidth is true) */
  fixedWidthPx: number;
  /** Auto-convert formatting into cloze blanks */
  autoConvert: ClozeAutoConvert;
  /** Hint settings for hidden clozes */
  hint: ClozeHintConfig;
  /** Only activate on notes with this tag (empty = all notes) */
  requiredTag: string;
}

export const DEFAULT_CLOZE_CONFIG: ClozeConfig = {
  enabled: true,
  defaultRevealed: false,
  hoverReveal: false,
  fixedWidth: false,
  fixedWidthPx: 80,
  autoConvert: {
    highlights: true,
    bold: false,
    underline: false,
    curly: true,
  },
  hint: {
    mode: 'none',
    firstLetterCount: 1,
    percentage: 20,
  },
  requiredTag: '',
};
