/**
 * CodeMirror theme for Code Styler widgets.
 * Provides CSS for the styled code block widget rendered in live preview.
 */

import { EditorView } from '@codemirror/view';

export const codeStylerTheme = EditorView.theme({
  // ── Code block container ──────────────────────────────────────────────────
  '.cm-code-styled': {
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    fontSize: '0.88em',
    lineHeight: '1.55',
    margin: '6px 0',
    border: '1px solid var(--border-color, #e5e7eb)',
    overflow: 'hidden',
  },
  // ── Header ────────────────────────────────────────────────────────────────
  '.cm-code-styled-header': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    fontSize: '0.85em',
    userSelect: 'none',
  },
  '.cm-code-styled-header:hover': {
    filter: 'brightness(0.97)',
  },
  '.cm-code-styled-lang-dot': {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: '0',
  },
  '.cm-code-styled-lang-tag': {
    padding: '1px 8px',
    borderRadius: '4px',
    fontSize: '0.85em',
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  '.cm-code-styled-title': {
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '.cm-code-styled-fold': {
    fontSize: '10px',
    opacity: '0.5',
    transition: 'opacity 0.15s',
    flexShrink: '0',
  },
  '.cm-code-styled-header:hover .cm-code-styled-fold': {
    opacity: '1',
  },
  '.cm-code-styled-copy': {
    padding: '2px 10px',
    fontSize: '0.8em',
    fontWeight: '500',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '4px',
    background: 'var(--background-primary, #fff)',
    color: 'var(--text-muted, #6b7280)',
    cursor: 'pointer',
    transition: 'all 0.12s',
    flexShrink: '0',
    fontFamily: 'var(--font-sans, system-ui)',
  },
  '.cm-code-styled-copy:hover': {
    background: 'var(--background-modifier-hover)',
    color: 'var(--text-normal)',
  },
  // ── Body / code table ─────────────────────────────────────────────────────
  '.cm-code-styled-body': {
    overflowX: 'auto',
    padding: '0',
  },
  '.cm-code-styled-table': {
    borderCollapse: 'collapse',
    width: '100%',
    tableLayout: 'fixed',
  },
  '.cm-code-styled-row': {
    transition: 'background 0.1s',
  },
  // ── Line numbers ──────────────────────────────────────────────────────────
  '.cm-code-styled-ln': {
    width: '3.5em',
    minWidth: '3.5em',
    maxWidth: '3.5em',
    padding: '0 8px 0 0',
    textAlign: 'right',
    userSelect: 'none',
    fontSize: '0.85em',
    verticalAlign: 'top',
    lineHeight: 'inherit',
    borderRight: '1px solid var(--border-color, #e5e7eb)',
    opacity: '0.7',
  },
  // ── Code content ──────────────────────────────────────────────────────────
  '.cm-code-styled-code': {
    padding: '0 16px',
    whiteSpace: 'pre',
    wordBreak: 'break-all',
    verticalAlign: 'top',
    lineHeight: 'inherit',
  },
  '.cm-code-styled-code code': {
    fontFamily: 'inherit',
    fontSize: 'inherit',
    background: 'none',
    padding: '0',
    border: 'none',
  },
});
