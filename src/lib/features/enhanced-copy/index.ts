/**
 * Enhanced Copy — copy selected text while preserving/cleaning Markdown formatting.
 * Public API barrel.
 */

// Types
export type {
  LinkMode,
  FootnoteMode,
  CalloutMode,
  CopyViewScope,
  RegexRule,
  EnhancedCopyConfig,
} from './types';
export { DEFAULT_ENHANCED_COPY_CONFIG } from './types';

// Services
export {
  transformLinks,
  transformFootnotes,
  transformCallouts,
  removeHighlights,
  convertWikilinks,
  convertTabsToSpaces,
  addStrictLineBreaks,
  applyRegexRules,
  enhancedCopyTransform,
} from './services/enhancedCopyTransform';

// Store
export {
  enhancedCopyConfig,
  updateEnhancedCopyConfig,
  resetEnhancedCopyConfig,
  enhancedCopy,
} from './stores/enhancedCopyStore';
