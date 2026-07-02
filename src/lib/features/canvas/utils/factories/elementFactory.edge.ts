/** Edge and path element factory functions — lines, arrows, freehand pen paths. */
import type { CanvasElement } from '@/features/canvas/types';
import { generateId } from '@/utils/id';

function edgeBounds(x1: number, y1: number, x2: number, y2: number) {
  return { minX: Math.min(x1, x2), minY: Math.min(y1, y2) };
}

export function createLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  layerId: string
): CanvasElement {
  const { minX, minY } = edgeBounds(x1, y1, x2, y2);
  return {
    id: generateId(),
    element_type: 'line',
    x: minX,
    y: minY,
    width: Math.abs(x2 - x1) || 1,
    height: Math.abs(y2 - y1) || 1,
    rotation: 0,
    properties: {
      stroke: '#71717a',
      strokeWidth: 2,
      opacity: 1,
      points: [
        { x: x1 - minX, y: y1 - minY },
        { x: x2 - minX, y: y2 - minY },
      ],
      lineStyle: 'solid',
    },
    layer_id: layerId,
    z_index: 0,
    locked: false,
    visible: true,
  };
}

export function createArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  layerId: string
): CanvasElement {
  const { minX, minY } = edgeBounds(x1, y1, x2, y2);
  return {
    id: generateId(),
    element_type: 'arrow',
    x: minX,
    y: minY,
    width: Math.abs(x2 - x1) || 1,
    height: Math.abs(y2 - y1) || 1,
    rotation: 0,
    properties: {
      stroke: '#71717a',
      strokeWidth: 2,
      opacity: 1,
      points: [
        { x: x1 - minX, y: y1 - minY },
        { x: x2 - minX, y: y2 - minY },
      ],
      endArrow: true,
      startArrow: false,
      lineStyle: 'solid',
    },
    layer_id: layerId,
    z_index: 0,
    locked: false,
    visible: true,
  };
}

export function createPenPath(
  points: Array<{ x: number; y: number }>,
  layerId: string
): CanvasElement {
  // Degenerate: original behavior returns a 1x1 pen placeholder for empty input
  if (points.length === 0) {
    return {
      id: generateId(),
      element_type: 'pen',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rotation: 0,
      properties: {
        stroke: '#18181b',
        strokeWidth: 2,
        fill: 'none',
        opacity: 1,
        pathData: '',
        points: [],
      },
      layer_id: layerId,
      z_index: 0,
      locked: false,
      visible: true,
    };
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const normalized = points.map((p) => ({ x: p.x - minX, y: p.y - minY }));
  let pathData = `M ${normalized[0].x} ${normalized[0].y}`;
  for (let i = 1; i < normalized.length; i++) {
    pathData += ` L ${normalized[i].x} ${normalized[i].y}`;
  }
  return {
    id: generateId(),
    element_type: 'pen',
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX || 1,
    height: Math.max(...ys) - minY || 1,
    rotation: 0,
    properties: {
      stroke: '#18181b',
      strokeWidth: 2,
      fill: 'none',
      opacity: 1,
      pathData,
      points: normalized,
    },
    layer_id: layerId,
    z_index: 0,
    locked: false,
    visible: true,
  };
}
