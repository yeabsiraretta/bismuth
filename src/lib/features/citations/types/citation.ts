/**
 * Citation system types.
 *
 * Normalized representation of bibliographic entries from BibTeX/BibLaTeX
 * and CSL-JSON sources. All parsers normalize into the CslEntry format.
 */

// ─── Core entry ──────────────────────────────────────────────────────────────

/** CSL entry type enum (subset of CSL spec covering common academic types). */
export type CslEntryType =
  | 'article-journal'
  | 'book'
  | 'chapter'
  | 'paper-conference'
  | 'thesis'
  | 'report'
  | 'webpage'
  | 'dataset'
  | 'software'
  | 'manuscript'
  | 'patent'
  | 'article'
  | 'entry-encyclopedia'
  | 'motion_picture'
  | 'speech'
  | 'post-weblog';

/** A single person (author, editor, etc.). */
export interface CslName {
  family?: string;
  given?: string;
  literal?: string;
}

/** A CSL date (partial). */
export interface CslDate {
  'date-parts'?: number[][];
  raw?: string;
  literal?: string;
}

/**
 * Normalized bibliographic entry.
 * Fields follow the CSL-JSON spec where possible.
 * Additional Zotero-specific fields are in the `extra` map.
 */
export interface CslEntry {
  /** Unique citation key (e.g. "smith2020" from BibTeX or "id" from CSL-JSON). */
  id: string;
  type: CslEntryType | string;

  // ─── Core metadata ───
  title?: string;
  'title-short'?: string;
  author?: CslName[];
  editor?: CslName[];
  issued?: CslDate;
  accessed?: CslDate;

  // ─── Publication info ───
  'container-title'?: string;
  'collection-title'?: string;
  publisher?: string;
  'publisher-place'?: string;
  'event-place'?: string;
  volume?: string;
  issue?: string;
  page?: string;
  edition?: string;
  language?: string;

  // ─── Identifiers ───
  DOI?: string;
  ISBN?: string;
  ISSN?: string;
  PMID?: string;
  PMCID?: string;
  URL?: string;
  eprint?: string;
  eprinttype?: string;

  // ─── Content ───
  abstract?: string;
  keyword?: string;
  note?: string;

  // ─── Zotero-specific ───
  /** Zotero select URI (zotero://select/...) */
  zoteroSelectURI?: string;
  /** Paths to attached files (PDFs, etc.) */
  attachments?: string[];

  // ─── Catch-all ───
  [key: string]: unknown;
}

// ─── Library & config ────────────────────────────────────────────────────────

export type BibFormat = 'bibtex' | 'csl-json';

export interface CitationConfig {
  /** Absolute path to the .bib or .json export file. */
  exportPath: string;
  /** Detected or user-specified format. */
  format: BibFormat;
  /** Folder for literature notes (relative to vault root). */
  literatureNoteFolder: string;
  /** Template for the literature note file title. */
  titleTemplate: string;
  /** Template for the literature note body content. */
  contentTemplate: string;
  /** Template for Pandoc-style inline citations. */
  markdownCitationTemplate: string;
}

export const DEFAULT_CITATION_CONFIG: CitationConfig = {
  exportPath: '',
  format: 'bibtex',
  literatureNoteFolder: 'references',
  titleTemplate: '@{{citekey}}',
  contentTemplate: [
    '---',
    'title: "{{title}}"',
    'authors: {{authorString}}',
    'year: {{year}}',
    'doi: {{DOI}}',
    'citekey: {{citekey}}',
    'tags: [reference]',
    '---',
    '',
    '# {{title}}',
    '',
    '**Authors:** {{authorString}}',
    '**Year:** {{year}}',
    '**Journal:** {{containerTitle}}',
    '**DOI:** {{DOI}}',
    '**URL:** {{URL}}',
    '',
    '## Abstract',
    '',
    '{{abstract}}',
    '',
    '## Notes',
    '',
    '',
  ].join('\n'),
  markdownCitationTemplate: '[@{{citekey}}]',
};

/** Loaded citation library state. */
export interface CitationLibrary {
  entries: CslEntry[];
  format: BibFormat;
  loadedAt: number;
  filePath: string;
  error?: string;
}

// ─── Template variables ──────────────────────────────────────────────────────

/** All template variables available for rendering. */
export interface TemplateVariables {
  citekey: string;
  title: string;
  titleShort: string;
  authorString: string;
  authors: string[];
  year: string;
  abstract: string;
  containerTitle: string;
  publisher: string;
  publisherPlace: string;
  eventPlace: string;
  page: string;
  volume: string;
  issue: string;
  DOI: string;
  URL: string;
  ISBN: string;
  eprint: string;
  eprinttype: string;
  zoteroSelectURI: string;
  keywords: string;
  type: string;
  [key: string]: string | string[];
}
