/**
 * Citations feature module — Zotero/BibTeX integration for academic references.
 * Public API barrel.
 */

// Types
export type {
  CslEntry,
  CslEntryType,
  CslName,
  CslDate,
  CitationConfig,
  CitationLibrary,
  BibFormat,
  TemplateVariables,
} from './types/citation';
export { DEFAULT_CITATION_CONFIG } from './types/citation';

// Services — parsers
export { parseBibtex } from './services/bibtexParser';
export { parseCslJson } from './services/cslJsonParser';

// Services — pretty BibTeX rendering
export { renderBibtexBlock, BIBTEX_STYLES } from './services/bibtexRenderer';

// Services — template
export { renderTemplate, renderNoteTitle, extractVariables, buildSearchText } from './services/templateRenderer';

// Stores
export {
  citationConfig,
  citationLibrary,
  citationLoading,
  citationError,
  citationSearchQuery,
  entryCount,
  filteredEntries,
  loadLibrary,
  reloadLibrary,
  updateConfig,
  findEntry,
  getLiteratureNotePath,
  openLiteratureNote,
  getMarkdownCitation,
  getLiteratureNoteLink,
  getEntryContent,
  setSearchQuery,
} from './stores/citationStore';

// Components
export { default as CitationPanel } from './components/CitationPanel.svelte';
