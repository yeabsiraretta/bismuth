/**
 * Metadata Extractor types — four JSON export formats
 * compatible with the Obsidian Metadata Extractor plugin.
 */

// ─── Tag export ────────────────────────────────────────────────────────────────

/** A tag and its associated file paths. */
export interface TagToFile {
  tag: string;
  tagCount: number;
  relativePaths: string[];
}

// ─── Markdown metadata export ──────────────────────────────────────────────────

export interface MdLink {
  link: string;
  relativePath?: string;
  cleanLink?: string;
  displayText?: string;
}

export interface MdBacklink {
  fileName: string;
  link: string;
  relativePath: string;
  cleanLink?: string;
  displayText?: string;
}

export interface MdHeading {
  heading: string;
  level: number;
}

/** Metadata for a single markdown note. */
export interface NoteMetadataExport {
  fileName: string;
  relativePath: string;
  tags?: string[];
  headings?: MdHeading[];
  aliases?: string[];
  links?: MdLink[];
  backlinks?: MdBacklink[];
  frontmatter?: Record<string, unknown>;
}

// ─── Non-markdown files export ─────────────────────────────────────────────────

export interface FolderEntry {
  name: string;
  relativePath: string;
}

export interface FileEntry {
  name: string;
  basename: string;
  relativePath: string;
}

export interface NonMdExport {
  folders: FolderEntry[];
  nonMdFiles?: FileEntry[];
}

// ─── Canvas export ─────────────────────────────────────────────────────────────

export interface CanvasEntry {
  name: string;
  basename: string;
  relativePath: string;
}

// ─── Extractor config ──────────────────────────────────────────────────────────

export interface ExtractorConfig {
  enabled: boolean;
  /** File names (relative to plugin folder, or absolute paths). */
  tagFileName: string;
  metadataFileName: string;
  nonMdFileName: string;
  canvasFileName: string;
  /** Minutes between auto-exports (0 = disabled). */
  frequencyMinutes: number;
  /** Whether to export on app launch. */
  writeOnLaunch: boolean;
}

export const DEFAULT_EXTRACTOR_CONFIG: ExtractorConfig = {
  enabled: true,
  tagFileName: 'tags.json',
  metadataFileName: 'metadata.json',
  nonMdFileName: 'allExceptMd.json',
  canvasFileName: 'canvas.json',
  frequencyMinutes: 0,
  writeOnLaunch: false,
};
