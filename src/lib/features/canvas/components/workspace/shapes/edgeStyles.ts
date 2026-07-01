/**
 * Edge style drawing helpers — arrow heads, dash patterns, pathfinding.
 * Used by drawArrow / drawLine in canvasShapeDrawing.ts.
 */

import type {
  ArrowHeadStyle,
  BorderStyle,
  EdgePathfinding,
} from '@/features/canvas/types/elements';
import type { Point } from '@/features/canvas/types/settings';

// ─── Arrow Heads ────────────────────────────────────────────────────────────

/** Draws an arrow head at (tipX, tipY) pointing in the direction of `angle`. */
export function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  style: ArrowHeadStyle,
  tipX: number,
  tipY: number,
  angle: number,
  size: number,
  color: string
): void {
  if (style === 'none') return;

  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  switch (style) {
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size, -size * 0.4);
      ctx.lineTo(-size, size * 0.4);
      ctx.closePath();
      ctx.fill();
      break;

    case 'triangle-outline':
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size, -size * 0.4);
      ctx.lineTo(-size, size * 0.4);
      ctx.closePath();
      ctx.stroke();
      break;

    case 'thin-triangle':
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size * 1.2, -size * 0.25);
      ctx.lineTo(-size * 1.2, size * 0.25);
      ctx.closePath();
      ctx.fill();
      break;

    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size * 0.6, -size * 0.35);
      ctx.lineTo(-size * 1.2, 0);
      ctx.lineTo(-size * 0.6, size * 0.35);
      ctx.closePath();
      ctx.fill();
      break;

    case 'diamond-outline':
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size * 0.6, -size * 0.35);
      ctx.lineTo(-size * 1.2, 0);
      ctx.lineTo(-size * 0.6, size * 0.35);
      ctx.closePath();
      ctx.stroke();
      break;

    case 'circle':
      ctx.beginPath();
      ctx.arc(-size * 0.5, 0, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'circle-outline':
      ctx.beginPath();
      ctx.arc(-size * 0.5, 0, size * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }

  ctx.restore();
}

// ─── Dash Patterns ──────────────────────────────────────────────────────────

/** Returns a canvas dash array for the given border/line style. */
export function getDashPattern(style: BorderStyle | string | undefined): number[] {
  switch (style) {
    case 'dashed':
      return [8, 4];
    case 'dotted':
      return [2, 4];
    case 'none':
      return [0, 1000]; // effectively invisible
    default:
      return [];
  }
}

// ─── Edge Pathfinding ───────────────────────────────────────────────────────

/**
 * Computes the path points between two endpoints using the given pathfinding
 * algorithm. Returns an array of points to draw through.
 */
export function computeEdgePath(
  method: EdgePathfinding | undefined,
  start: Point,
  end: Point
): Point[] {
  switch (method) {
    case 'orthogonal':
      return orthogonalPath(start, end);
    case 'curved':
      return curvedPath(start, end);
    case 'direct':
    default:
      return [start, end];
  }
}

/** Orthogonal (right-angle) path with a midpoint step. */
function orthogonalPath(start: Point, end: Point): Point[] {
  const midX = (start.x + end.x) / 2;
  return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
}

/** Curved path — returns control points for a cubic bezier (4 points). */
function curvedPath(start: Point, end: Point): Point[] {
  const dx = end.x - start.x;
  const cpOffset = Math.abs(dx) * 0.4 || 50;
  return [start, { x: start.x + cpOffset, y: start.y }, { x: end.x - cpOffset, y: end.y }, end];
}

/**
 * Draws an edge label centered on the midpoint of the path.
 */
export function drawEdgeLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  points: Point[],
  offsetX: number,
  offsetY: number
): void {
  if (!label) return;
  const mid = Math.floor(points.length / 2);
  const p = points[mid] || points[0];
  const mx = offsetX + p.x;
  const my = offsetY + p.y;

  ctx.save();
  ctx.font = '11px Inter, sans-serif';
  const metrics = ctx.measureText(label);
  const pad = 4;
  const tw = metrics.width + pad * 2;
  const th = 16;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(mx - tw / 2, my - th / 2, tw, th);

  ctx.fillStyle = '#18181b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, mx, my);
  ctx.restore();
}
