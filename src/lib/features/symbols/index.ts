/**
 * Symbol Prettifier feature module — live replacement of ASCII sequences
 * with Unicode symbols as you type.
 * Public API barrel.
 */

// Types
export type { SymbolRule, SymbolPrettifierConfig } from './types';
export { DEFAULT_RULES, DEFAULT_CONFIG, WORD_BOUNDARY } from './types';

// Services
export {
  findMatch, isWordTrigger, sortRules,
  prettifyText, unprettifyText,
} from './services/prettifier';

// Stores
export {
  symbolsEnabled, symbolRules, symbolRulesRaw,
  toggleSymbols, setSymbolsEnabled,
  toggleRule, addRule, removeRule, resetRules,
  getRules, isEnabled,
} from './stores/symbolStore';

// Extensions
export { symbolPrettifierExtension } from './extensions/symbolExtension';
