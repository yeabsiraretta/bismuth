/**
 * Vim mode feature module — vimrc file support, CodeMirror vim extension,
 * and vim mode status tracking.
 */

// Stores
export { vimCurrentMode, vimModeLabel } from './stores/vimStore';
export type { VimMode } from './stores/vimStore';

// Extensions
export {
  vimCompartment,
  buildVimExtension,
  reconfigureVim,
  loadAndApplyVimrc,
} from './extensions/vimExtension';

// Services — Parser
export { parseVimrc, expandLeader, extractLeader, extractSetOptions } from './services/vimrcParser';
export type {
  VimrcCommand,
  VimrcCommandType,
  VimrcParseResult,
  VimSetOption,
} from './services/vimrcParser';

// Services — Loader
export {
  loadVimrc,
  applyVimrcCommands,
  getLastParseResult,
  clearVimrcCache,
} from './services/vimrcLoader';
export type { VimApi } from './services/vimrcLoader';
