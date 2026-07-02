/**
 * Hemingway Mode — prevents editing text written before the session start.
 *
 * Pure CM6 extension. Forces forward-only writing: you cannot go back
 * and edit earlier content. Ideal for first-draft writing sessions.
 */

import { EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import { EditorState, Facet, type Transaction, type TransactionSpec } from '@codemirror/state';

// ─── Configuration ──────────────────────────────────────────────────────────

export interface HemingwayConfig {
  enabled: boolean;
}

const defaultConfig: HemingwayConfig = {
  enabled: false,
};

export const hemingwayConfig = Facet.define<HemingwayConfig, HemingwayConfig>({
  combine(values) {
    return values[0] ?? defaultConfig;
  },
});

// ─── Session start position tracking ────────────────────────────────────────

const hemingwayPlugin = ViewPlugin.fromClass(
  class {
    /** Document offset at the moment the extension was activated */
    sessionStart: number;

    constructor(view: EditorView) {
      this.sessionStart = view.state.doc.length;
    }

    update(_update: ViewUpdate) {
      // sessionStart remains fixed for the writing session
    }
  }
);

// ─── Transaction filter: block edits before session start ───────────────────

function hemingwayFilter(view: EditorView) {
  return EditorState.transactionFilter.of((tr: Transaction) => {
    const config = tr.state.facet(hemingwayConfig);
    if (!config.enabled) return tr;

    const plugin = view.plugin(hemingwayPlugin);
    if (!plugin) return tr;

    // Allow transactions without document changes (selection, scroll, etc.)
    if (!tr.docChanged) return tr;

    let blocked = false;
    tr.changes.iterChanges((fromA: number) => {
      if (fromA < plugin.sessionStart) {
        blocked = true;
      }
    });

    if (blocked) {
      // Discard the transaction — edits before session start are forbidden
      return [] as TransactionSpec[];
    }

    return tr;
  });
}

// ─── Theme: visual indicator for locked region ──────────────────────────────

const hemingwayTheme = EditorView.baseTheme({
  '&.cm-hemingway .cm-content': {
    /* Subtle left-border on the entire content to indicate mode is active */
    borderLeft: '2px solid var(--interactive-accent, #3b82f6)',
    paddingLeft: '8px',
  },
});

// ─── CSS class toggle ───────────────────────────────────────────────────────

const hemingwayClassPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      const config = update.state.facet(hemingwayConfig);
      if (config.enabled) {
        update.view.dom.classList.add('cm-hemingway');
      } else {
        update.view.dom.classList.remove('cm-hemingway');
      }
    }
  }
);

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Creates the Hemingway mode extension.
 * @param config - Override defaults (enabled: false by default).
 */
export function hemingwayMode(config?: Partial<HemingwayConfig>) {
  const merged = { ...defaultConfig, ...config };
  return (view: EditorView) => [
    hemingwayConfig.of(merged),
    hemingwayPlugin,
    hemingwayFilter(view),
    hemingwayClassPlugin,
    hemingwayTheme,
  ];
}
