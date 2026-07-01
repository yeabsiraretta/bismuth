/**
 * Metadata Extractor feature module — public API barrel.
 * Exports vault metadata as JSON for third-party app consumption.
 */

// Types
export type {
  TagToFile,
  NoteMetadataExport,
  MdLink,
  MdBacklink,
  MdHeading,
  NonMdExport,
  FolderEntry,
  FileEntry,
  CanvasEntry,
  ExtractorConfig,
} from './types';
export { DEFAULT_EXTRACTOR_CONFIG } from './types';

// Services
export {
  extractTags,
  extractHeadings,
  extractLinks,
  extractAliases,
  buildTagExport,
  buildMetadataExport,
  buildBacklinksMap,
  buildNonMdExport,
  buildCanvasExport,
} from './services/extractorService';

// Stores
export {
  extractorConfig,
  extractorEnabled,
  updateExtractorConfig,
  resetExtractorConfig,
  getExtractorConfig,
  lastExportTime,
  isExporting,
  startSchedule,
  stopSchedule,
  runAllExports,
  runTagExport,
  runMetadataExport,
} from './stores/extractorStore';
