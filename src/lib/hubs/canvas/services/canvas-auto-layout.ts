/**
 * Canvas Auto-Layout Engine — Figma-style auto-layout for Frame elements.
 *
 * Computes child positions based on direction, padding, gap, alignment,
 * and per-child sizing mode (fixed, fill, hug).
 * Pure functions, no side effects.
 */

import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';

// ── Auto-layout types ─────────────────────────────────────────────────────────

type LayoutDirection = 'horizontal' | 'vertical' | 'wrap';
type LayoutAlign = 'start' | 'center' | 'end' | 'stretch' | 'space-between';
type LayoutSizing = 'fixed' | 'hug' | 'fill';

export interface LayoutPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AutoLayoutConfig {
  direction: LayoutDirection;
  gap: number;
  padding: LayoutPadding;
  primaryAlign: LayoutAlign;
  counterAlign: LayoutAlign;
  clipContent: boolean;
}

export interface ChildLayoutOverride {
  elementId: string;
  widthMode: LayoutSizing;
  heightMode: LayoutSizing;
  alignSelf?: LayoutAlign;
}

export const DEFAULT_PADDING: LayoutPadding = { top: 16, right: 16, bottom: 16, left: 16 };

export const DEFAULT_AUTO_LAYOUT: AutoLayoutConfig = {
  direction: 'vertical',
  gap: 8,
  padding: { ...DEFAULT_PADDING },
  primaryAlign: 'start',
  counterAlign: 'start',
  clipContent: true,
};

// ── Constraint types (for non-auto-layout frames) ─────────────────────────────

type ConstraintAxis = 'left' | 'right' | 'center' | 'stretch' | 'scale';
type ConstraintVertical = 'top' | 'bottom' | 'center' | 'stretch' | 'scale';

export interface Constraints {
  horizontal: ConstraintAxis;
  vertical: ConstraintVertical;
}

export const DEFAULT_CONSTRAINTS: Constraints = {
  horizontal: 'left',
  vertical: 'top',
};

// ── Layout result ─────────────────────────────────────────────────────────────

