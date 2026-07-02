/**
 * Canvas Layer Tree — builds a nested hierarchy from flat element arrays.
 * Elements with `parentId` are nested under their parent (frames/groups).
 */

import type { CanvasElement } from '@/features/canvas/types';

/** A node in the canvas element hierarchy. */
export interface LayerNode {
  el: CanvasElement;
  children: LayerNode[];
  depth: number;
}

/**
 * Builds a tree from a flat element list.
 * Root nodes are elements without a parentId.
 * Children are sorted by z_index descending (top-most first).
 */
export function buildLayerTree(elements: CanvasElement[]): LayerNode[] {
  const byParent = new Map<string, CanvasElement[]>();

  for (const el of elements) {
    const key = el.parentId ?? '';
    const bucket = byParent.get(key);
    if (bucket) bucket.push(el);
    else byParent.set(key, [el]);
  }

  const recurse = (parentId: string, depth: number): LayerNode[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => b.z_index - a.z_index)
      .map((el) => ({ el, children: recurse(el.id, depth + 1), depth }));

  return recurse('', 0);
}

/**
 * Flattens a tree into a display list respecting collapsed state.
 * Returns items in visual order for rendering a flat list with indentation.
 */
export function flattenTree(nodes: LayerNode[], collapsedIds: Set<string>): LayerNode[] {
  const result: LayerNode[] = [];

  const walk = (list: LayerNode[]) => {
    for (const node of list) {
      result.push(node);
      if (node.children.length > 0 && !collapsedIds.has(node.el.id)) {
        walk(node.children);
      }
    }
  };

  walk(nodes);
  return result;
}

/** Returns a human-readable label for an element. */
export function elementLabel(el: CanvasElement): string {
  if (el.name) return el.name;
  const suffix = el.id.slice(-4);
  switch (el.element_type) {
    case 'frame':
      return `Frame ${suffix}`;
    case 'group':
      return `Group ${suffix}`;
    case 'rectangle':
      return `Rectangle ${suffix}`;
    case 'circle':
      return `Ellipse ${suffix}`;
    case 'text':
      return el.properties.text?.slice(0, 20) || `Text ${suffix}`;
    case 'image':
      return `Image ${suffix}`;
    case 'line':
      return `Line ${suffix}`;
    case 'arrow':
      return `Arrow ${suffix}`;
    case 'pen':
      return `Path ${suffix}`;
    case 'screen':
      return `Screen ${suffix}`;
    case 'component_instance':
      return `Instance ${suffix}`;
    default:
      return `Element ${suffix}`;
  }
}

/** Maps element_type to a short symbol for the layer list. */
export function elementIcon(type: string): string {
  const icons: Record<string, string> = {
    frame: '\u25A1',
    rectangle: '\u25A0',
    circle: '\u25CF',
    text: 'T',
    image: '\u229E',
    group: '\u2750',
    line: '\u2500',
    arrow: '\u2192',
    pen: '\u270E',
    screen: '\u25A3',
    component_instance: '\u25C7',
  };
  return icons[type] ?? '\u2022';
}
