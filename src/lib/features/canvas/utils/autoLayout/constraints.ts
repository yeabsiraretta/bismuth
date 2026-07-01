/**
 * CSS Grid Layout Engine (T144)
 *
 * Computes grid cell positions for children within a grid-layout frame.
 */

import type { CanvasElement } from '@/features/canvas/types';
import type { LayoutResult } from '@/features/canvas/utils/autoLayout/algorithm';

/** Grid layout configuration for a frame. */
export interface GridLayout {
  /** Number of columns (or 'auto-fill'/'auto-fit' with minWidth). */
  columns: number | { mode: 'auto-fill' | 'auto-fit'; minWidth: number };
  /** Number of rows (0 = auto based on content). */
  rows: number;
  /** Gap between grid cells in px. */
  gap: number;
  /** Column gap override (uses gap if not set). */
  columnGap?: number;
  /** Row gap override (uses gap if not set). */
  rowGap?: number;
  /** Padding inside the grid container. */
  padding: { top: number; right: number; bottom: number; left: number };
  /** How cells align within their grid area. */
  alignItems: 'start' | 'center' | 'end' | 'stretch';
  /** How cells distribute along the inline axis. */
  justifyItems: 'start' | 'center' | 'end' | 'stretch';
}

/** Grid placement for a single child element. */
export interface GridPlacement {
  /** Column start (1-based). */
  colStart: number;
  /** Column span. */
  colSpan: number;
  /** Row start (1-based). */
  rowStart: number;
  /** Row span. */
  rowSpan: number;
}

/**
 * Computes grid cell positions for children within a grid-layout frame.
 * Children are placed in order unless they have explicit GridPlacement.
 */
export function computeGridLayout(
  frame: CanvasElement,
  children: CanvasElement[],
  gridConfig: GridLayout,
  placements?: Map<string, GridPlacement>
): LayoutResult[] {
  const { gap, padding, alignItems, justifyItems } = gridConfig;
  const colGap = gridConfig.columnGap ?? gap;
  const rowGap = gridConfig.rowGap ?? gap;

  const contentWidth = frame.width - padding.left - padding.right;
  const contentHeight = frame.height - padding.top - padding.bottom;

  let numCols: number;
  if (typeof gridConfig.columns === 'number') {
    numCols = gridConfig.columns;
  } else {
    const { minWidth } = gridConfig.columns;
    numCols = Math.max(1, Math.floor((contentWidth + colGap) / (minWidth + colGap)));
  }

  const numRows = gridConfig.rows > 0
    ? gridConfig.rows
    : Math.ceil(children.length / numCols);

  const cellWidth = (contentWidth - (numCols - 1) * colGap) / numCols;
  const cellHeight = (contentHeight - (numRows - 1) * rowGap) / numRows;

  const occupied = new Set<string>();
  const results: LayoutResult[] = [];

  const explicitChildren: CanvasElement[] = [];
  const autoChildren: CanvasElement[] = [];

  for (const child of children) {
    if (placements?.has(child.id)) {
      explicitChildren.push(child);
    } else {
      autoChildren.push(child);
    }
  }

  for (const child of explicitChildren) {
    const placement = placements!.get(child.id)!;
    for (let r = placement.rowStart; r < placement.rowStart + placement.rowSpan; r++) {
      for (let c = placement.colStart; c < placement.colStart + placement.colSpan; c++) {
        occupied.add(`${r},${c}`);
      }
    }
    results.push(computeGridCellPosition(
      frame, child, placement, cellWidth, cellHeight, colGap, rowGap, padding, alignItems, justifyItems
    ));
  }

  let autoRow = 1;
  let autoCol = 1;

  for (const child of autoChildren) {
    while (occupied.has(`${autoRow},${autoCol}`)) {
      autoCol++;
      if (autoCol > numCols) {
        autoCol = 1;
        autoRow++;
      }
    }

    const placement: GridPlacement = {
      colStart: autoCol,
      colSpan: 1,
      rowStart: autoRow,
      rowSpan: 1,
    };

    occupied.add(`${autoRow},${autoCol}`);
    results.push(computeGridCellPosition(
      frame, child, placement, cellWidth, cellHeight, colGap, rowGap, padding, alignItems, justifyItems
    ));

    autoCol++;
    if (autoCol > numCols) {
      autoCol = 1;
      autoRow++;
    }
  }

  return results;
}

function computeGridCellPosition(
  frame: CanvasElement,
  child: CanvasElement,
  placement: GridPlacement,
  cellWidth: number,
  cellHeight: number,
  colGap: number,
  rowGap: number,
  padding: { top: number; right: number; bottom: number; left: number },
  alignItems: string,
  justifyItems: string
): LayoutResult {
  const areaX = frame.x + padding.left + (placement.colStart - 1) * (cellWidth + colGap);
  const areaY = frame.y + padding.top + (placement.rowStart - 1) * (cellHeight + rowGap);
  const areaWidth = placement.colSpan * cellWidth + (placement.colSpan - 1) * colGap;
  const areaHeight = placement.rowSpan * cellHeight + (placement.rowSpan - 1) * rowGap;

  let x = areaX;
  let y = areaY;
  let width = child.width;
  let height = child.height;

  switch (justifyItems) {
    case 'center':
      x = areaX + (areaWidth - width) / 2;
      break;
    case 'end':
      x = areaX + areaWidth - width;
      break;
    case 'stretch':
      x = areaX;
      width = areaWidth;
      break;
    default:
      x = areaX;
  }

  switch (alignItems) {
    case 'center':
      y = areaY + (areaHeight - height) / 2;
      break;
    case 'end':
      y = areaY + areaHeight - height;
      break;
    case 'stretch':
      y = areaY;
      height = areaHeight;
      break;
    default:
      y = areaY;
  }

  return { id: child.id, x, y, width, height };
}

/**
 * Creates a default grid layout configuration.
 */
export function createGridLayout(
  columns: number = 3,
  gap: number = 16,
  padding: number = 16
): GridLayout {
  return {
    columns,
    rows: 0,
    gap,
    padding: { top: padding, right: padding, bottom: padding, left: padding },
    alignItems: 'stretch',
    justifyItems: 'stretch',
  };
}
