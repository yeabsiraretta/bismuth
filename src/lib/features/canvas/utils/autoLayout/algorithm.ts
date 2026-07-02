/**
 * Auto Layout Engine for Canvas Frames
 *
 * Computes child element positions within a frame that has auto layout enabled.
 * Mimics Figma's auto layout: direction, gap, padding, alignment.
 */

import type { CanvasElement, AutoLayout } from '@/features/canvas/types';

export interface LayoutResult {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_AUTO_LAYOUT: AutoLayout = {
  direction: 'vertical',
  gap: 0,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  alignItems: 'start',
  justifyContent: 'start',
};

/**
 * Computes positioned children for a frame with auto layout.
 * Returns new positions/sizes without mutating the originals.
 */
export function computeAutoLayout(frame: CanvasElement, children: CanvasElement[]): LayoutResult[] {
  const layout = frame.properties.autoLayout ?? DEFAULT_AUTO_LAYOUT;
  const { direction, gap, padding, alignItems, justifyContent } = layout;

  const contentWidth = frame.width - padding.left - padding.right;
  const contentHeight = frame.height - padding.top - padding.bottom;

  const isHorizontal = direction === 'horizontal';

  const totalMainSize = children.reduce(
    (sum, child) => sum + (isHorizontal ? child.width : child.height),
    0
  );
  const totalGap = Math.max(0, children.length - 1) * gap;

  let mainOffset = 0;
  const availableMain = (isHorizontal ? contentWidth : contentHeight) - totalMainSize - totalGap;

  switch (justifyContent) {
    case 'center':
      mainOffset = availableMain / 2;
      break;
    case 'end':
      mainOffset = availableMain;
      break;
    case 'space-between':
      mainOffset = 0;
      break;
    default:
      mainOffset = 0;
  }

  const effectiveGap =
    justifyContent === 'space-between' && children.length > 1
      ? (availableMain + totalGap) / (children.length - 1)
      : gap;

  const results: LayoutResult[] = [];
  let cursor = mainOffset;

  for (const child of children) {
    const childMainSize = isHorizontal ? child.width : child.height;
    const childCrossSize = isHorizontal ? child.height : child.width;
    const crossAvailable = isHorizontal ? contentHeight : contentWidth;

    let crossOffset = 0;
    let finalCrossSize = childCrossSize;

    switch (alignItems) {
      case 'center':
        crossOffset = (crossAvailable - childCrossSize) / 2;
        break;
      case 'end':
        crossOffset = crossAvailable - childCrossSize;
        break;
      case 'stretch':
        crossOffset = 0;
        finalCrossSize = crossAvailable;
        break;
      default:
        crossOffset = 0;
    }

    if (isHorizontal) {
      results.push({
        id: child.id,
        x: frame.x + padding.left + cursor,
        y: frame.y + padding.top + crossOffset,
        width: child.width,
        height: finalCrossSize,
      });
    } else {
      results.push({
        id: child.id,
        x: frame.x + padding.left + crossOffset,
        y: frame.y + padding.top + cursor,
        width: finalCrossSize,
        height: child.height,
      });
    }

    cursor += childMainSize + effectiveGap;
  }

  return results;
}

/**
 * Applies auto layout results to an element array (immutably).
 */
export function applyAutoLayout(elements: CanvasElement[], frame: CanvasElement): CanvasElement[] {
  if (!frame.properties.autoLayout) return elements;

  const children = elements
    .filter((el) => el.parentId === frame.id)
    .sort((a, b) => a.z_index - b.z_index);

  if (children.length === 0) return elements;

  const layoutResults = computeAutoLayout(frame, children);
  const resultMap = new Map(layoutResults.map((r) => [r.id, r]));

  return elements.map((el) => {
    const result = resultMap.get(el.id);
    if (!result) return el;
    return {
      ...el,
      x: result.x,
      y: result.y,
      width: result.width,
      height: result.height,
    };
  });
}

/**
 * Resizes a frame to fit its children (hug contents).
 */
export function hugContents(
  frame: CanvasElement,
  children: CanvasElement[]
): { width: number; height: number } {
  const layout = frame.properties.autoLayout ?? DEFAULT_AUTO_LAYOUT;
  const { direction, gap, padding } = layout;
  const isHorizontal = direction === 'horizontal';

  if (children.length === 0) {
    return {
      width: padding.left + padding.right,
      height: padding.top + padding.bottom,
    };
  }

  const totalMainSize = children.reduce(
    (sum, child) => sum + (isHorizontal ? child.width : child.height),
    0
  );
  const totalGap = Math.max(0, children.length - 1) * gap;
  const maxCrossSize = Math.max(
    ...children.map((child) => (isHorizontal ? child.height : child.width))
  );

  if (isHorizontal) {
    return {
      width: padding.left + totalMainSize + totalGap + padding.right,
      height: padding.top + maxCrossSize + padding.bottom,
    };
  } else {
    return {
      width: padding.left + maxCrossSize + padding.right,
      height: padding.top + totalMainSize + totalGap + padding.bottom,
    };
  }
}

/**
 * Creates a default auto layout configuration.
 */
export function createAutoLayout(
  direction: 'horizontal' | 'vertical' = 'vertical',
  gap = 8,
  padding = 16
): AutoLayout {
  return {
    direction,
    gap,
    padding: { top: padding, right: padding, bottom: padding, left: padding },
    alignItems: 'start',
    justifyContent: 'start',
  };
}