export interface LayoutResult {
  elementId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Auto-layout computation ───────────────────────────────────────────────────

export function computeAutoLayout(
  config: AutoLayoutConfig,
  frameWidth: number,
  frameHeight: number,
  children: CanvasElement[],
  overrides: ChildLayoutOverride[] = []
): LayoutResult[] {
  if (children.length === 0) return [];

  const overrideMap = new Map(overrides.map((o) => [o.elementId, o]));
  const { padding, gap, direction, primaryAlign, counterAlign } = config;

  const contentWidth = frameWidth - padding.left - padding.right;
  const contentHeight = frameHeight - padding.top - padding.bottom;

  if (direction === 'wrap') {
    return computeWrapLayout(config, padding, contentWidth, contentHeight, children, overrideMap);
  }

  const isHorizontal = direction === 'horizontal';
  const primarySize = isHorizontal ? contentWidth : contentHeight;
  const counterSize = isHorizontal ? contentHeight : contentWidth;

  const results: LayoutResult[] = [];
  const childSizes = children.map((child) => {
    const ov = overrideMap.get(child.id);
    const wMode = ov?.widthMode ?? 'fixed';
    const hMode = ov?.heightMode ?? 'fixed';
    return {
      id: child.id,
      w: wMode === 'fixed' ? child.width : child.width,
      h: hMode === 'fixed' ? child.height : child.height,
      wMode,
      hMode,
      alignSelf: ov?.alignSelf,
    };
  });

  // Calculate fill distribution
  const totalGap = gap * (children.length - 1);
  const fixedTotal = childSizes.reduce((sum, c) => {
    const mode = isHorizontal ? c.wMode : c.hMode;
    return sum + (mode === 'fill' ? 0 : isHorizontal ? c.w : c.h);
  }, 0);
  const fillCount = childSizes.filter((c) => (isHorizontal ? c.wMode : c.hMode) === 'fill').length;
  const fillSize =
    fillCount > 0 ? Math.max(0, (primarySize - fixedTotal - totalGap) / fillCount) : 0;

  // Compute total used space for alignment
  const totalUsed =
    childSizes.reduce((sum, c) => {
      const mode = isHorizontal ? c.wMode : c.hMode;
      return sum + (mode === 'fill' ? fillSize : isHorizontal ? c.w : c.h);
    }, 0) + totalGap;

  // Primary axis offset
  let primaryOffset: number;
  switch (primaryAlign) {
    case 'start':
      primaryOffset = 0;
      break;
    case 'center':
      primaryOffset = (primarySize - totalUsed) / 2;
      break;
    case 'end':
      primaryOffset = primarySize - totalUsed;
      break;
    case 'space-between':
      primaryOffset = 0;
      break;
    default:
      primaryOffset = 0;
  }

  const spaceBetweenGap =
    primaryAlign === 'space-between' && children.length > 1
      ? (primarySize - (totalUsed - totalGap)) / (children.length - 1)
      : gap;

  let cursor = primaryOffset;
  for (const c of childSizes) {
    const pMode = isHorizontal ? c.wMode : c.hMode;
    const cMode = isHorizontal ? c.hMode : c.wMode;
    const pSize = pMode === 'fill' ? fillSize : isHorizontal ? c.w : c.h;
    let cSize = cMode === 'fill' ? counterSize : isHorizontal ? c.h : c.w;

    // Counter-axis alignment
    const align = c.alignSelf ?? counterAlign;
    let counterOffset: number;
    if (align === 'stretch') {
      cSize = counterSize;
      counterOffset = 0;
    } else {
      switch (align) {
        case 'start':
          counterOffset = 0;
          break;
        case 'center':
          counterOffset = (counterSize - cSize) / 2;
          break;
        case 'end':
          counterOffset = counterSize - cSize;
          break;
        default:
          counterOffset = 0;
      }
    }

    if (isHorizontal) {
      results.push({
        elementId: c.id,
        x: padding.left + cursor,
        y: padding.top + counterOffset,
        width: pSize,
        height: cSize,
      });
    } else {
      results.push({
        elementId: c.id,
        x: padding.left + counterOffset,
        y: padding.top + cursor,
        width: cSize,
        height: pSize,
      });
    }

    cursor += pSize + spaceBetweenGap;
  }

  return results;
}

// ── Wrap layout ───────────────────────────────────────────────────────────────

function computeWrapLayout(
  config: AutoLayoutConfig,
  padding: LayoutPadding,
  contentWidth: number,
  contentHeight: number,
  children: CanvasElement[],
  overrideMap: Map<string, ChildLayoutOverride>
): LayoutResult[] {
  const { gap } = config;
  const results: LayoutResult[] = [];

  let x = 0;
  let y = 0;
  let rowHeight = 0;

  for (const child of children) {
    const ov = overrideMap.get(child.id);
    const w = ov?.widthMode === 'fill' ? contentWidth : child.width;
    const h = child.height;

    if (x + w > contentWidth && x > 0) {
      x = 0;
      y += rowHeight + gap;
      rowHeight = 0;
    }

    results.push({
      elementId: child.id,
      x: padding.left + x,
      y: padding.top + y,
      width: w,
      height: h,
    });

    x += w + gap;
    rowHeight = Math.max(rowHeight, h);
  }

  void contentHeight;
  return results;
}

// ── Constraint-based layout ───────────────────────────────────────────────────

export function applyConstraints(
  constraints: Constraints,
  child: { x: number; y: number; width: number; height: number },
  parentWidth: number,
  parentHeight: number,
  prevParentWidth: number,
  prevParentHeight: number
): { x: number; y: number; width: number; height: number } {
  const dw = parentWidth - prevParentWidth;
  const dh = parentHeight - prevParentHeight;
  let { x, y, width, height } = child;

  switch (constraints.horizontal) {
    case 'left':
      break;
    case 'right':
      x += dw;
      break;
    case 'center':
      x += dw / 2;
      break;
    case 'stretch':
      width += dw;
      break;
    case 'scale': {
      const ratio = parentWidth / prevParentWidth;
      x *= ratio;
      width *= ratio;
      break;
    }
  }

  switch (constraints.vertical) {
    case 'top':
      break;
    case 'bottom':
      y += dh;
      break;
    case 'center':
      y += dh / 2;
      break;
    case 'stretch':
      height += dh;
      break;
    case 'scale': {
      const ratio = parentHeight / prevParentHeight;
      y *= ratio;
      height *= ratio;
      break;
    }
  }

  return { x, y, width: Math.max(1, width), height: Math.max(1, height) };
}

// ── Hug content sizing ────────────────────────────────────────────────────────

export function computeHugSize(
  config: AutoLayoutConfig,
  children: CanvasElement[]
): { width: number; height: number } {
  if (children.length === 0) {
    return {
      width: config.padding.left + config.padding.right,
      height: config.padding.top + config.padding.bottom,
    };
  }

  const { direction, gap, padding } = config;
  const isHorizontal = direction === 'horizontal';

  let primaryTotal = 0;
  let counterMax = 0;

  for (const child of children) {
    const pSize = isHorizontal ? child.width : child.height;
    const cSize = isHorizontal ? child.height : child.width;
    primaryTotal += pSize;
    counterMax = Math.max(counterMax, cSize);
  }

  primaryTotal += gap * (children.length - 1);

  if (isHorizontal) {
    return {
      width: padding.left + primaryTotal + padding.right,
      height: padding.top + counterMax + padding.bottom,
    };
  }
  return {
    width: padding.left + counterMax + padding.right,
    height: padding.top + primaryTotal + padding.bottom,
  };
}
