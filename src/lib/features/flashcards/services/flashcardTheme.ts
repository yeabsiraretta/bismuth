/**
 * CodeMirror theme for flashcard widgets in live preview.
 */

import { EditorView } from '@codemirror/view';

export const flashcardWidgetTheme = EditorView.theme({
  // ── Card container ────────────────────────────────────────────────────────
  '.cm-fc-card': {
    display: 'block',
    margin: '4px 0',
    padding: '10px 14px',
    borderRadius: 'var(--radius-m, 8px)',
    border: '1px solid var(--border-color, #e5e7eb)',
    background: 'var(--background-primary, #fff)',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, border-color 0.15s',
    fontFamily: 'var(--font-text, var(--font-sans, sans-serif))',
    fontSize: 'var(--font-smaller, 0.9em)',
    lineHeight: '1.5',
  },
  '.cm-fc-card:hover': {
    borderColor: 'var(--interactive-accent, #6366f1)',
    boxShadow: '0 1px 4px rgba(99, 102, 241, 0.12)',
  },
  '.cm-fc-card:focus-visible': {
    outline: '2px solid var(--interactive-accent, #6366f1)',
    outlineOffset: '1px',
  },
  // ── Badge ─────────────────────────────────────────────────────────────────
  '.cm-fc-badge': {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '1px 8px',
    borderRadius: '4px',
    marginBottom: '6px',
    background: 'rgba(99, 102, 241, 0.1)',
    color: 'rgba(99, 102, 241, 0.9)',
  },
  '.cm-fc-reversed .cm-fc-badge': {
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#b45309',
  },
  '.cm-fc-badge-cloze': {
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#b45309',
  },
  // ── Front section ─────────────────────────────────────────────────────────
  '.cm-fc-front': {
    fontWeight: '500',
    color: 'var(--text-normal, #1f2937)',
    wordBreak: 'break-word',
  },
  // ── Separator ─────────────────────────────────────────────────────────────
  '.cm-fc-sep': {
    height: '1px',
    background: 'var(--border-color, #e5e7eb)',
    margin: '8px 0',
  },
  // ── Back section ──────────────────────────────────────────────────────────
  '.cm-fc-back': {
    color: 'var(--text-muted, #6b7280)',
    wordBreak: 'break-word',
  },
  // ── Cloze content ─────────────────────────────────────────────────────────
  '.cm-fc-cloze-content': {
    color: 'var(--text-normal, #1f2937)',
    wordBreak: 'break-word',
    lineHeight: '1.6',
  },
  '.cm-fc-cloze-mark': {
    background: 'rgba(245, 158, 11, 0.2)',
    borderBottom: '2px dashed rgba(245, 158, 11, 0.6)',
    borderRadius: '2px',
    padding: '0 3px',
    fontWeight: '500',
  },
  // ── Language border accents ───────────────────────────────────────────────
  '.cm-fc-basic': {
    borderLeft: '3px solid rgba(99, 102, 241, 0.5)',
  },
  '.cm-fc-reversed': {
    borderLeft: '3px solid rgba(245, 158, 11, 0.5)',
  },
  '.cm-fc-cloze': {
    borderLeft: '3px solid rgba(245, 158, 11, 0.5)',
  },
});
