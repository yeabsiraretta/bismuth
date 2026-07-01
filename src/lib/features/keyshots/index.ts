/**
 * Keyshots feature module — IDE hotkey mappings for the editor.
 * Public API barrel.
 */

// Types
export type {
  KeyshotsPreset,
  KeyshotsCommandId,
  PresetMapping,
  KeyshotsConfig,
} from './types/keyshots';
export {
  PRESET_LABELS,
  PRESET_MAP,
  KEYSHOTS_MAPPINGS,
  VSCODE_MAPPINGS,
  JETBRAINS_MAPPINGS,
  VISUAL_STUDIO_MAPPINGS,
  DEFAULT_KEYSHOTS_CONFIG,
} from './types/keyshots';

// Services — actions
export {
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
} from './services/keyshotsActions';

// Services — transforms
export {
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
} from './services/keyshotsTransforms';

// Services — keymap
export {
  buildKeyshotsKeymap,
  buildKeymapFromMapping,
  getCommandDescriptions,
} from './services/keyshotsKeymap';

// Store
export {
  keyshotsConfig,
  activePreset,
  activePresetLabel,
  getKeyshotsConfig,
  onPresetChange,
  setPreset,
  cyclePreset,
  resetKeyshotsConfig,
  toggleCaseSensitiveSorting,
} from './stores/keyshotsStore';
