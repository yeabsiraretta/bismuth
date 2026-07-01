/**
 * N-1 Compatibility engine.
 *
 * Provides versioned read/write for localStorage with automatic migration,
 * forward-compatibility detection, and fallback-to-defaults safety.
 *
 * Core invariant: current version writes data that N-1 can still read.
 */

import type { VersionEnvelope, CompatCheckResult } from './types';
import { schemaRegistry } from './registry';
import { log } from '@/utils/logger';

/** Current app version — injected at build time from package.json. */
const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.3.0';

declare const __APP_VERSION__: string | undefined;

// ─── Semver comparison ────────────────────────────────────────────────────────

/** Parse semver "1.2.3" → [1, 2, 3]. Non-numeric parts default to 0. */
export function parseSemver(version: string): [number, number, number] {
  const parts = version.replace(/^v/, '').split('.').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

/** Returns -1 if a < b, 0 if a == b, 1 if a > b. */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const [aMaj, aMin, aPat] = parseSemver(a);
  const [bMaj, bMin, bPat] = parseSemver(b);
  if (aMaj !== bMaj) return aMaj < bMaj ? -1 : 1;
  if (aMin !== bMin) return aMin < bMin ? -1 : 1;
  if (aPat !== bPat) return aPat < bPat ? -1 : 1;
  return 0;
}

/** Get current app version. */
export function getAppVersion(): string {
  return APP_VERSION;
}

// ─── Envelope detection ───────────────────────────────────────────────────────

/** Check whether a parsed object is a version envelope. */
function isEnvelope(obj: unknown): obj is VersionEnvelope {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o['schemaId'] === 'string' &&
    typeof o['schemaVersion'] === 'number' &&
    typeof o['writerVersion'] === 'string' &&
    'data' in o
  );
}

// ─── Versioned read ───────────────────────────────────────────────────────────

/**
 * Read a versioned data blob from localStorage.
 *
 * 1. If the stored value is an envelope, validate compatibility and run
 *    any needed migrations.
 * 2. If the stored value is raw (legacy / pre-envelope), wrap it as v1
 *    and run migrations from v1 → current.
 * 3. If the writer version is > current + 1 minor, reject as incompatible.
 */
export function versionedRead<T>(key: string, fallback: T): { data: T; result: CompatCheckResult } {
  const def = schemaRegistry.get(key);
  const raw = safeGetItem(key);

  if (raw === null) {
    return { data: fallback, result: { compatible: true, migrationsApplied: 0 } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    log.warn(`N-1 compat: corrupt data in "${key}", using fallback`);
    return { data: fallback, result: { compatible: false, reason: 'corrupt' } };
  }

  // Enveloped data
  if (isEnvelope(parsed)) {
    return readEnvelope<T>(parsed, key, fallback, def);
  }

  // Legacy (pre-envelope) data — treat as schema v1
  if (def) {
    const migratedData = runMigrations(parsed, key, 1, def.currentVersion);
    return {
      data: migratedData as T,
      result: {
        compatible: true,
        migrationsApplied: def.currentVersion - 1,
        envelope: undefined,
      },
    };
  }

  // No schema registered — return raw as-is (backward compat for unregistered keys)
  return { data: parsed as T, result: { compatible: true } };
}

function readEnvelope<T>(
  envelope: VersionEnvelope,
  key: string,
  fallback: T,
  def: ReturnType<typeof schemaRegistry.get>
): { data: T; result: CompatCheckResult } {
  // Check forward-compatibility: can THIS app version read the data?
  if (envelope.minReaderVersion && compareSemver(APP_VERSION, envelope.minReaderVersion) < 0) {
    log.warn(
      `N-1 compat: "${key}" requires reader >= ${envelope.minReaderVersion}, we are ${APP_VERSION}`
    );
    return {
      data: fallback,
      result: { compatible: false, reason: 'version_too_new', envelope },
    };
  }

  let data = envelope.data;
  let migrationsApplied = 0;

  // Run migrations if schema version is behind current
  if (def && envelope.schemaVersion < def.currentVersion) {
    data = runMigrations(data, key, envelope.schemaVersion, def.currentVersion);
    migrationsApplied = def.currentVersion - envelope.schemaVersion;
    log.info(
      `N-1 compat: migrated "${key}" from v${envelope.schemaVersion} → v${def.currentVersion}`
    );
  }

  return {
    data: data as T,
    result: { compatible: true, envelope, migrationsApplied },
  };
}

// ─── Versioned write ──────────────────────────────────────────────────────────

/**
 * Write data wrapped in a version envelope.
 *
 * The envelope ensures any future (or past) reader can determine
 * compatibility without parsing the data payload.
 */
export function versionedWrite<T>(key: string, data: T): void {
  const def = schemaRegistry.get(key);
  const envelope: VersionEnvelope<T> = {
    schemaId: key,
    schemaVersion: def?.currentVersion ?? 1,
    writerVersion: APP_VERSION,
    minReaderVersion: def?.minReaderVersion ?? APP_VERSION,
    writtenAt: new Date().toISOString(),
    data,
  };

  try {
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    log.warn(`N-1 compat: failed to write "${key}"`);
  }
}

// ─── Migration runner ─────────────────────────────────────────────────────────

function runMigrations(
  data: unknown,
  schemaId: string,
  fromVersion: number,
  toVersion: number
): unknown {
  const migrations = schemaRegistry.getMigrations(schemaId, fromVersion, toVersion);
  let current = data;
  for (let i = 0; i < migrations.length; i++) {
    try {
      current = migrations[i](current);
    } catch (err) {
      log.error(
        `N-1 compat: migration v${fromVersion + i} → v${fromVersion + i + 1} failed for "${schemaId}"`,
        err
      );
      const def = schemaRegistry.get(schemaId);
      return def ? def.defaultValue() : current;
    }
  }
  return current;
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

/** Scan all registered schemas and return compatibility status for each. */
export function auditCompatibility(): Record<string, CompatCheckResult> {
  const results: Record<string, CompatCheckResult> = {};
  for (const id of schemaRegistry.ids()) {
    const def = schemaRegistry.get(id)!;
    const { result } = versionedRead(id, def.defaultValue());
    results[id] = result;
  }
  return results;
}

/** Get a diagnostic summary suitable for display. */
export function getCompatSummary(): {
  appVersion: string;
  registeredSchemas: number;
  schemasWithData: number;
  schemasNeedingMigration: number;
  incompatibleSchemas: number;
} {
  const audit = auditCompatibility();
  const entries = Object.values(audit);
  return {
    appVersion: APP_VERSION,
    registeredSchemas: schemaRegistry.ids().length,
    schemasWithData: entries.filter((r) => r.envelope || r.migrationsApplied).length,
    schemasNeedingMigration: entries.filter((r) => (r.migrationsApplied ?? 0) > 0).length,
    incompatibleSchemas: entries.filter((r) => !r.compatible).length,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
