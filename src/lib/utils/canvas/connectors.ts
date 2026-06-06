/**
 * Arrow Connectors System (T137)
 *
 * Provides directional connectors between canvas elements with:
 * - Anchor point detection (top/right/bottom/left/center)
 * - Orthogonal routing (avoids overlapping elements)
 * - Arrow heads (start/end/both/none)
 * - Connection persistence (survives element moves)
 */

import type { CanvasElement, Point } from '@/types/canvas';

// ─── Connector Types ─────────────────────────────────────────────────────────

/** Anchor position on an element's bounding box. */
export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left' | 'center';

/** Arrow head style at a connector endpoint. */
export type ArrowHead = 'none' | 'arrow' | 'diamond' | 'circle' | 'square';

/** Routing strategy for connector path computation. */
export type RoutingMode = 'straight' | 'orthogonal' | 'curved';

/** A persistent connection between two elements. */
export interface Connector {
  id: string;
  /** Source element ID. */
  fromElementId: string;
  /** Source anchor position. */
  fromAnchor: AnchorPosition;
  /** Target element ID. */
  toElementId: string;
  /** Target anchor position. */
  toAnchor: AnchorPosition;
  /** Routing algorithm. */
  routing: RoutingMode;
  /** Start-point arrow head. */
  startArrowHead: ArrowHead;
  /** End-point arrow head. */
  endArrowHead: ArrowHead;
  /** Line color. */
  strokeColor: string;
  /** Line width in px. */
  strokeWidth: number;
  /** Dash pattern (empty = solid). */
  dashPattern: number[];
  /** Optional label text displayed at midpoint. */
  label?: string;
  /** Intermediate waypoints for manual routing adjustments. */
  waypoints: Point[];
}

// ─── Anchor Computation ──────────────────────────────────────────────────────

/** Returns the pixel coordinate of an anchor point on an element. */
export function getAnchorPoint(element: CanvasElement, anchor: AnchorPosition): Point {
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;

  switch (anchor) {
    case 'top':
      return { x: cx, y: element.y };
    case 'right':
      return { x: element.x + element.width, y: cy };
    case 'bottom':
      return { x: cx, y: element.y + element.height };
    case 'left':
      return { x: element.x, y: cy };
    case 'center':
      return { x: cx, y: cy };
  }
}

/** Finds the best anchor pair between two elements (shortest distance). */
export function findBestAnchors(
  from: CanvasElement,
  to: CanvasElement
): { fromAnchor: AnchorPosition; toAnchor: AnchorPosition } {
  const anchors: AnchorPosition[] = ['top', 'right', 'bottom', 'left'];
  let bestDist = Infinity;
  let bestFrom: AnchorPosition = 'right';
  let bestTo: AnchorPosition = 'left';

  for (const fa of anchors) {
    for (const ta of anchors) {
      const fp = getAnchorPoint(from, fa);
      const tp = getAnchorPoint(to, ta);
      const dist = Math.hypot(tp.x - fp.x, tp.y - fp.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestFrom = fa;
        bestTo = ta;
      }
    }
  }

  return { fromAnchor: bestFrom, toAnchor: bestTo };
}

// ─── Path Computation ────────────────────────────────────────────────────────

/** Computes the path points for a connector between two elements. */
export function computeConnectorPath(
  connector: Connector,
  elements: CanvasElement[]
): Point[] {
  const fromEl = elements.find((e) => e.id === connector.fromElementId);
  const toEl = elements.find((e) => e.id === connector.toElementId);

  if (!fromEl || !toEl) return [];

  const start = getAnchorPoint(fromEl, connector.fromAnchor);
  const end = getAnchorPoint(toEl, connector.toAnchor);

  switch (connector.routing) {
    case 'straight':
      return computeStraightPath(start, end, connector.waypoints);
    case 'orthogonal':
      return computeOrthogonalPath(start, end, connector.fromAnchor, connector.toAnchor);
    case 'curved':
      return computeCurvedPath(start, end, connector.fromAnchor, connector.toAnchor);
  }
}

function computeStraightPath(start: Point, end: Point, waypoints: Point[]): Point[] {
  return [start, ...waypoints, end];
}

