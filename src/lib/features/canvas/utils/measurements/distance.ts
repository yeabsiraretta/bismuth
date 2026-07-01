/**
 * Distance measurement calculations between canvas elements.
 */

import type { CanvasElement } from '@/features/canvas/types';
import type { Measurement } from './index';

function formatDistance(px: number): string {
  if (px === Math.floor(px)) return `${px}`;
  return px.toFixed(1);
}

/**
 * Computes distance measurements between two elements.
 * Returns horizontal and vertical measurements between nearest edges.
 */
export function measureBetween(a: CanvasElement, b: CanvasElement): Measurement[] {
  const measurements: Measurement[] = [];

  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  const aCenterX = a.x + a.width / 2;
  const aCenterY = a.y + a.height / 2;
  const bCenterX = b.x + b.width / 2;
  const bCenterY = b.y + b.height / 2;

  // Horizontal distance (gap between elements)
  if (aRight <= b.x) {
    const dist = b.x - aRight;
    const midY = (Math.max(a.y, b.y) + Math.min(aBottom, bBottom)) / 2;
    measurements.push({
      from: { x: aRight, y: midY },
      to: { x: b.x, y: midY },
      distance: dist,
      axis: 'horizontal',
      label: formatDistance(dist),
    });
  } else if (bRight <= a.x) {
    const dist = a.x - bRight;
    const midY = (Math.max(a.y, b.y) + Math.min(aBottom, bBottom)) / 2;
    measurements.push({
      from: { x: bRight, y: midY },
      to: { x: a.x, y: midY },
      distance: dist,
      axis: 'horizontal',
      label: formatDistance(dist),
    });
  }

  // Vertical distance (gap between elements)
  if (aBottom <= b.y) {
    const dist = b.y - aBottom;
    const midX = (Math.max(a.x, b.x) + Math.min(aRight, bRight)) / 2;
    measurements.push({
      from: { x: midX, y: aBottom },
      to: { x: midX, y: b.y },
      distance: dist,
      axis: 'vertical',
      label: formatDistance(dist),
    });
  } else if (bBottom <= a.y) {
    const dist = a.y - bBottom;
    const midX = (Math.max(a.x, b.x) + Math.min(aRight, bRight)) / 2;
    measurements.push({
      from: { x: midX, y: bBottom },
      to: { x: midX, y: a.y },
      distance: dist,
      axis: 'vertical',
      label: formatDistance(dist),
    });
  }

  // If overlapping, show center-to-center distance
  if (measurements.length === 0) {
    const horizDist = Math.abs(bCenterX - aCenterX);
    const vertDist = Math.abs(bCenterY - aCenterY);
    if (horizDist > 0) {
      measurements.push({
        from: { x: aCenterX, y: aCenterY },
        to: { x: bCenterX, y: aCenterY },
        distance: horizDist,
        axis: 'horizontal',
        label: formatDistance(horizDist),
      });
    }
    if (vertDist > 0) {
      measurements.push({
        from: { x: bCenterX, y: aCenterY },
        to: { x: bCenterX, y: bCenterY },
        distance: vertDist,
        axis: 'vertical',
        label: formatDistance(vertDist),
      });
    }
  }

  return measurements;
}

/**
 * Computes measurements from an element to its parent frame edges.
 * Shows padding/margin distances.
 */
export function measureToParent(element: CanvasElement, parent: CanvasElement): Measurement[] {
  const measurements: Measurement[] = [];

  const elRight = element.x + element.width;
  const elBottom = element.y + element.height;
  const parentRight = parent.x + parent.width;
  const parentBottom = parent.y + parent.height;

  // Left edge distance
  const leftDist = element.x - parent.x;
  if (leftDist > 0) {
    measurements.push({
      from: { x: parent.x, y: element.y + element.height / 2 },
      to: { x: element.x, y: element.y + element.height / 2 },
      distance: leftDist,
      axis: 'horizontal',
      label: formatDistance(leftDist),
    });
  }

  // Right edge distance
  const rightDist = parentRight - elRight;
  if (rightDist > 0) {
    measurements.push({
      from: { x: elRight, y: element.y + element.height / 2 },
      to: { x: parentRight, y: element.y + element.height / 2 },
      distance: rightDist,
      axis: 'horizontal',
      label: formatDistance(rightDist),
    });
  }

  // Top edge distance
  const topDist = element.y - parent.y;
  if (topDist > 0) {
    measurements.push({
      from: { x: element.x + element.width / 2, y: parent.y },
      to: { x: element.x + element.width / 2, y: element.y },
      distance: topDist,
      axis: 'vertical',
      label: formatDistance(topDist),
    });
  }

  // Bottom edge distance
  const bottomDist = parentBottom - elBottom;
  if (bottomDist > 0) {
    measurements.push({
      from: { x: element.x + element.width / 2, y: elBottom },
      to: { x: element.x + element.width / 2, y: parentBottom },
      distance: bottomDist,
      axis: 'vertical',
      label: formatDistance(bottomDist),
    });
  }

  return measurements;
}
