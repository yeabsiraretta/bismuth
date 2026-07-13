import { type BoundingBox, getElementBounds } from '@/hubs/canvas/services/canvas-math';
import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';

// ── Grid config ──────────────────────────────────────────────────

export interface GridConfig {
  enabled: boolean;
  size: number;
  snapEnabled: boolean;
  color: string;
  opacity: number;
}

export const DEFAULT_GRID: GridConfig = {
  enabled: false,
  size: 20,
  snapEnabled: false,
  color: 'var(--color-border)',
  opacity: 0.3,
};

// ── Snap to grid ─────────────────────────────────────────────────

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPoint(x: number, y: number, gridSize: number): { x: number; y: number } {
  return { x: snapToGrid(x, gridSize), y: snapToGrid(y, gridSize) };
}

// ── Smart guides ─────────────────────────────────────────────────

export interface SmartGuide {
  axis: 'x' | 'y';
  position: number;
}

const GUIDE_THRESHOLD = 5;

export function getSmartGuides(
  dragBounds: BoundingBox,
  otherElements: CanvasElement[],
  threshold = GUIDE_THRESHOLD
): SmartGuide[] {
  const guides: SmartGuide[] = [];
  const dragCX = dragBounds.x + dragBounds.width / 2;
  const dragCY = dragBounds.y + dragBounds.height / 2;
  const dragEdges = {
    left: dragBounds.x,
    right: dragBounds.x + dragBounds.width,
    top: dragBounds.y,
    bottom: dragBounds.y + dragBounds.height,
    cx: dragCX,
    cy: dragCY,
  };

  for (const el of otherElements) {
    const b = getElementBounds(el);
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    const edges = { left: b.x, right: b.x + b.width, top: b.y, bottom: b.y + b.height, cx, cy };

    for (const dv of [dragEdges.left, dragEdges.right, dragEdges.cx]) {
      for (const ev of [edges.left, edges.right, edges.cx]) {
        if (Math.abs(dv - ev) <= threshold) guides.push({ axis: 'x', position: ev });
      }
    }
    for (const dv of [dragEdges.top, dragEdges.bottom, dragEdges.cy]) {
      for (const ev of [edges.top, edges.bottom, edges.cy]) {
        if (Math.abs(dv - ev) <= threshold) guides.push({ axis: 'y', position: ev });
      }
    }
  }

  const uniqueX = [...new Set(guides.filter((g) => g.axis === 'x').map((g) => g.position))];
  const uniqueY = [...new Set(guides.filter((g) => g.axis === 'y').map((g) => g.position))];
  return [
    ...uniqueX.map((p) => ({ axis: 'x' as const, position: p })),
    ...uniqueY.map((p) => ({ axis: 'y' as const, position: p })),
  ];
}

// ── Alignment ────────────────────────────────────────────────────

export type AlignDirection = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom';

export function computeAlignment(
  elements: CanvasElement[],
  direction: AlignDirection
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  if (elements.length < 2) return result;

  const bounds = elements.map((el) => ({ id: el.id, b: getElementBounds(el) }));

  let target: number;
  switch (direction) {
    case 'left':
      target = Math.min(...bounds.map((e) => e.b.x));
      break;
    case 'right':
      target = Math.max(...bounds.map((e) => e.b.x + e.b.width));
      break;
    case 'center-x': {
      const all = bounds.map((e) => e.b.x + e.b.width / 2);
      target = (Math.min(...all) + Math.max(...all)) / 2;
      break;
    }
    case 'top':
      target = Math.min(...bounds.map((e) => e.b.y));
      break;
    case 'bottom':
      target = Math.max(...bounds.map((e) => e.b.y + e.b.height));
      break;
    case 'center-y': {
      const all = bounds.map((e) => e.b.y + e.b.height / 2);
      target = (Math.min(...all) + Math.max(...all)) / 2;
      break;
    }
  }

  for (const { id, b } of bounds) {
    let x = b.x,
      y = b.y;
    switch (direction) {
      case 'left':
        x = target;
        break;
      case 'right':
        x = target - b.width;
        break;
      case 'center-x':
        x = target - b.width / 2;
        break;
      case 'top':
        y = target;
        break;
      case 'bottom':
        y = target - b.height;
        break;
      case 'center-y':
        y = target - b.height / 2;
        break;
    }
    result.set(id, { x, y });
  }
  return result;
}

// ── Distribution ─────────────────────────────────────────────────

export type DistributeDirection = 'horizontal' | 'vertical';

export function computeDistribution(
  elements: CanvasElement[],
  direction: DistributeDirection
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  if (elements.length < 3) return result;

  const bounds = elements.map((el) => ({ id: el.id, b: getElementBounds(el) }));

  if (direction === 'horizontal') {
    bounds.sort((a, b) => a.b.x - b.b.x);
    const first = bounds[0].b.x;
    const last = bounds[bounds.length - 1].b.x + bounds[bounds.length - 1].b.width;
    const totalWidth = bounds.reduce((sum, e) => sum + e.b.width, 0);
    const gap = (last - first - totalWidth) / (bounds.length - 1);
    let cx = first;
    for (const { id, b } of bounds) {
      result.set(id, { x: cx, y: b.y });
      cx += b.width + gap;
    }
  } else {
    bounds.sort((a, b) => a.b.y - b.b.y);
    const first = bounds[0].b.y;
    const last = bounds[bounds.length - 1].b.y + bounds[bounds.length - 1].b.height;
    const totalHeight = bounds.reduce((sum, e) => sum + e.b.height, 0);
    const gap = (last - first - totalHeight) / (bounds.length - 1);
    let cy = first;
    for (const { id, b } of bounds) {
      result.set(id, { x: b.x, y: cy });
      cy += b.height + gap;
    }
  }
  return result;
}
