/**
 * Waypoint types — automatic TOC/MOC generation for folder notes.
 *
 * A folder note is any note whose filename (sans .md) matches its parent folder name.
 * Waypoints generate a table of contents linking to every note in the folder (and
 * subfolders), while Landmarks do the same without stopping parent waypoint generation.
 */

// ─── Marker types ───────────────────────────────────────────────────────────

/** The two kinds of automatic TOC markers. */
export type MarkerKind = 'waypoint' | 'landmark';

/** Raw trigger text detected in a note. */
export interface MarkerTrigger {
  kind: MarkerKind;
  /** 0-based line index where the trigger was found. */
  line: number;
}

// ─── TOC entry ──────────────────────────────────────────────────────────────

/** One entry in a generated table of contents. */
export interface TocEntry {
  /** Display name (note title or folder name). */
  name: string;
  /** Vault-relative path to the linked note (for wikilink). */
  path: string;
  /** Depth relative to the waypoint's folder (0 = same folder). */
  depth: number;
  /** Whether this entry is a folder note (i.e. another waypoint could live here). */
  isFolderNote: boolean;
}

// ─── Folder note info ───────────────────────────────────────────────────────

/** Describes a folder note and any marker it contains. */
export interface FolderNoteInfo {
  /** Path of the folder note itself. */
  notePath: string;
  /** Path of the parent folder. */
  folderPath: string;
  /** Folder name. */
  folderName: string;
  /** Which marker kind lives in this note, if any. */
  marker: MarkerKind | null;
}

// ─── Configuration ──────────────────────────────────────────────────────────

export interface WaypointConfig {
  /** Master switch — enable/disable all waypoint processing. */
  enabled: boolean;
  /** Trigger text for waypoints (without %% delimiters). */
  waypointTrigger: string;
  /** Trigger text for landmarks (without %% delimiters). */
  landmarkTrigger: string;
  /** Whether to show only the nearest folder note instead of all nested files. */
  stopAtFolderNotes: boolean;
  /** Hide waypoint markers and generated TOC blocks in the editor view. */
  hideInEditor: boolean;
  /** Whether to include file extensions in wikilinks (e.g. [[note.md]] vs [[note]]). */
  includeExtension: boolean;
  /** Indent string for nested items (default: two spaces). */
  indentString: string;
  /** Auto-create folder notes when new folders are created. */
  autoCreateFolderNotes: boolean;
}

export const DEFAULT_WAYPOINT_CONFIG: WaypointConfig = {
  enabled: true,
  waypointTrigger: 'Waypoint',
  landmarkTrigger: 'Landmark',
  stopAtFolderNotes: false,
  hideInEditor: false,
  includeExtension: false,
  indentString: '  ',
  autoCreateFolderNotes: false,
};

// ─── Generated block boundaries ─────────────────────────────────────────────

/** Build the begin/end comment markers for a given kind. */
export function beginMarker(_kind: MarkerKind, trigger: string): string {
  return `%% Begin ${trigger} %%`;
}

export function endMarker(_kind: MarkerKind, trigger: string): string {
  return `%% End ${trigger} %%`;
}

/** Build the inline trigger comment. */
export function triggerComment(trigger: string): string {
  return `%% ${trigger} %%`;
}
