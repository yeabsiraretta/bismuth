/**
 * Flowchart node shape path functions.
 * Each function traces a path on the given context — caller fills/strokes.
 */

import type { NodeShape } from '@/features/canvas/types/elements';

/** Traces a pill (fully rounded) shape path. */
export function pillPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const r = Math.min(w, h) / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h / 2, h / 2, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
}

/** Traces a diamond (decision) shape path. */
export function diamondPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(x + w, cy);
  ctx.lineTo(cx, y + h);
  ctx.lineTo(x, cy);
  ctx.closePath();
}

/** Traces a parallelogram (I/O) shape path. */
export function parallelogramPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const skew = w * 0.2;
  ctx.beginPath();
  ctx.moveTo(x + skew, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - skew, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

/** Traces a hexagon shape path. */
export function hexagonPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const indent = w * 0.2;
  const cy = y + h / 2;
  ctx.beginPath();
  ctx.moveTo(x + indent, y);
  ctx.lineTo(x + w - indent, y);
  ctx.lineTo(x + w, cy);
  ctx.lineTo(x + w - indent, y + h);
  ctx.lineTo(x + indent, y + h);
  ctx.lineTo(x, cy);
  ctx.closePath();
}

/** Traces a stadium (rounded rect with semicircle ends, wider than pill). */
export function stadiumPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + r, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
}

/** Traces a cylinder (database) shape path — body + top ellipse. */
export function cylinderPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const ellipseH = h * 0.15;

  // Body
  ctx.beginPath();
  ctx.moveTo(x, y + ellipseH);
  ctx.lineTo(x, y + h - ellipseH);
  ctx.ellipse(x + w / 2, y + h - ellipseH, w / 2, ellipseH, 0, Math.PI, 0, true);
  ctx.lineTo(x + w, y + ellipseH);
  ctx.ellipse(x + w / 2, y + ellipseH, w / 2, ellipseH, 0, 0, Math.PI, true);
  ctx.closePath();
}

/** Traces the top ellipse cap of a cylinder (drawn separately for fill layering). */
export function cylinderTopPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const ellipseH = h * 0.15;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + ellipseH, w / 2, ellipseH, 0, 0, Math.PI * 2);
  ctx.closePath();
}

/** Traces a document (wavy bottom) shape path. */
export function documentPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const waveH = h * 0.1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - waveH);
  // Wavy bottom edge
  ctx.bezierCurveTo(
    x + w * 0.75, y + h - waveH * 3,
    x + w * 0.25, y + h + waveH,
    x, y + h - waveH,
  );
  ctx.closePath();
}

/** Traces a predefined process (double-walled rectangle) outer path. */
export function predefinedProcessPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
}

/** Draws the inner vertical dividers for a predefined process shape. */
export function predefinedProcessDividers(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const inset = w * 0.1;
  ctx.beginPath();
  ctx.moveTo(x + inset, y);
  ctx.lineTo(x + inset, y + h);
  ctx.moveTo(x + w - inset, y);
  ctx.lineTo(x + w - inset, y + h);
  ctx.stroke();
}

/**
 * Traces the node shape path for a given shape type.
 * Falls back to a rounded rect for 'rectangle' or unknown shapes.
 */
export function traceNodeShape(
  ctx: CanvasRenderingContext2D,
  shape: NodeShape | undefined,
  x: number, y: number, w: number, h: number,
  radius: number,
): void {
  switch (shape) {
    case 'pill':
    case 'stadium':
      stadiumPath(ctx, x, y, w, h);
      break;
    case 'diamond':
      diamondPath(ctx, x, y, w, h);
      break;
    case 'parallelogram':
      parallelogramPath(ctx, x, y, w, h);
      break;
    case 'hexagon':
      hexagonPath(ctx, x, y, w, h);
      break;
    case 'cylinder':
      cylinderPath(ctx, x, y, w, h);
      break;
    case 'document':
      documentPath(ctx, x, y, w, h);
      break;
    case 'predefined-process':
      predefinedProcessPath(ctx, x, y, w, h);
      break;
    case 'circle': {
      const r = Math.min(w, h) / 2;
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      break;
    }
    default:
      // Fallback: rounded rectangle
      roundedRectPath(ctx, x, y, w, h, radius);
      break;
  }
}

/** Standalone rounded rect path tracer (avoids importing from canvasShapeDrawing). */
function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
