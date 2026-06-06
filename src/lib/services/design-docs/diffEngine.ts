/**
 * Diff Engine — computes structured JSON diffs between design document versions.
 * Uses RFC 6902 JSON Patch format.
 */

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
export function computeDiff(objA: unknown, objB: unknown, basePath = ''): PatchOperation[] {
  const ops: PatchOperation[] = [];

  if (objA === objB) return ops;
  if (objA === null || objB === null || typeof objA !== typeof objB) {
    ops.push({ op: 'replace', path: basePath || '/', value: objB });
    return ops;
  }

  if (Array.isArray(objA) && Array.isArray(objB)) {
    return diffArrays(objA, objB, basePath);
  }

  if (typeof objA === 'object' && typeof objB === 'object') {
    return diffObjects(objA as Record<string, unknown>, objB as Record<string, unknown>, basePath);
  }

  // Primitives that differ (guaranteed by early return on line 26)
  ops.push({ op: 'replace', path: basePath || '/', value: objB });
  return ops;
}

/** Diff two objects and produce patch operations. */
function diffObjects(a: Record<string, unknown>, b: Record<string, unknown>, basePath: string): PatchOperation[] {
  const ops: PatchOperation[] = [];
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of allKeys) {
    const path = `${basePath}/${key}`;
    if (!(key in a)) {
      ops.push({ op: 'add', path, value: b[key] });
    } else if (!(key in b)) {
      ops.push({ op: 'remove', path });
    } else {
      ops.push(...computeDiff(a[key], b[key], path));
    }
  }
  return ops;
}

/** Diff two arrays (simplified: length-based comparison). */
function diffArrays(a: unknown[], b: unknown[], basePath: string): PatchOperation[] {
  const ops: PatchOperation[] = [];
  const maxLen = Math.max(a.length, b.length);

  for (let i = 0; i < maxLen; i++) {
    const path = `${basePath}/${i}`;
    if (i >= a.length) {
      ops.push({ op: 'add', path, value: b[i] });
    } else if (i >= b.length) {
      ops.push({ op: 'remove', path });
    } else {
      ops.push(...computeDiff(a[i], b[i], path));
    }
  }
  return ops;
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
