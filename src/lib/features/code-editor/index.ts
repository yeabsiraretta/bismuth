/**
 * Code Editor feature module.
 * Provides VSCode-like viewing and editing for code files.
 */

// Types
export type { CodeEditorConfig, LanguageInfo } from './types';
export { DEFAULT_CODE_EXTENSIONS, DEFAULT_CODE_EDITOR_CONFIG } from './types';

// Services
export {
  detectLanguage,
  getExtension,
  isCodeFile,
  isMarkdownFile,
  getLanguageDisplayName,
  getLanguageAccentColor,
  loadCodeEditorConfig,
  saveCodeEditorConfig,
} from './services/languageDetector';

// Store
export {
  codeEditorConfig,
  codeBlockModalOpen,
  activeCodeBlock,
  supportedExtensions,
  updateCodeEditorConfig,
  resetCodeEditorConfig,
  addExtension,
  removeExtension,
  editCodeBlock,
  closeCodeBlockModal,
  saveCodeBlock,
  shouldUseCodeEditor,
} from './stores/codeEditorStore';
