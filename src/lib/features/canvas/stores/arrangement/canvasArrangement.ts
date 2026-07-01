/**
 * Canvas arrangement operations — grouping, alignment, distribution, pages, and component creation.
 * Mutates `currentCanvas` store directly; all operations update `modified_at`.
 */
import { get } from 'svelte/store';
import type { CanvasElement, CanvasDocument, Page } from '@/features/canvas/types';
import {
  currentCanvas,
  selectedElements,
  clearSelection,
  selectElement,
  activePageId,
} from '../elements/canvasStore';
import { alignElements, distributeElements } from '@/features/canvas/utils/utils';
import type { AlignmentType } from '@/features/canvas/utils/utils';
import { generatePrefixedId } from '@/utils/id';
import { log } from '@/utils/logger';
import { buildGroupElement } from './canvasArrangementHelpers';

// ─── Grouping ────────────────────────────────────────────────────────────────

/** Groups the currently selected elements into a single group element on the canvas. Requires ≥2 selections. */
export function groupSelectedElements() {
  const ids = get(selectedElements);
  const canvasDoc = get(currentCanvas);

  if (!canvasDoc || ids.length < 2) {
    log.warn('Need at least 2 elements to group');
    return;
  }

  const elementsToGroup = canvasDoc.elements.filter((e: CanvasElement) => ids.includes(e.id));
  const groupElement = buildGroupElement(elementsToGroup, ids);

  currentCanvas.update((c: CanvasDocument | null) => {
    if (!c) return c;
    c.elements.push(groupElement);
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });

  clearSelection();
  selectElement(groupElement.id);
  log.info('Grouped elements', { count: ids.length, groupId: groupElement.id });
}

/** Dissolves selected group elements, restoring child elements to independent selection. */
export function ungroupSelectedElements() {
  const ids = get(selectedElements);
  const canvasDoc = get(currentCanvas);
  if (!canvasDoc || ids.length === 0) return;

  const groupElements = canvasDoc.elements.filter(
    (e: CanvasElement) => ids.includes(e.id) && e.element_type === 'group'
  );

  if (groupElements.length === 0) {
    log.warn('No groups selected');
    return;
  }

  currentCanvas.update((c: CanvasDocument | null) => {
    if (!c) return c;
    c.elements = c.elements.filter(
      (e: CanvasElement) => !groupElements.some((g: CanvasElement) => g.id === e.id)
    );
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });

  clearSelection();
  groupElements.forEach((group: CanvasElement) => {
    const childIds = group.properties['children'] as string[];
    if (Array.isArray(childIds)) {
      childIds.forEach((id: string) => selectElement(id));
    }
  });

  log.info('Ungrouped elements', { count: groupElements.length });
}

// ─── Alignment & Distribution ────────────────────────────────────────────────

/** Aligns all selected elements along a shared axis (left, right, top, bottom, center-h, center-v). Requires ≥2 selections. */
export function alignSelectedElements(alignment: AlignmentType) {
  const ids = get(selectedElements);
  const canvasDoc = get(currentCanvas);

  if (!canvasDoc || ids.length < 2) {
    log.warn('Need at least 2 elements to align');
    return;
  }

  const elementsToAlign = canvasDoc.elements.filter((e: CanvasElement) => ids.includes(e.id));
  const alignedElements = alignElements(elementsToAlign, alignment);

  currentCanvas.update((c: CanvasDocument | null) => {
    if (!c) return c;
    alignedElements.forEach((aligned: CanvasElement) => {
      const element = c.elements.find((e: CanvasElement) => e.id === aligned.id);
      if (element) {
        element.x = aligned.x;
        element.y = aligned.y;
      }
    });
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });

  log.info('Aligned elements', { alignment, count: ids.length });
}

/** Distributes selected elements evenly along the given axis. Requires ≥3 selections. */
export function distributeSelectedElements(direction: 'horizontal' | 'vertical') {
  const ids = get(selectedElements);
  const canvasDoc = get(currentCanvas);

  if (!canvasDoc || ids.length < 3) {
    log.warn('Need at least 3 elements to distribute');
    return;
  }

  const elementsToDistribute = canvasDoc.elements.filter((e: CanvasElement) => ids.includes(e.id));
  const distributedElements = distributeElements(elementsToDistribute, direction);

  currentCanvas.update((c: CanvasDocument | null) => {
    if (!c) return c;
    distributedElements.forEach((distributed: CanvasElement) => {
      const element = c.elements.find((e: CanvasElement) => e.id === distributed.id);
      if (element) {
        element.x = distributed.x;
        element.y = distributed.y;
      }
    });
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });

  log.info('Distributed elements', { direction, count: ids.length });
}

// ─── Pages ───────────────────────────────────────────────────────────────────

/** Creates a new page in the canvas and switches to it. */
export function addPage(name: string) {
  const id = generatePrefixedId('page');
  currentCanvas.update((c: CanvasDocument | null) => {
    if (!c) return c;
    const newPage: Page = {
      id,
      name,
      order: (c.pages?.length || 0) + 1,
      elements: [],
    };
    c.pages = [...(c.pages || []), newPage];
    c.activePageId = id;
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });
  activePageId.set(id);
  log.info('Page added', { id, name });
}

/** Renames an existing page by ID. */
export function renamePage(pageId: string, name: string) {
  currentCanvas.update((c: CanvasDocument | null) => {
    if (!c) return c;
    const page = c.pages?.find((p: Page) => p.id === pageId);
    if (page) page.name = name;
    return c;
  });
}

/** Deletes a page and removes its orphaned elements. Switches to the first remaining page. */
export function deletePage(pageId: string) {
  currentCanvas.update((c: CanvasDocument | null) => {
    if (!c) return c;
    c.pages = (c.pages || []).filter((p: Page) => p.id !== pageId);
    c.elements = c.elements.filter(
      (el: CanvasElement) => !c.pages || c.pages.some((p: Page) => p.elements.includes(el.id))
    );
    if (c.activePageId === pageId && c.pages.length > 0) {
      c.activePageId = c.pages[0].id;
      activePageId.set(c.activePageId);
    }
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });
  log.info('Page deleted', { pageId });
}

/** Switches the active page, clears the current selection, and updates canvas state. */
export function switchPage(pageId: string) {
  activePageId.set(pageId);
  currentCanvas.update((c: CanvasDocument | null) => {
    if (!c) return c;
    c.activePageId = pageId;
    return c;
  });
  clearSelection();
  log.debug('Switched to page', { pageId });
}
