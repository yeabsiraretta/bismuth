// ── Semantic palette ─────────────────────────────────────────────
// Shared named colors used across canvas, calendar, graph, and tabs.
// These are JS-side constants for contexts where CSS vars are unavailable
// (canvas 2D context, Three.js materials, dynamic style attributes).

export const PALETTE = {
  red: '#dc2626',
  green: '#16a34a',
  blue: '#2563eb',
  amber: '#d97706',
  purple: '#7c3aed',
  gray: '#6b7280',
  teal: '#0891b2',
  indigo: '#6366f1',
  pink: '#ec4899',
  sky: '#0ea5e9',
} as const;

type PaletteKey = keyof typeof PALETTE;

// ── Ordered swatch sets ─────────────────────────────────────────
// Pre-built arrays for components that render color pickers/swatches.

export const SWATCH_COLORS = [
  PALETTE.red,
  PALETTE.green,
  PALETTE.blue,
  PALETTE.amber,
  PALETTE.purple,
  PALETTE.gray,
] as const;

export const TAB_GROUP_COLORS = [
  PALETTE.red,
  PALETTE.blue,
  PALETTE.green,
  PALETTE.amber,
  PALETTE.purple,
  PALETTE.teal,
] as const;

// ── Calendar category defaults ──────────────────────────────────
export const DEFAULT_CATEGORY_COLORS = {
  default: PALETTE.blue,
  work: PALETTE.red,
  personal: PALETTE.green,
  health: PALETTE.amber,
  study: PALETTE.indigo,
  other: PALETTE.gray,
} as const;

// ── Graph / 3D scene ────────────────────────────────────────────
export const GRAPH_COLORS = {
  node: '#e5e5e5',
  nodeHover: PALETTE.red,
  edge: '#555555',
  canvasBg: '#0a0a0a',
} as const;
