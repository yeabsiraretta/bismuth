import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';

// ── Bounding box ─────────────────────────────────────────────────

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getElementBounds(el: CanvasElement): BoundingBox {
  if (el.kind === 'line') {
    const minX = Math.min(el.x, el.x2);
    const minY = Math.min(el.y, el.y2);
    return {
      x: minX,
      y: minY,
      width: Math.abs(el.x2 - el.x),
      height: Math.abs(el.y2 - el.y),
    };
  }
  return { x: el.x, y: el.y, width: el.width, height: el.height };
}

export function getSelectionBounds(elements: CanvasElement[]): BoundingBox | null {
  if (elements.length === 0) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const el of elements) {
    const b = getElementBounds(el);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// ── Handle positions ─────────────────────────────────────────────

export type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const ALL_HANDLES: HandlePosition[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export interface HandleCoord {
  handle: HandlePosition;
  x: number;
  y: number;
}

export function getHandleCoords(box: BoundingBox): HandleCoord[] {
  const { x, y, width: w, height: h } = box;
  const mx = x + w / 2;
  const my = y + h / 2;
  return [
    { handle: 'nw', x, y },
    { handle: 'n', x: mx, y },
    { handle: 'ne', x: x + w, y },
    { handle: 'e', x: x + w, y: my },
    { handle: 'se', x: x + w, y: y + h },
    { handle: 's', x: mx, y: y + h },
    { handle: 'sw', x, y: y + h },
    { handle: 'w', x, y: my },
  ];
}

// ── Resize math ──────────────────────────────────────────────────

const MIN_SIZE = 10;

export interface ResizeResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeResize(
  original: BoundingBox,
  handle: HandlePosition,
  dx: number,
  dy: number,
  lockAspect: boolean
): ResizeResult {
  let { x, y, width, height } = original;

  switch (handle) {
    case 'nw':
      x += dx;
      y += dy;
      width -= dx;
      height -= dy;
      break;
    case 'n':
      y += dy;
      height -= dy;
      break;
    case 'ne':
      width += dx;
      y += dy;
      height -= dy;
      break;
    case 'e':
      width += dx;
      break;
    case 'se':
      width += dx;
      height += dy;
      break;
    case 's':
      height += dy;
      break;
    case 'sw':
      x += dx;
      width -= dx;
      height += dy;
      break;
    case 'w':
      x += dx;
      width -= dx;
      break;
  }

  if (lockAspect && original.width > 0 && original.height > 0) {
    const aspect = original.width / original.height;
    const isVertical = handle === 'n' || handle === 's';
    const isHorizontal = handle === 'e' || handle === 'w';
    if (isVertical) {
      width = height * aspect;
    } else if (isHorizontal) {
      height = width / aspect;
    } else {
      if (Math.abs(dx) > Math.abs(dy)) {
        height = width / aspect;
      } else {
        width = height * aspect;
      }
    }
    if (handle === 'nw' || handle === 'sw' || handle === 'w') {
      x = original.x + original.width - width;
    }
    if (handle === 'nw' || handle === 'ne' || handle === 'n') {
      y = original.y + original.height - height;
    }
  }

  if (width < MIN_SIZE) {
    width = MIN_SIZE;
  }
  if (height < MIN_SIZE) {
    height = MIN_SIZE;
  }

  return { x, y, width, height };
}

// ── Rotation math ────────────────────────────────────────────────

export function computeRotation(
  centerX: number,
  centerY: number,
  pointerX: number,
  pointerY: number,
  snap: boolean
): number {
  const rad = Math.atan2(pointerY - centerY, pointerX - centerX);
  let deg = ((rad * 180) / Math.PI + 90 + 360) % 360;
  if (snap) {
    deg = Math.round(deg / 15) * 15;
  }
  return deg;
}

// ── Marquee intersection ─────────────────────────────────────────

export function boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function getElementsInMarquee(
  elements: CanvasElement[],
  marquee: BoundingBox
): CanvasElement[] {
  return elements.filter((el) => {
    if (el.locked) return false;
    return boxesIntersect(getElementBounds(el), marquee);
  });
}

// ── Cursor for handle ────────────────────────────────────────────

export function handleCursor(handle: HandlePosition): string {
  const cursors: Record<HandlePosition, string> = {
    nw: 'nwse-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    e: 'ew-resize',
    se: 'nwse-resize',
    s: 'ns-resize',
    sw: 'nesw-resize',
    w: 'ew-resize',
  };
  return cursors[handle];
}
