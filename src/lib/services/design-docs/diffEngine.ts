/**
 * Diff Engine — computes structured JSON diffs between design document versions.
 * Uses RFC 6902 JSON Patch format via fast-json-patch.
 */

import { compare } from 'fast-json-patch';

/** A single JSON Patch operation (RFC 6902). */
export interface PatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy';
  path: string;
  value?: unknown;
  from?: string;
}

/** Result of a document diff computation. */
export interface DesignDocDiff {
  from_version: number;
  to_version: number;
  operations: PatchOperation[];
  summary: { added: number; removed: number; changed: number };
}

/** Compute a JSON Patch diff between two objects. */
export function computeDiff(objA: unknown, objB: unknown): PatchOperation[] {
  if (objA === objB) return [];
  const a = (objA ?? {}) as object;
  const b = (objB ?? {}) as object;
  return compare(a, b) as PatchOperation[];
}

/** Compute a full diff result between two document payloads. */
export function computeDocumentDiff(
  payloadA: unknown,
  payloadB: unknown,
  fromVersion: number,
  toVersion: number
): DesignDocDiff {
  const operations = computeDiff(payloadA, payloadB);
  const added = operations.filter((op) => op.op === 'add').length;
  const removed = operations.filter((op) => op.op === 'remove').length;
  const changed = operations.filter((op) => op.op === 'replace').length;

  return {
    from_version: fromVersion,
    to_version: toVersion,
    operations,
    summary: { added, removed, changed },
  };
}
