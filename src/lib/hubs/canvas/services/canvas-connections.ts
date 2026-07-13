import { getElementBounds } from '@/hubs/canvas/services/canvas-math';
import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';

// ── Types ────────────────────────────────────────────────────────

export type AnchorPosition = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'center';
export type ConnectionRouting = 'straight' | 'elbow' | 'bezier';
export type MarkerType = 'none' | 'arrow' | 'circle' | 'diamond';

export interface ConnectionElement {
  id: string;
  sourceId: string;
  targetId: string;
  sourceAnchor: AnchorPosition;
  targetAnchor: AnchorPosition;
  routing: ConnectionRouting;
  startMarker: MarkerType;
  endMarker: MarkerType;
  label: string;
  strokeColor: string;
  strokeWidth: number;
  strokeDash: number[];
}

export function createConnection(
  overrides: Partial<ConnectionElement> & { sourceId: string; targetId: string }
): ConnectionElement {
  return {
    id: crypto.randomUUID(),
    sourceAnchor: 'e',
    targetAnchor: 'w',
    routing: 'straight',
    startMarker: 'none',
    endMarker: 'arrow',
    label: '',
    strokeColor: 'var(--color-text-muted)',
    strokeWidth: 2,
    strokeDash: [],
    ...overrides,
  };
}

// ── Anchor position calculation ──────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export function getAnchorPoint(el: CanvasElement, anchor: AnchorPosition): Point {
  const b = getElementBounds(el);
  const mx = b.x + b.width / 2;
  const my = b.y + b.height / 2;
  switch (anchor) {
    case 'n':
      return { x: mx, y: b.y };
    case 'ne':
      return { x: b.x + b.width, y: b.y };
    case 'e':
      return { x: b.x + b.width, y: my };
    case 'se':
      return { x: b.x + b.width, y: b.y + b.height };
    case 's':
      return { x: mx, y: b.y + b.height };
    case 'sw':
      return { x: b.x, y: b.y + b.height };
    case 'w':
      return { x: b.x, y: my };
    case 'nw':
      return { x: b.x, y: b.y };
    case 'center':
      return { x: mx, y: my };
  }
}

const ALL_ANCHORS: AnchorPosition[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

export function getAnchorPoints(el: CanvasElement): { anchor: AnchorPosition; point: Point }[] {
  return ALL_ANCHORS.map((anchor) => ({ anchor, point: getAnchorPoint(el, anchor) }));
}

// ── Path computation ─────────────────────────────────────────────

export function computeStraightPath(start: Point, end: Point): string {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

export function computeElbowPath(
  start: Point,
  end: Point,
  sourceAnchor: AnchorPosition,
  targetAnchor: AnchorPosition
): string {
  const isHorizontalSource = sourceAnchor === 'e' || sourceAnchor === 'w';
  const isHorizontalTarget = targetAnchor === 'e' || targetAnchor === 'w';

  if (isHorizontalSource && isHorizontalTarget) {
    const midX = (start.x + end.x) / 2;
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  }
  if (!isHorizontalSource && !isHorizontalTarget) {
    const midY = (start.y + end.y) / 2;
    return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
  }
  if (isHorizontalSource) {
    return `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`;
  }
  return `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`;
}

export function computeBezierPath(start: Point, end: Point): string {
  const dx = Math.abs(end.x - start.x) * 0.5;
  const c1x = start.x + dx;
  const c2x = end.x - dx;
  return `M ${start.x} ${start.y} C ${c1x} ${start.y}, ${c2x} ${end.y}, ${end.x} ${end.y}`;
}

export function computePath(
  start: Point,
  end: Point,
  routing: ConnectionRouting,
  sourceAnchor: AnchorPosition,
  targetAnchor: AnchorPosition
): string {
  switch (routing) {
    case 'straight':
      return computeStraightPath(start, end);
    case 'elbow':
      return computeElbowPath(start, end, sourceAnchor, targetAnchor);
    case 'bezier':
      return computeBezierPath(start, end);
  }
}

// ── Label midpoint ───────────────────────────────────────────────

export function getPathMidpoint(start: Point, end: Point): Point {
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
}

// ── Nearest anchor ───────────────────────────────────────────────

export function findNearestAnchor(el: CanvasElement, point: Point): AnchorPosition {
  let best: AnchorPosition = 'center';
  let bestDist = Infinity;
  for (const anchor of ALL_ANCHORS) {
    const ap = getAnchorPoint(el, anchor);
    const dist = Math.hypot(ap.x - point.x, ap.y - point.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = anchor;
    }
  }
  return best;
}
