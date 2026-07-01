/**
 * Paste URL into Selection — Notion-style link creation.
 *
 * When text is selected and a URL is pasted (Cmd/Ctrl+V), wraps the
 * selection as a markdown link: [selected text](pasted URL)
 *
 * Also works in reverse: when a URL is selected and plain text is pasted,
 * wraps as [pasted text](selected URL).
 *
 * Inspired by the Obsidian "Paste URL into selection" plugin.
 */

import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

const URL_RE = /^https?:\/\/[^\s<>[\]]+$/i;

/** Check if a string looks like a URL */
export function isUrl(text: string): boolean {
  return URL_RE.test(text.trim());
}

/**
 * Given selected text and clipboard text, determine the markdown link
 * to insert. Returns null if neither combination applies.
 */
export function buildMarkdownLink(
  selected: string,
  clipboard: string,
): { replacement: string; cursorOffset: number } | null {
  const clipTrimmed = clipboard.trim();
  const selTrimmed = selected.trim();

  // Case 1: Text is selected, pasting a URL → [text](url)
  if (selected && !isUrl(selTrimmed) && isUrl(clipTrimmed)) {
    const replacement = `[${selected}](${clipTrimmed})`;
    // Place cursor after the closing paren
    return { replacement, cursorOffset: replacement.length };
  }

  // Case 2: URL is selected, pasting plain text → [text](url)
  if (selected && isUrl(selTrimmed) && !isUrl(clipTrimmed) && clipTrimmed) {
    const replacement = `[${clipTrimmed}](${selTrimmed})`;
    // Select the text portion for easy editing
    return { replacement, cursorOffset: replacement.length };
  }

  return null;
}

/**
 * CodeMirror extension: intercepts paste events to create markdown links
 * when text is selected and a URL is pasted (or vice versa).
 */
export const pasteUrlIntoSelection = EditorView.domEventHandlers({
  paste(event: ClipboardEvent, view: EditorView): boolean {
    const { state } = view;
    const { main } = state.selection;

    // Only act when there is a selection
    if (main.from === main.to) return false;

    const clipboard = event.clipboardData?.getData('text/plain');
    if (!clipboard) return false;

    const selected = state.sliceDoc(main.from, main.to);
    const result = buildMarkdownLink(selected, clipboard);
    if (!result) return false;

    // Prevent the default paste
    event.preventDefault();

    view.dispatch({
      changes: { from: main.from, to: main.to, insert: result.replacement },
      selection: EditorSelection.cursor(main.from + result.cursorOffset),
      userEvent: 'input.paste.url',
    });

    return true;
  },
});

/**
 * Reverse operation (for command palette): reads clipboard and wraps
 * the selected URL with the clipboard text, or vice versa.
 * Returns true if the operation was performed.
 */
export async function pasteTextIntoSelectedUrl(view: EditorView): Promise<boolean> {
  const { state } = view;
  const { main } = state.selection;
  if (main.from === main.to) return false;

  let clipboard: string;
  try {
    clipboard = await navigator.clipboard.readText();
  } catch {
    return false;
  }

  if (!clipboard) return false;

  const selected = state.sliceDoc(main.from, main.to);
  const result = buildMarkdownLink(selected, clipboard);
  if (!result) return false;

  view.dispatch({
    changes: { from: main.from, to: main.to, insert: result.replacement },
    selection: EditorSelection.cursor(main.from + result.cursorOffset),
    userEvent: 'input.paste.url',
  });
  view.focus();
  return true;
}
