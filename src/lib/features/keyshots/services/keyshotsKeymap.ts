/**
 * Keyshots keymap — builds CodeMirror key bindings from the active IDE preset.
 *
 * Maps KeyshotsCommandId → editor action function, then resolves
 * the correct key string from the selected preset's mapping.
 */

import type { KeyBinding } from '@codemirror/view';
import type { KeyshotsPreset, KeyshotsCommandId, PresetMapping } from '../types/keyshots';
import { PRESET_MAP } from '../types/keyshots';
import {
  moveLineUp,
  moveLineDown,
  duplicateLineUp,
  duplicateLineDown,
  duplicateSelection,
  insertLineAbove,
  insertLineBelow,
  joinLines,
  sortLines,
  reverseLines,
  shuffleLines,
} from './keyshotsActions';
import {
  transformUppercase,
  transformLowercase,
  transformTitlecase,
  toggleCase,
  toggleSnakecase,
  toggleKebabcase,
  encodeUri,
  trimSelection,
  splitByLines,
  expandLineSelection,
  addCursorUp,
  addCursorDown,
  selectAllInstances,
  insertCodeBlock,
  indent,
  outdent,
} from './keyshotsTransforms';
import type { EditorView } from '@codemirror/view';

// ─── Command → action registry ─────────────────────────────────────────────────

type EditorAction = (view: EditorView) => boolean;

const ACTION_REGISTRY: Record<KeyshotsCommandId, EditorAction> = {
  'move-line-up': moveLineUp,
  'move-line-down': moveLineDown,
  'duplicate-line-up': duplicateLineUp,
  'duplicate-line-down': duplicateLineDown,
  'duplicate-selection': duplicateSelection,
  'insert-line-above': insertLineAbove,
  'insert-line-below': insertLineBelow,
  'join-lines': joinLines,
  'reverse-lines': reverseLines,
  'sort-lines': (v) => sortLines(v, false),
  'shuffle-lines': shuffleLines,
  indent: indent,
  outdent: outdent,
  'add-cursor-up': addCursorUp,
  'add-cursor-down': addCursorDown,
  'select-all-instances': selectAllInstances,
  'expand-line-selection': expandLineSelection,
  'transform-uppercase': transformUppercase,
  'transform-lowercase': transformLowercase,
  'transform-titlecase': transformTitlecase,
  'toggle-case': toggleCase,
  'toggle-snakecase': toggleSnakecase,
  'toggle-kebabcase': toggleKebabcase,
  'encode-uri': encodeUri,
  'trim-selection': trimSelection,
  'split-by-lines': splitByLines,
  'insert-code-block': insertCodeBlock,
};

// ─── Build keymap from preset ──────────────────────────────────────────────────

/** Build a CodeMirror KeyBinding[] from a preset name. */
export function buildKeyshotsKeymap(preset: KeyshotsPreset): KeyBinding[] {
  const mapping = PRESET_MAP[preset];
  if (!mapping) return [];
  return buildKeymapFromMapping(mapping);
}

/** Build a CodeMirror KeyBinding[] from a raw preset mapping. */
export function buildKeymapFromMapping(mapping: PresetMapping): KeyBinding[] {
  const bindings: KeyBinding[] = [];
  for (const [cmdId, key] of Object.entries(mapping)) {
    const action = ACTION_REGISTRY[cmdId as KeyshotsCommandId];
    if (action && key) {
      bindings.push({ key, run: action, preventDefault: true });
    }
  }
  return bindings;
}

/** Get all available command IDs and their descriptions. */
export function getCommandDescriptions(): Array<{ id: KeyshotsCommandId; label: string }> {
  return [
    { id: 'move-line-up', label: 'Move line up' },
    { id: 'move-line-down', label: 'Move line down' },
    { id: 'duplicate-line-up', label: 'Duplicate line up' },
    { id: 'duplicate-line-down', label: 'Duplicate line down' },
    { id: 'duplicate-selection', label: 'Duplicate selection or line' },
    { id: 'insert-line-above', label: 'Insert line above' },
    { id: 'insert-line-below', label: 'Insert line below' },
    { id: 'join-lines', label: 'Join selected lines' },
    { id: 'reverse-lines', label: 'Reverse selected lines' },
    { id: 'sort-lines', label: 'Sort selected lines' },
    { id: 'shuffle-lines', label: 'Shuffle selected lines' },
    { id: 'indent', label: 'Indent' },
    { id: 'outdent', label: 'Outdent' },
    { id: 'add-cursor-up', label: 'Add caret cursor up' },
    { id: 'add-cursor-down', label: 'Add caret cursor down' },
    { id: 'select-all-instances', label: 'Select all word instances' },
    { id: 'expand-line-selection', label: 'Expand line selection' },
    { id: 'transform-uppercase', label: 'Transform to uppercase' },
    { id: 'transform-lowercase', label: 'Transform to lowercase' },
    { id: 'transform-titlecase', label: 'Transform to titlecase' },
    { id: 'toggle-case', label: 'Toggle case' },
    { id: 'toggle-snakecase', label: 'Toggle snake_case' },
    { id: 'toggle-kebabcase', label: 'Toggle kebab-case' },
    { id: 'encode-uri', label: 'Toggle URI encode/decode' },
    { id: 'trim-selection', label: 'Trim selection' },
    { id: 'split-by-lines', label: 'Split selections by lines' },
    { id: 'insert-code-block', label: 'Insert code block' },
  ];
}
