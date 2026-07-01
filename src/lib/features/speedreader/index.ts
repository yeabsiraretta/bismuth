/**
 * Speed Reader feature module — RSVP reading, tokenization, focus mode.
 * Public API barrel.
 */

// Types
export type { WordToken, ReaderState, SpeedReaderConfig } from './types';
export { DEFAULT_SPEED_READER_CONFIG, calculateORP, calculateDelay } from './types';

// Stores
export {
  speedReaderStore,
  startSpeedReader,
  stopSpeedReader,

  setWpm,
  adjustWpm,
  toggleFocusMode,
} from './stores/speedReader';

// Services
export { tokenize, estimateReadingTime } from './services/tokenizer';

// Components
export { default as SpeedReader } from './components/SpeedReader.svelte';
export { default as SpeedReaderPanel } from './components/SpeedReaderPanel.svelte';
