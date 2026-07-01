/**
 * N-1 Compatibility types.
 *
 * The "version envelope" wraps every persisted data blob with metadata so that
 * any version of the app can determine whether it can safely read the data.
 *
 * Key invariant:  the CURRENT release must write data that the PREVIOUS release
 * (N-1) can still read and use.  This is enforced by:
 *   1. Every schema has a `minReaderVersion` — the oldest app version that can
 *      parse this format.
 *   2. Writes always include a `writerVersion` (the current app version).
 *   3. On read, if `writerVersion` is newer than "current + 1", the data is
 *      considered incompatible and the reader falls back to defaults.
 */

/** Envelope that wraps every versioned data blob in localStorage. */
export interface VersionEnvelope<T = unknown> {
  /** Schema identifier, e.g. "bismuth-settings" */
  schemaId: string;
  /** Schema version number (monotonically increasing integer). */
  schemaVersion: number;
  /** App version that wrote this data (semver string from package.json). */
  writerVersion: string;
  /** Minimum app version that can safely read this schema version. */
  minReaderVersion: string;
  /** ISO timestamp of last write. */
  writtenAt: string;
  /** The actual data payload. */
  data: T;
}

/** Migration function: transforms data from one schema version to the next. */
export type SchemaMigration<TFrom = unknown, TTo = unknown> = (data: TFrom) => TTo;

/** Schema definition registered in the compatibility registry. */
export interface SchemaDefinition {
  /** Unique schema identifier matching the localStorage key. */
  id: string;
  /** Current schema version. */
  currentVersion: number;
  /** Minimum reader version (oldest app that can read currentVersion). */
  minReaderVersion: string;
  /** Ordered list of migrations: index 0 = v1→v2, index 1 = v2→v3, etc. */
  migrations: SchemaMigration[];
  /** Default value factory (returns a fresh default when data is incompatible). */
  defaultValue: () => unknown;
}

/** Result of a compatibility check. */
export interface CompatCheckResult {
  compatible: boolean;
  /** If not compatible, describes why. */
  reason?: 'version_too_new' | 'version_too_old' | 'schema_unknown' | 'corrupt';
  /** The envelope that was checked (if any). */
  envelope?: VersionEnvelope;
  /** If migrations were applied, how many. */
  migrationsApplied?: number;
}
