/**
 * Portent Type System — eight core object types for personal knowledge.
 *
 * The names are intentionally ordinary. A portable knowledge model should
 * not require a private ontology before it becomes useful.
 *
 * PORT (actionable): Project, Operation, Responsibility, Task
 * ENTP (non-actionable): Event, Note, Topic, Person
 *
 * @see https://portent.pub/types
 */

// ── Core types ───────────────────────────────────────────────────────────────

export const PORT_TYPES = ['project', 'operation', 'responsibility', 'task'] as const;
export const ENTP_TYPES = ['event', 'note', 'topic', 'person'] as const;
export const PORTENT_TYPES = [...PORT_TYPES, ...ENTP_TYPES] as const;

export type PortType = (typeof PORT_TYPES)[number];
export type EntpType = (typeof ENTP_TYPES)[number];
export type PortentType = (typeof PORTENT_TYPES)[number];

export function isPortType(t: string): t is PortType {
  return (PORT_TYPES as readonly string[]).includes(t);
}

export function isEntpType(t: string): t is EntpType {
  return (ENTP_TYPES as readonly string[]).includes(t);
}

export function isPortentType(t: string): t is PortentType {
  return (PORTENT_TYPES as readonly string[]).includes(t);
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

export const LIFECYCLE_STATES = ['captured', 'organized', 'archived'] as const;
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];

export function isLifecycleState(s: string): s is LifecycleState {
  return (LIFECYCLE_STATES as readonly string[]).includes(s);
}

// ── Relationships ────────────────────────────────────────────────────────────

const RELATIONSHIP_TYPES = ['belongs_to', 'related_to'] as const;
type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface PortentRelationship {
  type: RelationshipType;
  target: string;
}

// ── Object shape ─────────────────────────────────────────────────────────────

export interface PortentObject {
  path: string;
  title: string;
  type: PortentType;
  lifecycle: LifecycleState;
  organized: boolean;
  archived: boolean;
  belongsTo: string[];
  relatedTo: string[];
  tags: string[];
  content: string;
}

// ── Type metadata ────────────────────────────────────────────────────────────

export interface PortentTypeMeta {
  id: PortentType;
  label: string;
  group: 'PORT' | 'ENTP';
  description: string;
  actionable: boolean;
  recurring: boolean | null;
  singleSitting: boolean | null;
}

export const TYPE_REGISTRY: PortentTypeMeta[] = [
  {
    id: 'project',
    label: 'Project',
    group: 'PORT',
    description: 'Bounded effort that produces an output. One-and-done, multi-sitting.',
    actionable: true,
    recurring: false,
    singleSitting: false,
  },
  {
    id: 'operation',
    label: 'Operation',
    group: 'PORT',
    description: 'Recurring work completable in one sitting.',
    actionable: true,
    recurring: true,
    singleSitting: true,
  },
  {
    id: 'responsibility',
    label: 'Responsibility',
    group: 'PORT',
    description: 'Long-running area of accountability. Recurring, multi-sitting.',
    actionable: true,
    recurring: true,
    singleSitting: false,
  },
  {
    id: 'task',
    label: 'Task',
    group: 'PORT',
    description: 'One-off work completable in one sitting.',
    actionable: true,
    recurring: false,
    singleSitting: true,
  },
  {
    id: 'event',
    label: 'Event',
    group: 'ENTP',
    description: 'Something that happened and should be retained in long-term memory.',
    actionable: false,
    recurring: null,
    singleSitting: null,
  },
  {
    id: 'note',
    label: 'Note',
    group: 'ENTP',
    description: 'A durable knowledge artifact: document, resource, reference, or decision record.',
    actionable: false,
    recurring: null,
    singleSitting: null,
  },
  {
    id: 'topic',
    label: 'Topic',
    group: 'ENTP',
    description: 'An area of interest or conceptual lens. Collects knowledge without ownership.',
    actionable: false,
    recurring: null,
    singleSitting: null,
  },
  {
    id: 'person',
    label: 'Person',
    group: 'ENTP',
    description: 'A real-world person or AI agent treated as an actor in the system.',
    actionable: false,
    recurring: null,
    singleSitting: null,
  },
];

export function getTypeMeta(type: PortentType): PortentTypeMeta {
  return TYPE_REGISTRY.find((t) => t.id === type)!;
}

export function getTypeGroup(type: PortentType): 'PORT' | 'ENTP' {
  return isPortType(type) ? 'PORT' : 'ENTP';
}
