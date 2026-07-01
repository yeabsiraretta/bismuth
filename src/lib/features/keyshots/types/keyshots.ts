/**
 * Keyshots types — IDE preset definitions, command IDs, and preset mappings.
 *
 * Inspired by Obsidian Keyshots plugin: classic IDE hotkey/shortcut commands
 * from VS Code, JetBrains, and Visual Studio, applied in one preset.
 */

// ─── IDE presets ───────────────────────────────────────────────────────────────

export type KeyshotsPreset =
  | 'clear'
  | 'keyshots'
  | 'vscode'
  | 'jetbrains'
  | 'visual-studio';

export const PRESET_LABELS: Record<KeyshotsPreset, string> = {
  clear: 'Clear (no hotkeys)',
  keyshots: 'Keyshots Default',
  vscode: 'Visual Studio Code',
  jetbrains: 'JetBrains IDEs',
  'visual-studio': 'Microsoft Visual Studio',
};

// ─── Command IDs ───────────────────────────────────────────────────────────────

export type KeyshotsCommandId =
  | 'move-line-up'
  | 'move-line-down'
  | 'duplicate-line-up'
  | 'duplicate-line-down'
  | 'duplicate-selection'
  | 'insert-line-above'
  | 'insert-line-below'
  | 'join-lines'
  | 'reverse-lines'
  | 'sort-lines'
  | 'shuffle-lines'
  | 'indent'
  | 'outdent'
  | 'add-cursor-up'
  | 'add-cursor-down'
  | 'select-all-instances'
  | 'expand-line-selection'
  | 'transform-uppercase'
  | 'transform-lowercase'
  | 'transform-titlecase'
  | 'toggle-case'
  | 'toggle-snakecase'
  | 'toggle-kebabcase'
  | 'encode-uri'
  | 'trim-selection'
  | 'split-by-lines'
  | 'insert-code-block';

// ─── Preset mappings ───────────────────────────────────────────────────────────

/** Partial mapping: only commands that have a shortcut in this preset. */
export type PresetMapping = Partial<Record<KeyshotsCommandId, string>>;

export const KEYSHOTS_MAPPINGS: PresetMapping = {
  'move-line-up': 'Alt-ArrowUp',
  'move-line-down': 'Alt-ArrowDown',
  'duplicate-line-up': 'Shift-Alt-ArrowUp',
  'duplicate-line-down': 'Shift-Alt-ArrowDown',
  'duplicate-selection': 'Ctrl-Alt-d',
  'insert-line-above': 'Ctrl-Shift-Enter',
  'insert-line-below': 'Shift-Enter',
  'join-lines': 'Ctrl-Shift-j',
  'reverse-lines': 'Alt-r',
  'sort-lines': 'Ctrl-Shift-s',
  'shuffle-lines': 'Ctrl-Shift-Alt-s',
  'indent': 'Alt-]',
  'outdent': 'Alt-[',
  'add-cursor-up': 'Ctrl-Alt-ArrowUp',
  'add-cursor-down': 'Ctrl-Alt-ArrowDown',
  'select-all-instances': 'Ctrl-Shift-l',
  'expand-line-selection': 'Alt-e',
  'transform-uppercase': 'Alt-u',
  'transform-lowercase': 'Alt-l',
  'transform-titlecase': 'Alt-c',
  'toggle-case': 'Ctrl-Shift-u',
  'toggle-snakecase': 'Shift-Alt--',
  'toggle-kebabcase': 'Alt--',
  'encode-uri': 'Ctrl-Alt-u',
  'trim-selection': 'Alt-t',
  'split-by-lines': 'Ctrl-Alt-l',
  'insert-code-block': 'Ctrl-Shift-`',
};

export const VSCODE_MAPPINGS: PresetMapping = {
  'move-line-up': 'Alt-ArrowUp',
  'move-line-down': 'Alt-ArrowDown',
  'duplicate-line-up': 'Shift-Alt-ArrowUp',
  'duplicate-line-down': 'Shift-Alt-ArrowDown',
  'insert-line-above': 'Ctrl-Shift-Enter',
  'insert-line-below': 'Ctrl-Enter',
  'join-lines': 'Ctrl-j',
  'add-cursor-up': 'Ctrl-Alt-ArrowUp',
  'add-cursor-down': 'Ctrl-Alt-ArrowDown',
  'select-all-instances': 'Ctrl-Shift-l',
  'expand-line-selection': 'Ctrl-l',
  'transform-uppercase': 'Ctrl-Shift-u',
  'transform-lowercase': 'Ctrl-Shift-l',
};

export const JETBRAINS_MAPPINGS: PresetMapping = {
  'move-line-up': 'Shift-Alt-ArrowUp',
  'move-line-down': 'Shift-Alt-ArrowDown',
  'duplicate-selection': 'Ctrl-d',
  'insert-line-above': 'Ctrl-Alt-Enter',
  'insert-line-below': 'Shift-Enter',
  'join-lines': 'Ctrl-Shift-j',
  'select-all-instances': 'Ctrl-Shift-Alt-j',
  'expand-line-selection': 'Ctrl-w',
  'toggle-case': 'Ctrl-Shift-u',
};

export const VISUAL_STUDIO_MAPPINGS: PresetMapping = {
  'move-line-up': 'Alt-ArrowUp',
  'move-line-down': 'Alt-ArrowDown',
  'duplicate-selection': 'Ctrl-d',
  'insert-line-above': 'Ctrl-Enter',
  'insert-line-below': 'Shift-Enter',
  'add-cursor-up': 'Shift-Alt-ArrowUp',
  'add-cursor-down': 'Shift-Alt-ArrowDown',
  'select-all-instances': 'Shift-Alt-;',
  'expand-line-selection': 'Shift-Alt-=',
  'transform-lowercase': 'Ctrl-Shift-u',
};

export const PRESET_MAP: Record<KeyshotsPreset, PresetMapping> = {
  clear: {},
  keyshots: KEYSHOTS_MAPPINGS,
  vscode: VSCODE_MAPPINGS,
  jetbrains: JETBRAINS_MAPPINGS,
  'visual-studio': VISUAL_STUDIO_MAPPINGS,
};

// ─── Config ────────────────────────────────────────────────────────────────────

export interface KeyshotsConfig {
  preset: KeyshotsPreset;
  caseSensitiveSorting: boolean;
}

export const DEFAULT_KEYSHOTS_CONFIG: KeyshotsConfig = {
  preset: 'clear',
  caseSensitiveSorting: false,
};
