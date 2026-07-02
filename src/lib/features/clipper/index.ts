/**
 * Web Clipper (ReadItLater) feature module.
 * Clips web content from clipboard URLs into markdown notes.
 */

// Types
export type {
  ContentType,
  ClipperConfig,
  ContentTypeConfig,
  ClippedItem,
  ParsedContent,
  TemplateContext,
} from './types';
export { DEFAULT_TEMPLATES } from './types';

// Services
export {
  detectContentType,
  isUrl,
  splitBatch,
  generateVideoEmbed,
  buildBaseVariables,
  formatDate,
} from './services/contentDetector';
export {
  renderTemplate,
  getTemplates,
  sanitizeFilename,
  resolveInboxDir,
  loadClipperConfig,
  saveClipperConfig,
} from './services/templateEngine';

// Store
export {
  clippedItems,
  clipperConfig,
  clipperStats,
  isClipping,
  clipFromClipboard,
  clipBatchFromClipboard,
  clipContent,
  insertAtCursor,
  updateConfig,
  clearHistory,
} from './stores/clipperStore';
