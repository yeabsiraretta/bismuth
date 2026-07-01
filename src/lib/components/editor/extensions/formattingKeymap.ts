/**
 * Markdown formatting keyboard shortcuts for the editor.
 * Provides Obsidian-compatible keybindings that wrap selected text
 * with formatting syntax or insert formatting at cursor.
 *
 * Shortcuts:
 *   Mod-b       → Bold
 *   Mod-i       → Italic
 *   Mod-u       → Underline (<u>)
 *   Mod-Shift-s → Strikethrough
 *   Mod-e       → Inline code
 *   Mod-k       → Link ([[wikilink]])
 *   Mod-Shift-h → Highlight (==)
 *   Mod-1..4    → Heading levels 1-4
 *   Tab         → Indent list item (2 spaces) or insert 2 spaces
 *   Shift-Tab   → Dedent list item
 */

import { type KeyBinding } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

const LIST_RE = /^(\s*)([-*+]|\d+\.)\s/;
const INDENT = '  '; // 2-space indent for markdown lists

function wrapSelection(view: EditorView, prefix: string, suffix: string): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const selected = state.sliceDoc(range.from, range.to);
    // If already wrapped, unwrap
    const before = state.sliceDoc(Math.max(0, range.from - prefix.length), range.from);
    const after = state.sliceDoc(range.to, Math.min(state.doc.length, range.to + suffix.length));
    if (before === prefix && after === suffix) {
      return {
        changes: [
          { from: range.from - prefix.length, to: range.from, insert: '' },
          { from: range.to, to: range.to + suffix.length, insert: '' },
        ],
        range: EditorSelection.range(range.from - prefix.length, range.to - prefix.length),
      };
    }
    // Wrap
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    return {
      changes: { from: range.from, to: range.to, insert: replacement },
      range: EditorSelection.range(
        range.from + prefix.length,
        range.from + prefix.length + (selected || 'text').length,
      ),
    };
  });
  view.dispatch(changes, { scrollIntoView: true, userEvent: 'input.format' });
  return true;
}

function setHeading(view: EditorView, level: number): boolean {
  const { state } = view;
  const prefix = '#'.repeat(level) + ' ';
  const changes = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.from);
    const existingMatch = line.text.match(/^(#{1,6})\s/);
    if (existingMatch) {
      const oldPrefix = existingMatch[0];
      if (existingMatch[1].length === level) {
        return {
          changes: { from: line.from, to: line.from + oldPrefix.length, insert: '' },
          range: EditorSelection.cursor(range.from - oldPrefix.length),
        };
      }
      return {
        changes: { from: line.from, to: line.from + oldPrefix.length, insert: prefix },
        range: EditorSelection.cursor(range.from + prefix.length - oldPrefix.length),
      };
    }
    return {
      changes: { from: line.from, to: line.from, insert: prefix },
      range: EditorSelection.cursor(range.from + prefix.length),
    };
  });
  view.dispatch(changes, { scrollIntoView: true, userEvent: 'input.format' });
  return true;
}

/**
 * Tab on a list line adds 2-space indent. Elsewhere inserts 2 spaces.
 * Never inserts a raw tab character — markdown uses spaces for structure.
 */
function indentListOrInsert(view: EditorView): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.from);
    if (LIST_RE.test(line.text)) {
      // Indent the whole line by prepending 2 spaces
      return {
        changes: { from: line.from, to: line.from, insert: INDENT },
        range: EditorSelection.cursor(range.from + INDENT.length),
      };
    }
    // Non-list: insert 2 spaces at cursor
    return {
      changes: { from: range.from, to: range.to, insert: INDENT },
      range: EditorSelection.cursor(range.from + INDENT.length),
    };
  });
  view.dispatch(changes, { scrollIntoView: true, userEvent: 'input' });
  return true;
}

/**
 * Shift-Tab on a list line removes up to 2 leading spaces. Elsewhere no-op.
 */
function dedentList(view: EditorView): boolean {
  const { state } = view;
  let handled = false;
  const changes = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.from);
    if (!LIST_RE.test(line.text)) {
      return { changes: [], range };
    }
    // Remove up to 2 leading spaces
    const strip = line.text.startsWith('  ') ? 2 : line.text.startsWith(' ') ? 1 : 0;
    if (strip === 0) return { changes: [], range };
    handled = true;
    return {
      changes: { from: line.from, to: line.from + strip, insert: '' },
      range: EditorSelection.cursor(Math.max(line.from, range.from - strip)),
    };
  });
  if (!handled) return false;
  view.dispatch(changes, { scrollIntoView: true, userEvent: 'input' });
  return true;
}

export const formattingKeymap: KeyBinding[] = [
  { key: 'Mod-b', run: (v) => wrapSelection(v, '**', '**') },
  { key: 'Mod-i', run: (v) => wrapSelection(v, '*', '*') },
  { key: 'Mod-u', run: (v) => wrapSelection(v, '<u>', '</u>') },
  { key: 'Mod-Shift-s', run: (v) => wrapSelection(v, '~~', '~~') },
  { key: 'Mod-e', run: (v) => wrapSelection(v, '`', '`') },
  { key: 'Mod-k', run: (v) => wrapSelection(v, '[[', ']]') },
  { key: 'Mod-Shift-h', run: (v) => wrapSelection(v, '==', '==') },
  { key: 'Mod-1', run: (v) => setHeading(v, 1) },
  { key: 'Mod-2', run: (v) => setHeading(v, 2) },
  { key: 'Mod-3', run: (v) => setHeading(v, 3) },
  { key: 'Mod-4', run: (v) => setHeading(v, 4) },
  { key: 'Tab', run: indentListOrInsert },
  { key: 'Shift-Tab', run: dedentList },
];
