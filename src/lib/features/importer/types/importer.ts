/**
 * Importer types — defines import sources, options, and results.
 */

/** Supported import source formats. */
export type ImportSource =
  | 'markdown'
  | 'html'
  | 'csv'
  | 'evernote'    // .enex XML
  | 'bear'        // Bear JSON / Markdown export
  | 'google-keep' // Google Takeout JSON
  | 'notion'      // Notion Markdown/CSV export
  | 'roam'        // Roam Research JSON export
  | 'onenote'     // OneNote HTML export
  | 'apple-notes' // Apple Notes HTML export
  | 'text';       // Plain text files

export interface ImportSourceInfo {
  id: ImportSource;
  label: string;
  description: string;
  icon: string;
  extensions: string[];
  /** Whether this source supports multi-file or directory selection. */
  multiFile: boolean;
}

/** All supported import sources with metadata. */
export const IMPORT_SOURCES: ImportSourceInfo[] = [
  {
    id: 'markdown',
    label: 'Markdown',
    description: 'Import .md files directly into your vault',
    icon: 'file-text',
    extensions: ['md', 'markdown', 'mdown', 'mkd'],
    multiFile: true,
  },
  {
    id: 'html',
    label: 'HTML',
    description: 'Convert HTML files to Markdown',
    icon: 'code',
    extensions: ['html', 'htm'],
    multiFile: true,
  },
  {
    id: 'csv',
    label: 'CSV',
    description: 'Convert CSV rows into individual notes',
    icon: 'table',
    extensions: ['csv', 'tsv'],
    multiFile: false,
  },
  {
    id: 'evernote',
    label: 'Evernote',
    description: 'Import from Evernote .enex export files',
    icon: 'archive',
    extensions: ['enex'],
    multiFile: true,
  },
  {
    id: 'bear',
    label: 'Bear',
    description: 'Import from Bear Markdown or JSON exports',
    icon: 'file-text',
    extensions: ['md', 'json', 'zip'],
    multiFile: true,
  },
  {
    id: 'google-keep',
    label: 'Google Keep',
    description: 'Import from Google Takeout (Keep folder)',
    icon: 'lightbulb',
    extensions: ['json', 'html'],
    multiFile: true,
  },
  {
    id: 'notion',
    label: 'Notion',
    description: 'Import from Notion Markdown & CSV export',
    icon: 'file-text',
    extensions: ['md', 'csv', 'zip'],
    multiFile: true,
  },
  {
    id: 'roam',
    label: 'Roam Research',
    description: 'Import from Roam JSON export',
    icon: 'share-2',
    extensions: ['json'],
    multiFile: false,
  },
  {
    id: 'onenote',
    label: 'Microsoft OneNote',
    description: 'Import from OneNote HTML export',
    icon: 'book-open',
    extensions: ['html', 'htm'],
    multiFile: true,
  },
  {
    id: 'apple-notes',
    label: 'Apple Notes',
    description: 'Import from Apple Notes HTML export',
    icon: 'edit-3',
    extensions: ['html', 'htm'],
    multiFile: true,
  },
  {
    id: 'text',
    label: 'Plain Text',
    description: 'Import plain text files as Markdown notes',
    icon: 'type',
    extensions: ['txt', 'text'],
    multiFile: true,
  },
];

/** A single converted note ready to be written to the vault. */
export interface ConvertedNote {
  /** Suggested file name (without extension). */
  title: string;
  /** Markdown content including frontmatter if applicable. */
  content: string;
  /** Optional subfolder path relative to import destination. */
  folder?: string;
  /** Original source file path (for reference). */
  sourcePath?: string;
  /** Attachments to copy (source → relative vault path). */
  attachments?: Array<{ sourcePath: string; vaultRelPath: string }>;
}

/** Options for an import operation. */
export interface ImportOptions {
  /** The source format being imported. */
  source: ImportSource;
  /** Destination folder within the vault (relative to vault root). */
  destinationFolder: string;
  /** Whether to create a subfolder per source (e.g. "Evernote Import"). */
  createSubfolder: boolean;
  /** CSV: which column to use as note title. */
  csvTitleColumn?: string;
  /** CSV: which column to use as note body. */
  csvBodyColumn?: string;
  /** Whether to add import metadata as frontmatter. */
  addFrontmatter: boolean;
  /** Tag to add to all imported notes. */
  importTag?: string;
}

/** Result of an import operation. */
export interface ImportResult {
  /** Total notes found in the source. */
  totalFound: number;
  /** Number of notes successfully imported. */
  imported: number;
  /** Number of notes that failed. */
  failed: number;
  /** Number of notes skipped (already exist). */
  skipped: number;
  /** Per-note error details. */
  errors: Array<{ title: string; error: string }>;
  /** Duration in milliseconds. */
  durationMs: number;
}

/** Import progress update. */
export interface ImportProgress {
  current: number;
  total: number;
  currentTitle: string;
  phase: 'reading' | 'converting' | 'writing';
}

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  source: 'markdown',
  destinationFolder: '',
  createSubfolder: true,
  addFrontmatter: true,
  importTag: 'imported',
};
