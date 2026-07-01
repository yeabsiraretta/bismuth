/**
 * Typewriter Scroll — keeps the cursor line at a configurable vertical
 * position in the viewport, with optional Zen Mode (line dimming).
 *
 * Features:
 *   - Configurable offset (0 = top, 0.5 = center, 1 = bottom)
 *   - Keyboard-only mode: only scrolls on arrow keys and typing, not mouse
 *   - Top/bottom padding so content can reach the center position
 *   - Independent Zen Mode: dims lines outside a configurable radius
 *   - Paragraph-aware dimming: includes continuation lines
 *
 * Pure CM6 extension. No backend needed.
 */

import { EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import { Facet, type Extension } from '@codemirror/state';

// ─── Configuration ──────────────────────────────────────────────────────────

export interface TypewriterConfig {
  /** Master switch for typewriter scroll. */
  enabled: boolean;
  /** Vertical position for the cursor (0 = top, 0.5 = center, 1 = bottom). */
  offset: number;
  /** Only scroll on keyboard input, not mouse clicks/selection. */
  onlyKeyboard: boolean;
}

export interface ZenConfig {
  /** Master switch for zen/focus mode (independent of typewriter). */
  enabled: boolean;
  /** Number of visible lines above and below cursor. */
  visibleLines: number;
  /** Opacity for dimmed lines (0-1). */
  dimOpacity: number;
}

const defaultTypewriter: TypewriterConfig = {
  enabled: false,
  offset: 0.5,
  onlyKeyboard: true,
};

const defaultZen: ZenConfig = {
  enabled: false,
  visibleLines: 5,
  dimOpacity: 0.25,
};

export const typewriterFacet = Facet.define<TypewriterConfig, TypewriterConfig>({
  combine(values) { return values[0] ?? defaultTypewriter; },
});

export const zenFacet = Facet.define<ZenConfig, ZenConfig>({
  combine(values) { return values[0] ?? defaultZen; },
});

// ─── Input source tracking ─────────────────────────────────────────────────

const KEYBOARD_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown',
  'Enter', 'Backspace', 'Delete', 'Tab',
]);

/** Track whether the last interaction was keyboard-driven. */
class InputSourceTracker {
  isKeyboard = false;
  private _view: EditorView;
  private _onKey: (e: KeyboardEvent) => void;
  private _onMouse: () => void;

  constructor(view: EditorView) {
    this._view = view;
    this._onKey = (e: KeyboardEvent) => {
      this.isKeyboard = KEYBOARD_KEYS.has(e.key) || e.key.length === 1;
    };
    this._onMouse = () => { this.isKeyboard = false; };
    view.dom.addEventListener('keydown', this._onKey);
    view.dom.addEventListener('mousedown', this._onMouse);
  }

  update(_update: ViewUpdate) { /* state tracked via DOM events */ }

  destroy() {
    this._view.dom.removeEventListener('keydown', this._onKey);
    this._view.dom.removeEventListener('mousedown', this._onMouse);
  }
}

const inputSourcePlugin = ViewPlugin.fromClass(InputSourceTracker);

// ─── Scroll centering plugin ────────────────────────────────────────────────

const scrollPlugin = ViewPlugin.fromClass(
  class {
    private lastLine = -1;

    update(update: ViewUpdate) {
      const config = update.view.state.facet(typewriterFacet);
      if (!config.enabled) return;
      if (!update.docChanged && !update.selectionSet) return;

      // Keyboard-only check
      if (config.onlyKeyboard) {
        const source = update.view.plugin(inputSourcePlugin) as InputSourceTracker | null;
        if (source && !source.isKeyboard) return;
      }

      const { head } = update.state.selection.main;
      const line = update.state.doc.lineAt(head).number;
      if (line === this.lastLine && !update.docChanged) return;
      this.lastLine = line;

      const offset = Math.max(0, Math.min(1, config.offset));
      centerCursorAt(update.view, head, offset);
    }
  },
);

function centerCursorAt(view: EditorView, pos: number, offset: number): void {
  requestAnimationFrame(() => {
    const coords = view.coordsAtPos(pos);
    if (!coords) return;
    const { top: editorTop } = view.dom.getBoundingClientRect();
    const viewportHeight = view.dom.clientHeight;
    const targetY = editorTop + viewportHeight * offset;
    const diff = coords.top - targetY;
    if (Math.abs(diff) > 5) {
      view.scrollDOM.scrollBy({ top: diff, behavior: 'smooth' });
    }
  });
}

// ─── Top/bottom padding for edge centering ──────────────────────────────────

const paddingPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      const config = update.view.state.facet(typewriterFacet);
      const content = update.view.contentDOM;
      if (!config.enabled) {
        content.style.removeProperty('padding-top');
        content.style.removeProperty('padding-bottom');
        return;
      }
      const height = update.view.dom.clientHeight;
      const topPad = Math.round(height * config.offset);
      const bottomPad = Math.round(height * (1 - config.offset));
      content.style.paddingTop = `${topPad}px`;
      content.style.paddingBottom = `${bottomPad}px`;
    }
  },
);

// ─── Zen Mode (line dimming) ────────────────────────────────────────────────

const zenTheme = EditorView.baseTheme({
  '&.cm-zen .cm-line': {
    transition: 'opacity 0.15s ease',
  },
  '&.cm-zen .cm-line.cm-zen-dim': {
    opacity: 'var(--zen-dim-opacity, 0.25)',
  },
  '&.cm-zen .cm-activeLine': {
    opacity: '1 !important',
  },
});

const zenPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      const config = update.view.state.facet(zenFacet);
      if (!config.enabled) {
        update.view.dom.classList.remove('cm-zen');
        return;
      }

      update.view.dom.classList.add('cm-zen');
      update.view.dom.style.setProperty('--zen-dim-opacity', String(config.dimOpacity));

      if (!update.docChanged && !update.selectionSet && !update.viewportChanged) return;

      const { head } = update.state.selection.main;
      const cursorLine = update.state.doc.lineAt(head).number;
      const radius = config.visibleLines;

      const lineEls = update.view.dom.querySelectorAll('.cm-line');
      let idx = 1;
      for (const el of lineEls) {
        const distance = Math.abs(idx - cursorLine);
        el.classList.toggle('cm-zen-dim', distance > radius);
        idx++;
      }
    }

    destroy() {
      // Cleanup handled by CM6 tearing down the DOM
    }
  },
);

// ─── Public API ─────────────────────────────────────────────────────────────

/** Create the typewriter scroll extension. */
export function typewriterScroll(config?: Partial<TypewriterConfig>): Extension[] {
  const merged = { ...defaultTypewriter, ...config };
  return [
    typewriterFacet.of(merged),
    inputSourcePlugin,
    scrollPlugin,
    paddingPlugin,
  ];
}

/** Create the zen mode (focus dimming) extension. */
export function zenMode(config?: Partial<ZenConfig>): Extension[] {
  const merged = { ...defaultZen, ...config };
  return [
    zenFacet.of(merged),
    zenPlugin,
    zenTheme,
  ];
}

/** Combined extension for both typewriter scroll + zen mode. */
export function typewriterMode(
  twConfig?: Partial<TypewriterConfig>,
  zmConfig?: Partial<ZenConfig>,
): Extension[] {
  return [...typewriterScroll(twConfig), ...zenMode(zmConfig)];
}
