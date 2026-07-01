/**
 * CRDT Architecture Stub (T140)
 *
 * Defines types and placeholder functions for CRDT-compatible collaborative
 * canvas operations. This is NOT a full CRDT implementation.
 *
 * TODO: implement with Y.js or Automerge when collaboration is needed.
 */

// ─── Lamport Clock ────────────────────────────────────────────────────────────

/** Logical clock for ordering concurrent operations. */
export interface LamportClock {
  /** Monotonically increasing counter. */
  counter: number;
  /** Unique node/peer identifier. */
  nodeId: string;
}

/** Creates a new Lamport clock for the given node. */
export function createLamportClock(nodeId: string): LamportClock {
  return { counter: 0, nodeId };
}

/** Increments the clock and returns the new timestamp. */
export function tickClock(clock: LamportClock): LamportClock {
  return { ...clock, counter: clock.counter + 1 };
}

/** Merges two clocks, taking the max counter + 1 (receive rule). */
export function mergeClock(local: LamportClock, remote: LamportClock): LamportClock {
  return { ...local, counter: Math.max(local.counter, remote.counter) + 1 };
}

// ─── Operation Types ─────────────────────────────────────────────────────────

/** Supported operation kinds for canvas elements. */
export type CrdtOpKind = 'insert' | 'delete' | 'move' | 'update';

/** A single CRDT operation on the canvas document. */
export interface CrdtOp {
  /** Unique operation identifier. */
  id: string;
  /** Logical timestamp for ordering. */
  clock: LamportClock;
  /** Kind of operation. */
  kind: CrdtOpKind;
  /** Target element ID. */
  elementId: string;
  /**
   * Payload — shape depends on kind:
   * - insert: the element data
   * - delete: {}
   * - move: { x, y }
   * - update: { [property]: value }
   */
  payload: Record<string, unknown>;
}

// ─── Document ─────────────────────────────────────────────────────────────────

/** A CRDT-compatible document state. */
export interface CrdtDocument {
  /** Document identifier. */
  id: string;
  /** Current logical clock for this peer. */
  clock: LamportClock;
  /** Ordered list of applied operations (append-only log). */
  ops: CrdtOp[];
  /** Derived snapshot: element states keyed by element ID. */
  state: Record<string, Record<string, unknown>>;
}

/** Creates a fresh CRDT document. */
export function createCrdtDocument(id: string, nodeId: string): CrdtDocument {
  return {
    id,
    clock: createLamportClock(nodeId),
    ops: [],
    state: {},
  };
}

// ─── Operation Factories ──────────────────────────────────────────────────────

/** Creates an insert operation for a new element. */
export function createInsertOp(
  clock: LamportClock,
  elementId: string,
  elementData: Record<string, unknown>
): CrdtOp {
  // TODO: implement with Y.js or Automerge when collaboration is needed
  return {
    id: `${clock.nodeId}:${clock.counter}`,
    clock,
    kind: 'insert',
    elementId,
    payload: elementData,
  };
}

/** Creates a delete operation for an existing element. */
export function createDeleteOp(clock: LamportClock, elementId: string): CrdtOp {
  // TODO: implement with Y.js or Automerge when collaboration is needed
  return {
    id: `${clock.nodeId}:${clock.counter}`,
    clock,
    kind: 'delete',
    elementId,
    payload: {},
  };
}

/** Creates an update operation for element properties. */
export function createUpdateOp(
  clock: LamportClock,
  elementId: string,
  changes: Record<string, unknown>
): CrdtOp {
  // TODO: implement with Y.js or Automerge when collaboration is needed
  return {
    id: `${clock.nodeId}:${clock.counter}`,
    clock,
    kind: 'update',
    elementId,
    payload: changes,
  };
}

// ─── Core Functions ────────────────────────────────────────────────────────────

/**
 * Applies a single operation to a document, returning the updated document.
 * Uses last-write-wins semantics for the stub implementation.
 *
 * TODO: implement with Y.js or Automerge when collaboration is needed
 */
export function applyOp(doc: CrdtDocument, op: CrdtOp): CrdtDocument {
  // TODO: implement with Y.js or Automerge when collaboration is needed
  const state = { ...doc.state };

  if (op.kind === 'insert') {
    state[op.elementId] = { ...op.payload };
  } else if (op.kind === 'delete') {
    delete state[op.elementId];
  } else if (op.kind === 'move') {
    state[op.elementId] = { ...(state[op.elementId] ?? {}), ...op.payload };
  } else if (op.kind === 'update') {
    // Last-write-wins: simply merge payload into current state
    state[op.elementId] = { ...(state[op.elementId] ?? {}), ...op.payload };
  }

  return {
    ...doc,
    clock: mergeClock(doc.clock, op.clock),
    ops: [...doc.ops, op],
    state,
  };
}

/**
 * Merges two op sequences into a single ordered sequence.
 * Uses Lamport clock ordering; ties broken by nodeId for determinism.
 *
 * TODO: implement with Y.js or Automerge when collaboration is needed
 */
export function mergeOps(ops1: CrdtOp[], ops2: CrdtOp[]): CrdtOp[] {
  // TODO: implement with Y.js or Automerge when collaboration is needed
  const seen = new Set<string>();
  const combined: CrdtOp[] = [];

  for (const op of [...ops1, ...ops2]) {
    if (!seen.has(op.id)) {
      seen.add(op.id);
      combined.push(op);
    }
  }

  return combined.sort((a, b) => {
    if (a.clock.counter !== b.clock.counter) {
      return a.clock.counter - b.clock.counter;
    }
    return a.clock.nodeId.localeCompare(b.clock.nodeId);
  });
}