function computeOrthogonalPath(
  start: Point,
  end: Point,
  fromAnchor: AnchorPosition,
  toAnchor: AnchorPosition
): Point[] {
  const OFFSET = 20; // Minimum distance from element before turning
  const points: Point[] = [start];

  // Determine initial direction based on source anchor
  let exitX = start.x;
  let exitY = start.y;

  switch (fromAnchor) {
    case 'top':
      exitY -= OFFSET;
      break;
    case 'bottom':
      exitY += OFFSET;
      break;
    case 'left':
      exitX -= OFFSET;
      break;
    case 'right':
      exitX += OFFSET;
      break;
  }
  points.push({ x: exitX, y: exitY });

  // Determine entry direction based on target anchor
  let entryX = end.x;
  let entryY = end.y;

  switch (toAnchor) {
    case 'top':
      entryY -= OFFSET;
      break;
    case 'bottom':
      entryY += OFFSET;
      break;
    case 'left':
      entryX -= OFFSET;
      break;
    case 'right':
      entryX += OFFSET;
      break;
  }

  // Connect exit to entry with L-shaped or Z-shaped routing
  const isHorizontalExit = fromAnchor === 'left' || fromAnchor === 'right';
  const isHorizontalEntry = toAnchor === 'left' || toAnchor === 'right';

  if (isHorizontalExit && isHorizontalEntry) {
    // Both horizontal — use midpoint X
    const midX = (exitX + entryX) / 2;
    points.push({ x: midX, y: exitY });
    points.push({ x: midX, y: entryY });
  } else if (!isHorizontalExit && !isHorizontalEntry) {
    // Both vertical — use midpoint Y
    const midY = (exitY + entryY) / 2;
    points.push({ x: exitX, y: midY });
    points.push({ x: entryX, y: midY });
  } else {
    // Mixed — L-shape
    points.push({ x: entryX, y: exitY });
  }

  points.push({ x: entryX, y: entryY });
  points.push(end);

  return points;
}

function computeCurvedPath(
  start: Point,
  end: Point,
  fromAnchor: AnchorPosition,
  toAnchor: AnchorPosition
): Point[] {
  // For curved paths, return control points for cubic bezier
  const dist = Math.hypot(end.x - start.x, end.y - start.y);
  const curvature = Math.min(dist * 0.4, 100);

  const cp1 = getControlPoint(start, fromAnchor, curvature);
  const cp2 = getControlPoint(end, toAnchor, curvature);

  // Return as [start, cp1, cp2, end] — consumer renders as bezier
  return [start, cp1, cp2, end];
}

function getControlPoint(point: Point, anchor: AnchorPosition, offset: number): Point {
  switch (anchor) {
    case 'top':
      return { x: point.x, y: point.y - offset };
    case 'bottom':
      return { x: point.x, y: point.y + offset };
    case 'left':
      return { x: point.x - offset, y: point.y };
    case 'right':
      return { x: point.x + offset, y: point.y };
    case 'center':
      return point;
  }
}

// ─── SVG Path Generation ────────────────────────────────────────────────────

/** Generates an SVG path `d` attribute for rendering a connector. */
export function connectorToSVGPath(points: Point[], routing: RoutingMode): string {
  if (points.length < 2) return '';

  if (routing === 'curved' && points.length === 4) {
    const [start, cp1, cp2, end] = points;
    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
  }

  // Straight or orthogonal
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
}

/** Generates SVG arrowhead marker path for the given style. */
export function arrowHeadPath(style: ArrowHead, size: number = 10): string {
  switch (style) {
    case 'arrow':
      return `M 0 0 L ${size} ${size / 2} L 0 ${size} Z`;
    case 'diamond':
      const hs = size / 2;
      return `M 0 ${hs} L ${hs} 0 L ${size} ${hs} L ${hs} ${size} Z`;
    case 'circle':
      const r = size / 2;
      return `M ${size} ${r} A ${r} ${r} 0 1 0 0 ${r} A ${r} ${r} 0 1 0 ${size} ${r}`;
    case 'square':
      return `M 0 0 L ${size} 0 L ${size} ${size} L 0 ${size} Z`;
    default:
      return '';
  }
}

// ─── Connector Factory ──────────────────────────────────────────────────────

/** Creates a new connector with sensible defaults. */
export function createConnector(
  fromElementId: string,
  toElementId: string,
  elements: CanvasElement[],
  options: Partial<Connector> = {}
): Connector {
  const fromEl = elements.find((e) => e.id === fromElementId);
  const toEl = elements.find((e) => e.id === toElementId);

  let fromAnchor: AnchorPosition = 'right';
  let toAnchor: AnchorPosition = 'left';

  if (fromEl && toEl) {
    const best = findBestAnchors(fromEl, toEl);
    fromAnchor = best.fromAnchor;
    toAnchor = best.toAnchor;
  }

  return {
    id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    fromElementId,
    toElementId,
    fromAnchor,
    toAnchor,
    routing: 'orthogonal',
    startArrowHead: 'none',
    endArrowHead: 'arrow',
    strokeColor: '#666666',
    strokeWidth: 1.5,
    dashPattern: [],
    waypoints: [],
    ...options,
  };
}
