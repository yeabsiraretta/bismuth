/**
 * Zoom types — zoom into headings and list items,
 * hiding everything outside the focused section.
 */

// ─── Target types ───────────────────────────────────────────────────────────

export type ZoomTargetKind = 'heading' | 'list';

/** A zoom target identifies a specific heading or list item to focus on. */
export interface ZoomTarget {
  kind: ZoomTargetKind;
  /** The 1-indexed line number where the target starts. */
  line: number;
  /** Heading level (1-6) or list nesting depth (0+). */
  level: number;
  /** Display text (heading text or first line of list item). */
  text: string;
}

// ─── Zoom range ─────────────────────────────────────────────────────────────

/** The character range to show; everything outside is hidden. */
export interface ZoomRange {
  /** Start offset (inclusive). */
  from: number;
  /** End offset (exclusive). */
  to: number;
}

// ─── Breadcrumb ─────────────────────────────────────────────────────────────

/** One entry in the zoom breadcrumb trail. */
export interface ZoomBreadcrumb {
  target: ZoomTarget;
  /** Character offset where the target starts — used to restore zoom. */
  from: number;
}

// ─── State ──────────────────────────────────────────────────────────────────

export interface ZoomState {
  /** Whether zoom is currently active. */
  active: boolean;
  /** The current zoom target (null = document root). */
  target: ZoomTarget | null;
  /** The visible range. */
  range: ZoomRange | null;
  /** Stack of parent zoom levels for breadcrumb navigation. */
  stack: ZoomBreadcrumb[];
}

export const INITIAL_ZOOM_STATE: ZoomState = {
  active: false,
  target: null,
  range: null,
  stack: [],
};

// ─── Configuration ──────────────────────────────────────────────────────────

export interface ZoomConfig {
  /** Whether clicking on a bullet/heading marker zooms in. */
  zoomOnClick: boolean;
  /** Show breadcrumb navigation bar when zoomed. */
  showBreadcrumbs: boolean;
  /** Whether to highlight the zoom target line. */
  highlightTarget: boolean;
}

export const DEFAULT_ZOOM_CONFIG: ZoomConfig = {
  zoomOnClick: true,
  showBreadcrumbs: true,
  highlightTarget: true,
};
