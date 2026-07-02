/**
 * Format Painter — copy inline formatting from selected text and apply to another selection.
 *
 * Detects markdown formatting wrappers (bold, italic, highlight, strikethrough, etc.)
 * around the current selection, stores them, and re-applies on the next selection.
 *
 * Usage:
 *   1. Select formatted text and activate the painter (toggleFormatPainter).
 *   2. The painter reads the wrapping syntax (e.g. ** for bold, == for highlight).
 *   3. Select new text — the stored format is applied and the painter deactivates.
 *   Right-click or middle-click cancels the painter.
 */

import { writable, get } from 'svelte/store';

export interface CapturedFormat {
  prefix: string;
  suffix: string;
  label: string;
}

const DETECTABLE_FORMATS: { prefix: string; suffix: string; label: string }[] = [
  { prefix: '**', suffix: '**', label: 'bold' },
  { prefix: '~~', suffix: '~~', label: 'strikethrough' },
  { prefix: '==', suffix: '==', label: 'highlight' },
  { prefix: '*', suffix: '*', label: 'italic' },
  { prefix: '`', suffix: '`', label: 'code' },
  { prefix: '<u>', suffix: '</u>', label: 'underline' },
  { prefix: '<sup>', suffix: '</sup>', label: 'superscript' },
  { prefix: '<sub>', suffix: '</sub>', label: 'subscript' },
];

/** Whether the format painter is currently active (waiting for a target selection). */
export const formatPainterActive = writable(false);

/** The captured format to apply. */
export const capturedFormat = writable<CapturedFormat | null>(null);

/**
 * Detect the outermost inline format wrapping the text at `from..to` in `doc`.
 * Returns the first match from DETECTABLE_FORMATS.
 */
export function detectFormat(doc: string, from: number, to: number): CapturedFormat | null {
  for (const fmt of DETECTABLE_FORMATS) {
    const pLen = fmt.prefix.length;
    const sLen = fmt.suffix.length;
    if (from >= pLen && to + sLen <= doc.length) {
      const before = doc.slice(from - pLen, from);
      const after = doc.slice(to, to + sLen);
      if (before === fmt.prefix && after === fmt.suffix) {
        return { prefix: fmt.prefix, suffix: fmt.suffix, label: fmt.label };
      }
    }
  }
  return null;
}

/**
 * Toggle the format painter. If activating, captures the format at the current
 * selection range in `doc`. If no format is detected, uses the provided fallback.
 */
export function toggleFormatPainter(doc: string, from: number, to: number): void {
  if (get(formatPainterActive)) {
    // Deactivate
    formatPainterActive.set(false);
    capturedFormat.set(null);
    return;
  }

  const detected = detectFormat(doc, from, to);
  if (detected) {
    capturedFormat.set(detected);
    formatPainterActive.set(true);
  } else {
    // No format detected — use highlight as a sensible default
    capturedFormat.set({ prefix: '==', suffix: '==', label: 'highlight' });
    formatPainterActive.set(true);
  }
}

/** Apply the captured format to a selection range, then deactivate. */
export function applyFormatPainter(): CapturedFormat | null {
  const fmt = get(capturedFormat);
  formatPainterActive.set(false);
  capturedFormat.set(null);
  return fmt;
}

/** Cancel the format painter without applying. */
export function cancelFormatPainter(): void {
  formatPainterActive.set(false);
  capturedFormat.set(null);
}
