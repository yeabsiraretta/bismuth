/**
 * CodeMirror extension for Zoom — hides content outside the zoomed range,
 * provides keyboard shortcuts, and handles bullet click to zoom.
 */

import { StateField, StateEffect, type Extension, type Range } from '@codemirror/state';
import { Decoration, EditorView, keymap } from '@codemirror/view';
import type { ZoomRange, ZoomTarget } from '../types/zoom';
import { targetAtLine } from '../services/zoomService';

// ─── State effects ──────────────────────────────────────────────────────────

export const setZoomRange = StateEffect.define<ZoomRange | null>();

// ─── Decorations ────────────────────────────────────────────────────────────

const hiddenLine = Decoration.line({ class: 'cm-zoom-hidden' });
const zoomTargetLine = Decoration.line({ class: 'cm-zoom-target' });

// ─── State field ────────────────────────────────────────────────────────────

const zoomField = StateField.define<ZoomRange | null>({
  create() {
    return null;
  },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setZoomRange)) return e.value;
    }
    return value;
  },
});

const zoomDecorations = EditorView.decorations.compute([zoomField], (state) => {
  const range = state.field(zoomField);
  if (!range) return Decoration.none;

  const decos: Range<Decoration>[] = [];
  const doc = state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    if (line.from < range.from || line.from >= range.to) {
      decos.push(hiddenLine.range(line.from, line.from));
    } else if (line.from === range.from) {
      decos.push(zoomTargetLine.range(line.from, line.from));
    }
  }

  return Decoration.set(decos, true);
});

// ─── Theme ──────────────────────────────────────────────────────────────────

export const zoomTheme = EditorView.baseTheme({
  '.cm-zoom-hidden': {
    display: 'none !important',
  },
  '.cm-zoom-target': {
    borderLeft: '3px solid var(--interactive-accent)',
    paddingLeft: '8px',
  },
});

// ─── Keymap ─────────────────────────────────────────────────────────────────

/**
 * Zoom in: find the heading/list at the cursor line, dispatch zoom.
 * Returns false if no target found (let other keymaps handle it).
 */
function zoomInAtCursor(view: EditorView): boolean {
  const pos = view.state.selection.main.head;
  const lineNum = view.state.doc.lineAt(pos).number;
  const content = view.state.doc.toString();
  const target = targetAtLine(content, lineNum);
  if (!target) return false;

  // Dispatch a custom event so the Svelte store can pick it up
  view.dom.dispatchEvent(new CustomEvent('zoom-in', { detail: { target }, bubbles: true }));
  return true;
}

/** Zoom out: dispatch event for the Svelte store. */
function zoomOutAll(view: EditorView): boolean {
  view.dom.dispatchEvent(new CustomEvent('zoom-out', { bubbles: true }));
  return true;
}

export const zoomKeymap = keymap.of([
  { key: 'Mod-.', run: zoomInAtCursor },
  { key: 'Mod-Shift-.', run: zoomOutAll },
]);

// ─── Bullet click handler ───────────────────────────────────────────────────

/**
 * Creates a click handler that zooms in when clicking a bullet marker.
 * Only active when `zoomOnClick` is true.
 */
export function bulletClickHandler(
  onZoomIn: (target: ZoomTarget) => void,
  isEnabled: () => boolean
): Extension {
  return EditorView.domEventHandlers({
    click(event: MouseEvent, view: EditorView) {
      if (!isEnabled()) return false;

      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos === null) return false;

      const line = view.state.doc.lineAt(pos);
      const lineText = line.text;

      // Check if click is on the bullet/marker area (first few chars of line)
      const clickOffset = pos - line.from;
      const markerMatch = lineText.match(/^(\s*)([-*+]|\d+\.|#{1,6})\s/);
      if (!markerMatch) return false;

      // Only trigger if clicked within the marker region
      const markerEnd = markerMatch[0].length;
      if (clickOffset > markerEnd) return false;

      const content = view.state.doc.toString();
      const target = targetAtLine(content, line.number);
      if (!target) return false;

      onZoomIn(target);
      return true;
    },
  });
}

// ─── Combined extension ─────────────────────────────────────────────────────

/**
 * Create the full zoom extension.
 * Call `view.dispatch({ effects: setZoomRange.of(range) })` to activate zoom.
 */
export function zoomExtension(
  onZoomIn: (target: ZoomTarget) => void,
  isClickEnabled: () => boolean
): Extension[] {
  return [
    zoomField,
    zoomDecorations,
    zoomTheme,
    zoomKeymap,
    bulletClickHandler(onZoomIn, isClickEnabled),
  ];
}
