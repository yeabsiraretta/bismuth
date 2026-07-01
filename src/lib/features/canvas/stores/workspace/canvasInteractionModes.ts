/**
 * Canvas interaction mode stores — focus mode, edge highlight, collapsible groups.
 *
 * These are ephemeral UI states that control visual emphasis and grouping
 * behavior on the canvas. They are not persisted to the canvas document.
 */

import { writable, derived, get } from 'svelte/store';
import type { CanvasElement, CanvasDocument } from '@/features/canvas/types';
import { currentCanvas, selectedElements, updateElement } from '../elements/canvasStore';
import { log } from '@/utils/logger';

// ─── Focus Mode ─────────────────────────────────────────────────────────────

/** Whether focus mode is active (blurs all non-focused nodes). */
export const focusModeEnabled = writable<boolean>(false);

/** Element ID currently in focus (only meaningful when focusModeEnabled is true). */
export const focusedElementId = writable<string | null>(null);

/** Toggles focus mode on/off. When turning off, clears the focused element. */
export function toggleFocusMode(): void {
  focusModeEnabled.update((v) => {
    if (v) focusedElementId.set(null);
    return !v;
  });
  log.debug('Focus mode toggled');
}

/** Sets focus to a specific element, enabling focus mode if not already on. */
export function focusElement(elementId: string): void {
  focusModeEnabled.set(true);
  focusedElementId.set(elementId);
  log.debug('Element focused', { elementId });
}

/** Exits focus mode and clears the focused element. */
export function exitFocusMode(): void {
  focusModeEnabled.set(false);
  focusedElementId.set(null);
}

// ─── Edge Highlight ─────────────────────────────────────────────────────────

/** Whether edges connected to selected nodes should be highlighted. */
export const edgeHighlightEnabled = writable<boolean>(true);

/**
 * Derived: IDs of edges (line/arrow elements) connected to the currently
 * selected nodes. Uses element coordinate proximity to determine connection.
 * Also checks flow links for frame-to-frame connections.
 */
export const highlightedEdgeIds = derived(
  [currentCanvas, selectedElements, edgeHighlightEnabled],
  ([$canvas, $selected, $enabled]: [CanvasDocument | null, string[], boolean]) => {
    if (!$enabled || !$canvas || $selected.length === 0) return new Set<string>();

    const ids = new Set<string>();

    // Check flow links
    if ($canvas.flowLinks) {
      for (const link of $canvas.flowLinks) {
        if ($selected.includes(link.fromFrameId) || $selected.includes(link.toFrameId)) {
          ids.add(link.id);
        }
      }
    }

    // Check edge elements (arrows/lines) that share endpoints with selected nodes
    const selectedEls = $canvas.elements.filter((e: CanvasElement) => $selected.includes(e.id));
    const edgeEls = $canvas.elements.filter((e: CanvasElement) =>
      e.element_type === 'arrow' || e.element_type === 'line',
    );

    for (const edge of edgeEls) {
      const pts = edge.properties.points;
      if (!pts || pts.length < 2) continue;
      const startX = edge.x + pts[0].x;
      const startY = edge.y + pts[0].y;
      const endX = edge.x + pts[pts.length - 1].x;
      const endY = edge.y + pts[pts.length - 1].y;

      for (const node of selectedEls) {
        if (isPointNearElement(startX, startY, node) || isPointNearElement(endX, endY, node)) {
          ids.add(edge.id);
          break;
        }
      }
    }

    return ids;
  },
);

/** Checks if a point is within or near an element's bounding box. */
function isPointNearElement(px: number, py: number, el: CanvasElement, tolerance: number = 8): boolean {
  return (
    px >= el.x - tolerance &&
    px <= el.x + el.width + tolerance &&
    py >= el.y - tolerance &&
    py <= el.y + el.height + tolerance
  );
}

/** Toggles edge highlight on/off. */
export function toggleEdgeHighlight(): void {
  edgeHighlightEnabled.update((v) => !v);
}

// ─── Collapsible Groups ─────────────────────────────────────────────────────

/**
 * Toggles the collapsed state of a group/frame element.
 * When collapsed, child elements are hidden from rendering.
 */
export function toggleCollapse(elementId: string): void {
  const canvas = get(currentCanvas);
  if (!canvas) return;

  const el = canvas.elements.find((e: CanvasElement) => e.id === elementId);
  if (!el || (el.element_type !== 'frame' && el.element_type !== 'group')) return;

  const updated: CanvasElement = {
    ...el,
    properties: {
      ...el.properties,
      collapsed: !el.properties.collapsed,
    },
  };
  updateElement(updated);
  log.debug('Group collapse toggled', { elementId, collapsed: updated.properties.collapsed });
}

/**
 * Sets collapsed state explicitly for a group/frame element.
 */
export function setCollapsed(elementId: string, collapsed: boolean): void {
  const canvas = get(currentCanvas);
  if (!canvas) return;

  const el = canvas.elements.find((e: CanvasElement) => e.id === elementId);
  if (!el) return;

  updateElement({
    ...el,
    properties: { ...el.properties, collapsed },
  });
}

/**
 * Returns child element IDs for a group/frame element.
 * Children are elements whose parentId matches the group/frame ID.
 */
export function getGroupChildren(canvas: CanvasDocument, groupId: string): string[] {
  return canvas.elements
    .filter((e: CanvasElement) => e.parentId === groupId)
    .map((e: CanvasElement) => e.id);
}
