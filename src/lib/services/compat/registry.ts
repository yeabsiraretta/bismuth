/**
 * Schema registry — central catalog of all versioned data schemas.
 *
 * Every localStorage key that persists structured data must be registered here
 * so that the N-1 compat system can:
 *   1. Wrap writes in a version envelope.
 *   2. Detect and run migrations on read.
 *   3. Reject data written by a future version that this release cannot parse.
 */

import type { SchemaDefinition, SchemaMigration } from './types';

class SchemaRegistry {
  private schemas = new Map<string, SchemaDefinition>();

  /** Register a schema. Call at module init time. */
  register(def: SchemaDefinition): void {
    if (this.schemas.has(def.id)) {
      const existing = this.schemas.get(def.id)!;
      if (def.currentVersion > existing.currentVersion) {
        this.schemas.set(def.id, def);
      }
      return;
    }
    this.schemas.set(def.id, def);
  }

  /** Look up a schema definition. */
  get(id: string): SchemaDefinition | undefined {
    return this.schemas.get(id);
  }

  /** Check if a schema is registered. */
  has(id: string): boolean {
    return this.schemas.has(id);
  }

  /** Get all registered schema IDs. */
  ids(): string[] {
    return Array.from(this.schemas.keys());
  }

  /** Get full snapshot of all schemas (for diagnostics). */
  getAll(): SchemaDefinition[] {
    return Array.from(this.schemas.values());
  }

  /** Get migration chain from fromVersion to toVersion. */
  getMigrations(schemaId: string, fromVersion: number, toVersion: number): SchemaMigration[] {
    const def = this.schemas.get(schemaId);
    if (!def) return [];
    // migrations[0] = v1→v2, migrations[1] = v2→v3, etc.
    const chain: SchemaMigration[] = [];
    for (let v = fromVersion; v < toVersion; v++) {
      const migrationIdx = v - 1; // v1→v2 is at index 0
      if (migrationIdx < 0 || migrationIdx >= def.migrations.length) break;
      chain.push(def.migrations[migrationIdx]);
    }
    return chain;
  }
}

/** Singleton schema registry. */
export const schemaRegistry = new SchemaRegistry();
