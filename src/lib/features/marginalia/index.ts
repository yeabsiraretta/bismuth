/**
 * Cornell Marginalia feature — margin notes, active recall, flashcards.
 * Public API barrel.
 */

// Types
export type {
  PrefixConfig,
  MarginAlignment,
  MarginDirection,
  MarginNote,
  ExplorerTab,
  ExplorerGrouping,
  ExplorerState,
  FlashcardEntry,
  MarginaliaSettings,
} from './types';

export {
  DEFAULT_PREFIXES,
  DEFAULT_MARGINALIA_SETTINGS,
  MARGIN_ANY_RE,
  MARGIN_IMG_RE,
  BLUR_SUFFIX_RE,
} from './types';

// Services — parser
export {
  resolvePrefix,
  parseImage,
  isBlurNote,
  stripBlurSuffix,
  parseMarginNotes,
  stripMarginNotes,
  lineMainText,
  insertMarginNote,
  wrapWithMarginNote,
  wrapCornellBlock,
  parseMultipleFiles,
  groupByColor,
  groupByFile,
} from './services/marginParser';
export type { FileMarginNotes } from './services/marginParser';

// Services — flashcards
export {
  extractFlashcards,
  formatFlashcardsSection,
  formatAnkiExport,
  injectFlashcards,
  flashcardStats,
} from './services/flashcardGen';

// Stores
export {
  marginaliaSettings,
  currentNotes,
  vaultNotes,
  activeRecall,
  explorerState,
  filteredNotes,
  groupedNotes,
  noteCount,
  blurCount,
  parseCurrentNote,
  scanVaultNotes,
  toggleActiveRecall,
  setExplorerTab,
  setExplorerGrouping,
  setExplorerSearch,
  toggleGroup,
  setAlignment,
  setMarginWidth,
  setFontSize,
  setFontFamily,
  toggleReadingView,
  updatePrefix,
  addPrefix,
  removePrefix,
  setDefaultDirection,
  setLastCaptureDestination,
} from './stores/marginStore';

// Components
export { default as MarginaliaExplorer } from './components/MarginaliaExplorer.svelte';
export { default as MarginRenderer } from './components/MarginRenderer.svelte';
export { default as OmniCapture } from './components/OmniCapture.svelte';
