/**
 * TypeScript types for the knowledge versioning feature (spec 051).
 *
 * All field names use camelCase to match Tauri's default serde rename convention.
 * These types mirror the Rust structs in `src-tauri/src/services/version_service/`.
 *
 * @module versioning/types
 */

/** Semantic version bump classification. */
export type BumpType = 'patch' | 'minor' | 'major';

/**
 * Quantitative metrics extracted from the diff between two document versions.
 * Mirrors `DiffMetrics` in `diff.rs`.
 */
export interface DiffMetrics {
  /** Number of lines added in the new version. */
  addedLines: number;
  /** Number of lines removed from the old version. */
  removedLines: number;
  /** Total line count of the old document (denominator for change_pct). */
  totalLines: number;
  /** Net change in Markdown heading count (new_headings − old_headings). */
  headingDelta: number;
  /** Net change in structural tokens: headings + list items + code-block markers. */
  structuralTokenDelta: number;
}

/**
 * A single stored version entry.
 * Mirrors `VersionEntry` in `storage.rs`.
 */
export interface VersionEntry {
  /** Semver string, e.g. `"1.2.3"`. */
  version: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** The computed bump type for this version. */
  bumpType: BumpType;
  /** Auto-generated one-line description of what changed. */
  summary: string;
  /** Relative path to the JSON file inside the vault root. */
  diffPath: string;
  /** Quantitative diff metrics used to derive the bump type. */
  metrics: DiffMetrics;
}

/**
 * Full version history for a single file.
 */
export interface VersionHistory {
  /** File identifier (note path or UUID). */
  fileId: string;
  /** Current semver string. */
  currentVersion: string;
  /** Version entries, newest-first, capped at retention limit (default 50). */
  entries: VersionEntry[];
}
