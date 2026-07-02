/**
 * Editor base theme builder — configurable theme that maps
 * editor settings to CodeMirror CSS.
 */

import { EditorView } from '@codemirror/view';

export interface EditorThemeSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  showLineNumbers: boolean;
}

/** Build a CodeMirror theme extension from editor settings. */
export function buildEditorTheme(es: EditorThemeSettings) {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: `${es.fontSize}px`,
      lineHeight: `${es.lineHeight}`,
      fontFamily: `'${es.fontFamily}', var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)`,
    },
    '.cm-content': {
      padding: '16px 20px',
      color: 'var(--text-normal)',
      caretColor: 'var(--interactive-accent)',
    },
    '.cm-gutters': {
      background: 'var(--background-secondary)',
      borderRight: '1px solid var(--border-color)',
      color: 'var(--text-faint)',
    },
    '.cm-activeLineGutter': {
      background: 'var(--background-modifier-hover)',
    },
    '.cm-activeLine': {
      background: 'var(--background-modifier-hover)',
    },
    '.cm-selectionBackground': {
      background: 'var(--text-selection) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      background: 'var(--text-selection) !important',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--interactive-accent)',
      borderLeftWidth: '2px',
    },
    '.tok-heading': {
      textDecoration: 'none',
    },
    ...(es.showLineNumbers
      ? {}
      : {
          '.cm-lineNumbers .cm-gutterElement': {
            color: 'transparent',
            userSelect: 'none',
            minWidth: '32px',
          },
        }),
  });
}
