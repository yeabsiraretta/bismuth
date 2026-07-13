import { EditorView } from '@codemirror/view';

import type { EditorConfig } from '@/hubs/editor/types/editor-config';

export function buildEditorTheme(settings: EditorConfig) {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: `${settings.fontSize}px`,
      lineHeight: `${settings.lineHeight}`,
      fontFamily: `'${settings.fontFamily}', var(--font-sans)`,
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
    '.cm-content': {
      padding: '16px 20px',
      color: 'var(--color-text)',
      caretColor: 'var(--color-accent)',
      ...(settings.readableLineLength
        ? { maxWidth: `${settings.readableLineLengthWidth}ch`, margin: '0 auto' }
        : {}),
    },
    '.cm-gutters': {
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      color: 'var(--color-text-subtle)',
    },
    ...(settings.highlightActiveLine
      ? {
          '.cm-activeLineGutter': { background: 'var(--color-surface-hover)' },
          '.cm-activeLine': { background: 'var(--color-surface-hover)' },
        }
      : {
          '.cm-activeLineGutter': { background: 'transparent' },
          '.cm-activeLine': { background: 'transparent' },
        }),
    '.cm-selectionBackground': {
      background: 'oklch(from var(--color-accent) l c h / 0.2) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      background: 'oklch(from var(--color-accent) l c h / 0.3) !important',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--color-accent)',
      borderLeftWidth: '2px',
    },
    '.cm-line': {
      padding: '0 2px',
    },
    '.tok-heading': {
      textDecoration: 'none',
      fontWeight: 'bold',
      color: 'var(--color-text)',
    },
    '.tok-link': {
      color: 'var(--color-accent)',
      textDecoration: 'underline',
    },
    '.tok-emphasis': {
      fontStyle: 'italic',
    },
    '.tok-strong': {
      fontWeight: 'bold',
    },
    '.tok-keyword': {
      color: 'var(--color-primary)',
    },
    '.tok-string': {
      color: 'var(--color-success)',
    },
    '.tok-comment': {
      color: 'var(--color-text-subtle)',
      fontStyle: 'italic',
    },
    '.cm-panels': {
      background: 'var(--color-surface)',
      color: 'var(--color-text)',
      borderTop: '1px solid var(--color-border)',
    },
    '.cm-panels button': {
      background: 'var(--color-surface-hover)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-s)',
    },
    '.cm-panels input, .cm-panels button:focus': {
      outline: '1px solid var(--color-accent)',
    },
    '.cm-searchMatch': {
      background: 'oklch(from var(--color-warning) l c h / 0.3)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      background: 'oklch(from var(--color-accent) l c h / 0.4)',
    },
    '.cm-tooltip': {
      background: 'var(--color-surface)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-s)',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      background: 'var(--color-surface-hover)',
      color: 'var(--color-text)',
    },
    '.cm-foldPlaceholder': {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text-muted)',
    },
  });
}
