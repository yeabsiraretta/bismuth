/**
 * Note-related type definitions
 * @module types/note
 */

/**
 * Represents a note in the vault
 * @interface Note
 */
export interface Note {
  /** Absolute path to the note file */
  path: string;
  /** Note title (extracted from filename or frontmatter) */
  title: string;
  /** Raw markdown content */
  content: string;
  /** YAML frontmatter metadata */
  frontmatter: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  modifiedAt: Date;
  /** List of tags from frontmatter or content */
  tags?: string[];
  /** List of wikilinks in the note */
  links?: Link[];
}

/**
 * Represents a wikilink between notes
 * @interface Link
 */
export interface Link {
  /** Source note path */
  sourcePath: string;
  /** Target note title or path */
  targetTitle: string;
  /** Resolved target path (if found) */
  targetPath?: string;
  /** Link alias (display text) */
  alias?: string;
  /** Whether the link target exists */
  isResolved: boolean;
  /** Link type (wikilink, embed, etc.) */
  type: 'wikilink' | 'embed' | 'block-ref';
}

/**
 * Tag with usage count
 * @interface Tag
 */
export interface Tag {
  /** Tag name (without #) */
  name: string;
  /** Number of notes using this tag */
  count: number;
  /** Parent tag (for hierarchical tags) */
  parent?: string;
  /** Child tags */
  children?: Tag[];
}

/**
 * Johnny.Decimal ID structure
 * @interface JohnnyDecimalId
 */
export interface JohnnyDecimalId {
  /** Area number (10-99) */
  area: number;
  /** Category number (00-99) */
  category: number;
  /** ID number (00-99) */
  id: number;
  /** Full ID string (e.g., "11.01") */
  fullId: string;
  /** Whether the ID is valid */
  isValid: boolean;
}
