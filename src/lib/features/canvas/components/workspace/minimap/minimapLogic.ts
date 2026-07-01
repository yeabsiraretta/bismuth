import type { CanvasElement, Viewport } from '@/features/canvas/types';

/** Bounding box in canvas coordinates encompassing all elements. */
export interface MinimapBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/** Dimensions of the minimap widget in pixels. */
export interface MinimapSize {
  width: number;
  height: number;
}

/** Rectangle representing the visible viewport on the minimap. */
export interface MinimapViewportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PADDING = 50;

/**
 * Calculates the bounding box of all elements with padding.
 * Returns null if there are no elements.
 */
export function calculateMinimapBounds(elements: CanvasElement[]): MinimapBounds | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  minX -= PADDING;
  minY -= PADDING;
  maxX += PADDING;
  maxY += PADDING;

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Maps the current canvas viewport to a rectangle within the minimap.
 * The returned rect is in minimap-local pixel coordinates.
 */
export function viewportToMinimap(
  viewport: Viewport,
  bounds: MinimapBounds,
  minimapSize: MinimapSize,
  canvasSize: { width: number; height: number }
): MinimapViewportRect {
  const scaleX = minimapSize.width / bounds.width;
  const scaleY = minimapSize.height / bounds.height;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (minimapSize.width - bounds.width * scale) / 2;
  const offsetY = (minimapSize.height - bounds.height * scale) / 2;

  const visibleLeft = -viewport.x / viewport.scale;
  const visibleTop = -viewport.y / viewport.scale;
  const visibleWidth = canvasSize.width / viewport.scale;
  const visibleHeight = canvasSize.height / viewport.scale;

  return {
    x: offsetX + (visibleLeft - bounds.minX) * scale,
    y: offsetY + (visibleTop - bounds.minY) * scale,
    width: visibleWidth * scale,
    height: visibleHeight * scale,
  };
}

/**
 * Converts a click position on the minimap to a canvas-space center point.
 * Returns the viewport offset (x, y) needed to center on that point.
 */
export function minimapToViewport(
  clickX: number,
  clickY: number,
  bounds: MinimapBounds,
  minimapSize: MinimapSize,
  canvasSize: { width: number; height: number },
  currentScale: number
): { x: number; y: number } {
  const scaleX = minimapSize.width / bounds.width;
  const scaleY = minimapSize.height / bounds.height;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (minimapSize.width - bounds.width * scale) / 2;
  const offsetY = (minimapSize.height - bounds.height * scale) / 2;

  const canvasX = bounds.minX + (clickX - offsetX) / scale;
  const canvasY = bounds.minY + (clickY - offsetY) / scale;

  return {
    x: -(canvasX * currentScale) + canvasSize.width / 2,
    y: -(canvasY * currentScale) + canvasSize.height / 2,
  };
}
