/**
 * Code Styler feature — barrel exports.
 */

// Types
export type {
  CodeBlockParams,
  HighlightGroup,
  LanguageIcon,
  AltHighlight,
  CodeStylerTheme,
  CodeStylerConfig,
} from './types/codeStyler';

export { DEFAULT_THEME, DEFAULT_CODE_STYLER_CONFIG } from './types/codeStyler';

// Services
export {
  parseCodeBlockParams,
  resolveHighlightSpec,
  resolveHighlightGroups,
  isLanguageExcluded,
} from './services/codeBlockParser';

export {
  getLanguageInfo,
  getLanguageColor,
  getLanguageName,
} from './services/languageIcons';

export { CodeBlockWidget } from './services/codeBlockWidget';
export { codeStylerTheme } from './services/codeStylerTheme';
