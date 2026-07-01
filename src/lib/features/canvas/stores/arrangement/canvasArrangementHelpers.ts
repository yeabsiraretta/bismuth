/**
 * Pure computation helpers for canvas arrangement operations.
 * No store imports — all functions take element arrays as arguments and return computed values.
 */
import type { CanvasElement, ComponentDefinition } from '@/features/canvas/types';
import { generateId, generatePrefixedId } from '@/utils/id';

// ─── Bounding Box ─────────────────────────────────────────────────────────────

/** Computes the bounding box encompassing all provided elements. */
export function computeBoundingBox(elements: CanvasElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const minX = Math.min(...elements.map((e) => e.x));
  const minY = Math.min(...elements.map((e) => e.y));
  const maxX = Math.max(...elements.map((e) => e.x + e.width));
  const maxY = Math.max(...elements.map((e) => e.y + e.height));
  return { minX, minY, maxX, maxY };
}

/** Returns the maximum z_index among the provided elements. */
export function maxZIndex(elements: CanvasElement[]): number {
  return Math.max(...elements.map((e) => e.z_index));
}

// ─── Group Construction ───────────────────────────────────────────────────────

/** Builds a group CanvasElement that encompasses the given child elements. */
export function buildGroupElement(
  elementsToGroup: CanvasElement[],
  childIds: string[]
): CanvasElement {
  const { minX, minY, maxX, maxY } = computeBoundingBox(elementsToGroup);
  return {
    id: generateId(),
    element_type: 'group',
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rotation: 0,
    properties: { children: childIds },
    layer_id: elementsToGroup[0].layer_id,
    z_index: maxZIndex(elementsToGroup),
    locked: false,
    visible: true,
  };
}

// ─── Component Construction ──────────────────────────────────────────────────

/** Normalizes element coordinates relative to the top-left corner of the bounding box. */
export function normalizeElementPositions(
  elements: CanvasElement[],
  minX: number,
  minY: number
): CanvasElement[] {
  return elements.map((e) => ({ ...e, x: e.x - minX, y: e.y - minY }));
}

/** Builds a ComponentDefinition from a set of selected elements. */
export function buildComponentDefinition(
  elements: CanvasElement[],
  existingComponentCount: number
): ComponentDefinition {
  const { minX, minY, maxX, maxY } = computeBoundingBox(elements);
  const normalized = normalizeElementPositions(elements, minX, minY);
  const compId = generatePrefixedId('comp');
  return {
    id: compId,
    name: `Component ${existingComponentCount + 1}`,
    elements: normalized,
    exposedProps: [],
    width: maxX - minX,
    height: maxY - minY,
    created_at: Math.floor(Date.now() / 1000),
    modified_at: Math.floor(Date.now() / 1000),
  };
}

/** Builds a component instance CanvasElement for the given component at the specified position. */
export function buildComponentInstance(
  componentId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  layerId: string,
  zIndex: number
): CanvasElement {
  return {
    id: generateId(),
    element_type: 'component_instance',
    x,
    y,
    width,
    height,
    rotation: 0,
    properties: { definitionId: componentId, overrides: {} },
    layer_id: layerId,
    z_index: zIndex,
    locked: false,
    visible: true,
  };
}
