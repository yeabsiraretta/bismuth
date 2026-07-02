/**
 * NAS access types — WebDAV vault sync.
 *
 * IMPORTANT: The `NasConfig` type MUST NOT contain a `password` field.
 * Passwords are stored exclusively in the OS keychain:
 *   service: "bismuth-pkm"
 *   account: "nas-{vaultId}"
 *   value:   JSON { password: string }
 *
 * Config is stored in `.bismuth/nas-config.json` (vault-local, not global settings).
 * Schema fields: url, username, lastSync, offlineModeEnabled — NO password field.
 */

/**
 * Per-vault NAS configuration.
 * Stored in `.bismuth/nas-config.json`.
 * password is NEVER present in this object — keychain only.
 */
export interface NasConfig {
  url: string; // WebDAV base URL e.g. https://192.168.1.100/dav
  username: string; // Keychain account name for credential lookup
  lastSync: string | null; // ISO timestamp of last successful sync, or null
  offlineModeEnabled: boolean; // When true, failed sync transitions to 'pending' not 'disconnected'
}

/**
 * Sync lifecycle states.
 * - disabled: nasConfig is null; NAS not configured
 * - disconnected: configured but not yet synced or connection lost
 * - syncing: sync in progress
 * - synced: last sync completed successfully
 * - pending: offline mode — changes queued for next reconnect
 * - conflict: one or more files have unresolved conflicts
 */
export type SyncStatus =
  'synced' | 'syncing' | 'pending' | 'conflict' | 'disconnected' | 'disabled';

/**
 * A file conflict detected during sync.
 * Both local and remote versions exist with differing content.
 */
export interface ConflictRecord {
  filePath: string;
  localMtime: number;
  remoteMtime: number;
  localContent: string;
  remoteContent: string;
  detectedAt: string; // ISO timestamp
}

/**
 * A single offline change journal entry.
 * Journal is append-only: .bismuth/nas-journal.jsonl
 */
export interface ChangeJournalEntry {
  op: 'put' | 'delete' | 'move';
  path: string;
  destPath?: string; // Required for 'move' ops
  timestamp: string; // ISO timestamp
  synced: boolean;
}

/**
 * Result returned by connect_webdav command.
 */
export interface NasConnectionResult {
  success: boolean;
  error?: string;
  serverInfo?: string;
}

/**
 * Summary returned after a sync operation.
 */
export interface SyncSummary {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  durationMs: number;
}

/**
 * A remote WebDAV directory entry returned by list_remote.
 */
export interface RemoteEntryDto {
  href: string;
  displayName: string;
  contentLength: number;
  lastModified: string;
  isCollection: boolean;
}

// --- Type guards ---

/** Returns true if obj is a valid NasConfig (and does NOT contain a 'password' field). */
export function isNasConfig(obj: unknown): obj is NasConfig {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  // Reject any object that contains a password field
  if ('password' in o) return false;
  return (
    typeof o['url'] === 'string' &&
    typeof o['username'] === 'string' &&
    (o['lastSync'] === null || typeof o['lastSync'] === 'string') &&
    typeof o['offlineModeEnabled'] === 'boolean'
  );
}

/** Returns true if obj is a valid ConflictRecord. */
export function isConflictRecord(obj: unknown): obj is ConflictRecord {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o['filePath'] === 'string' &&
    typeof o['localMtime'] === 'number' &&
    typeof o['remoteMtime'] === 'number' &&
    typeof o['localContent'] === 'string' &&
    typeof o['remoteContent'] === 'string' &&
    typeof o['detectedAt'] === 'string'
  );
}

/** Returns true if obj is a valid ChangeJournalEntry. */
export function isChangeJournalEntry(obj: unknown): obj is ChangeJournalEntry {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    (o['op'] === 'put' || o['op'] === 'delete' || o['op'] === 'move') &&
    typeof o['path'] === 'string' &&
    (o['destPath'] === undefined || typeof o['destPath'] === 'string') &&
    typeof o['timestamp'] === 'string' &&
    typeof o['synced'] === 'boolean'
  );
}
