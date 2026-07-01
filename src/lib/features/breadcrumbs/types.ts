/**
 * Breadcrumbs feature types.
 * Typed links and hierarchy navigation for vault notes.
 */

/** A single segment in the breadcrumb trail */
export interface BreadcrumbSegment {
  /** Display label */
  label: string;
  /** Full absolute path to the folder or note */
  path: string;
  /** Whether this is the active (current) segment */
  isActive: boolean;
  /** Segment type: vault root, folder, or note */
  type: 'vault' | 'folder' | 'note';
}

/** Resolved breadcrumb context for a note */
export interface BreadcrumbContext {
  /** Ancestor trail from vault root to current note */
  trail: BreadcrumbSegment[];
  /** Previous note title (from frontmatter or sibling) */
  prev: string | null;
  /** Next note title (from frontmatter or sibling) */
  next: string | null;
  /** Parent note title (from frontmatter `parent` or `up`) */
  parent: string | null;
}

/** Frontmatter keys recognised for hierarchy relationships */
export const PARENT_KEYS = ['parent', 'up'] as const;
export const PREV_KEYS = ['prev', 'previous'] as const;
export const NEXT_KEYS = ['next'] as const;
