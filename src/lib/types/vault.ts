/** Represents an open vault (workspace) on disk. */
export interface Vault {
  /** Absolute filesystem path to the vault root directory. */
  root_path: string;
  /** Path to the `.bismuth/` settings directory inside the vault. */
  settings_path: string;
  /** Human-readable vault name (derived from folder name). */
  name: string;
}

/** A single markdown note within the vault. */
export interface Note {
  /** Absolute filesystem path to the `.md` file. */
  path: string;
  /** Display title (from frontmatter or filename). */
  title: string;
  /** Raw markdown content of the note. */
  content: string;
  /** Parsed YAML frontmatter key-value pairs. */
  frontmatter: Record<string, any>;
  /** ISO 8601 creation timestamp. */
  created_at: string;
  /** ISO 8601 last-modified timestamp. */
  modified_at: string;
}

/** A directional wikilink from one note to another. */
export interface Link {
  /** Path of the note containing the link. */
  source_path: string;
  /** Title or slug the link points to. */
  target_title: string;
  /** Resolved absolute path if the target exists, otherwise `null`. */
  target_path: string | null;
  /** Optional display alias (`[[target|alias]]`). */
  alias: string | null;
  /** `true` if target_path was resolved to an existing note. */
  is_resolved: boolean;
}

/** A tag with its usage count across the vault. */
export interface Tag {
  /** Tag name without `#` prefix. */
  name: string;
  /** Number of notes that use this tag. */
  count: number;
}

/** Starter templates available when creating a new vault. */
export enum VaultTemplate {
  /** Empty vault with no pre-created structure. */
  Blank = 'Blank',
  /** Projects / Areas / Resources / Archives methodology. */
  PARA = 'PARA',
  /** Numbered category.subcategory folder system. */
  JohnnyDecimal = 'JohnnyDecimal',
  /** Atomic permanent-note workflow with IDs. */
  Zettelkasten = 'Zettelkasten',
}
