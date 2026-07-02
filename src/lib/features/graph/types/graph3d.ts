/**
 * 3D Graph types — node shapes, 3D settings, camera, and color groups.
 */

import type { GraphNode, NodeColors } from './index';

// ─── Node shapes ────────────────────────────────────────────────────────────

export type NodeShape3D = 'sphere' | 'cube' | 'diamond' | 'cylinder' | 'cone' | 'octahedron';

export interface NodeAppearance3D {
  shape: NodeShape3D;
  size: number;
  color: string;
  opacity: number;
}

// ─── 3D simulation node ─────────────────────────────────────────────────────

export interface SimNode3D extends GraphNode {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Screen-space projection for hit testing */
  screenX?: number;
  screenY?: number;
  screenScale?: number;
}

// ─── Camera ─────────────────────────────────────────────────────────────────

export interface Camera3D {
  /** Rotation around Y axis (left-right orbit) in radians */
  theta: number;
  /** Rotation around X axis (up-down orbit) in radians */
  phi: number;
  /** Distance from the focus point */
  distance: number;
  /** Focus point in world space */
  focusX: number;
  focusY: number;
  focusZ: number;
}

export const DEFAULT_CAMERA: Camera3D = {
  theta: 0.3,
  phi: 0.5,
  distance: 600,
  focusX: 0,
  focusY: 0,
  focusZ: 0,
};

// ─── 3D Graph settings ──────────────────────────────────────────────────────

export interface Graph3DSettings {
  // ── Filters ──
  showTags: boolean;
  showAttachments: boolean;
  showOrphans: boolean;

  // ── Node appearance per type ──
  noteAppearance: NodeAppearance3D;
  attachmentAppearance: NodeAppearance3D;
  tagAppearance: NodeAppearance3D;

  // ── Link appearance ──
  linkThickness: number;
  linkOpacity: number;
  showArrows: boolean;

  // ── Labels ──
  showLabels: boolean;
  labelScale: number;

  // ── Physics ──
  centerForce: number;
  repelForce: number;
  linkForce: number;
  linkDistance: number;
  animate: boolean;
  damping: number;
  warmupTicks: number;

  // ── Color groups (path:/tag:/file: queries) ──
  colorGroups: Graph3DColorGroup[];
}

export interface Graph3DColorGroup {
  query: string;
  color: string;
}

export const DEFAULT_3D_SETTINGS: Graph3DSettings = {
  showTags: true,
  showAttachments: true,
  showOrphans: true,
  noteAppearance: { shape: 'sphere', size: 1.0, color: '#a8a8a8', opacity: 1.0 },
  attachmentAppearance: { shape: 'cube', size: 0.8, color: '#d4a843', opacity: 0.9 },
  tagAppearance: { shape: 'diamond', size: 0.6, color: '#6c9bcf', opacity: 0.85 },
  linkThickness: 0.5,
  linkOpacity: 0.3,
  showArrows: false,
  showLabels: true,
  labelScale: 1.0,
  centerForce: 0.05,
  repelForce: 200,
  linkForce: 0.2,
  linkDistance: 100,
  animate: true,
  damping: 0.88,
  warmupTicks: 60,
  colorGroups: [],
};

// ─── 3D Node colors (compatible with existing NodeColors) ───────────────────

export const DEFAULT_3D_NODE_COLORS: NodeColors = {
  note: '#a8a8a8',
  attachment: '#d4a843',
  tag: '#6c9bcf',
  unresolved: '#555555',
};

// ─── Focus highlight ────────────────────────────────────────────────────────

export interface FocusState3D {
  focusedNodeId: string | null;
  highlightedNeighborIds: Set<string>;
}

export const EMPTY_FOCUS: FocusState3D = {
  focusedNodeId: null,
  highlightedNeighborIds: new Set(),
};
