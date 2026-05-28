/** Portent entity types (FR-008) */
export type PortentType =
  | 'Project'
  | 'Area'
  | 'Resource'
  | 'Archive'
  | 'Concept'
  | 'Person'
  | 'Event'
  | 'Task';

/** Lifecycle states for notes (FR-009) */
export type LifecycleState = 'captured' | 'organized' | 'archived';

/** Portent type definition with metadata */
export interface TypeDefinition {
  name: PortentType;
  icon: string;
  color: string;
  description: string;
  defaultLifecycle: LifecycleState;
}

/** Entity relationships resolved from frontmatter */
export interface EntityRelationships {
  type: PortentType | null;
  lifecycle: LifecycleState;
  belongsTo: EntityReference[];
  relatedTo: EntityReference[];
  backlinks: EntityReference[];
}

/** Reference to another entity/note */
export interface EntityReference {
  path: string;
  title: string;
  type?: PortentType;
}

/** Concept link suggestion (FR-256/257/258) */
export interface ConceptSuggestion {
  matchText: string;
  targetPath: string;
  targetTitle: string;
  lineNumber: number;
  startColumn: number;
  endColumn: number;
}

/** All 8 default Portent types */
export const DEFAULT_PORTENT_TYPES: TypeDefinition[] = [
  { name: 'Project', icon: 'folder', color: '#6366f1', description: 'Active project with a defined goal and timeline', defaultLifecycle: 'captured' },
  { name: 'Area', icon: 'layers', color: '#8b5cf6', description: 'Area of responsibility maintained over time', defaultLifecycle: 'organized' },
  { name: 'Resource', icon: 'book', color: '#06b6d4', description: 'Topic or theme of ongoing interest', defaultLifecycle: 'organized' },
  { name: 'Archive', icon: 'archive', color: '#6b7280', description: 'Inactive items from other categories', defaultLifecycle: 'archived' },
  { name: 'Concept', icon: 'lightbulb', color: '#f59e0b', description: 'Atomic idea or concept note', defaultLifecycle: 'captured' },
  { name: 'Person', icon: 'user', color: '#10b981', description: 'Person or contact', defaultLifecycle: 'organized' },
  { name: 'Event', icon: 'calendar', color: '#ef4444', description: 'Time-bound event or occurrence', defaultLifecycle: 'captured' },
  { name: 'Task', icon: 'check-square', color: '#f97316', description: 'Actionable task or to-do item', defaultLifecycle: 'captured' },
];

/** Get icon name for a portent type */
export function getPortentIcon(type: PortentType | string): string {
  return DEFAULT_PORTENT_TYPES.find((t) => t.name === type)?.icon ?? 'file';
}

/** Get color for a portent type */
export function getPortentColor(type: PortentType | string): string {
  return DEFAULT_PORTENT_TYPES.find((t) => t.name === type)?.color ?? '#6b7280';
}

/** Derive lifecycle state from frontmatter */
export function deriveLifecycle(frontmatter: Record<string, unknown>): LifecycleState {
  if (frontmatter.archived === true) return 'archived';
  if (frontmatter.organized === true) return 'organized';
  return 'captured';
}
