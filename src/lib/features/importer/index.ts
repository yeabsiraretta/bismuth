/**
 * Importer feature module — import notes from external apps and file formats.
 * Public API barrel.
 */

// Types
export type {
  ImportSource,
  ImportSourceInfo,
  ConvertedNote,
  ImportOptions,
  ImportResult,
  ImportProgress,
} from './types/importer';

export { IMPORT_SOURCES, DEFAULT_IMPORT_OPTIONS } from './types/importer';

// Stores
export {
  isImporting,
  importProgress,
  importOptions,
  lastImportResult,
  importHistory,
  importerPanelOpen,
  progressLabel,
  selectSource,
  updateOption,
  executeImport,
  toggleImporterPanel,
  resetImporter,
} from './stores/importer';

// Services
export { runImport } from './services/importerService';

// Converters (for direct use / testing)
export { htmlToMarkdown, convertHtmlFile } from './services/converters/htmlToMd';
export {
  parseCsv,
  convertCsvToNotes,
  getHeaders,
  detectDelimiter,
} from './services/converters/csvToMd';
export {
  convertBearNotes,
  convertGoogleKeepNotes,
  convertRoamNotes,
  convertEvernoteEnex,
  convertJsonNotes,
} from './services/converters/jsonToMd';

// Components
export { default as ImporterPanel } from './components/ImporterPanel.svelte';
