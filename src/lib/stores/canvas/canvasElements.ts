import { get } from 'svelte/store';
import type { CanvasElement, CanvasDocument } from '@/types/canvas';
import { currentCanvas, selectedElements, clearSelection, selectElement } from './canvasStore';
import { generateId } from '@/utils/id';
import { log } from '@/utils/logger';

/**
 * Appends a new element to the current canvas and marks it as modified.
 * @param element - The fully-constructed element to add.
 */
export function addElement(element: CanvasElement) {
	currentCanvas.update((canvas: CanvasDocument | null) => {
		if (!canvas) return canvas;
		canvas.elements.push(element);
		canvas.modified_at = Math.floor(Date.now() / 1000);
		return canvas;
	});
	log.debug('Element added', { id: element.id, type: element.element_type });
}

/**
 * Replaces an element in-place by ID, updating modified_at.
 * @param element - The element with updated properties (must have existing ID).
 */
export function updateElement(element: CanvasElement) {
	currentCanvas.update((canvas: CanvasDocument | null) => {
		if (!canvas) return canvas;
		const index = canvas.elements.findIndex((e: CanvasElement) => e.id === element.id);
		if (index !== -1) {
			canvas.elements[index] = element;
			canvas.modified_at = Math.floor(Date.now() / 1000);
		}
		return canvas;
	});
	log.debug('Element updated', { id: element.id });
}

/**
 * Removes a single element by ID and deselects it if selected.
 * @param elementId - The ID of the element to remove.
 */
export function deleteElement(elementId: string) {
	currentCanvas.update((canvas: CanvasDocument | null) => {
		if (!canvas) return canvas;
		canvas.elements = canvas.elements.filter((e: CanvasElement) => e.id !== elementId);
		canvas.modified_at = Math.floor(Date.now() / 1000);
		return canvas;
	});
	const selected = get(selectedElements);
	if (selected.includes(elementId)) {
		selectedElements.update((s: string[]) => s.filter((id: string) => id !== elementId));
	}
	log.debug('Element deleted', { id: elementId });
}

/** Removes all currently selected elements and clears the selection. */
export function deleteSelectedElements() {
	const ids = get(selectedElements);
	if (ids.length === 0) return;

	currentCanvas.update((canvas: CanvasDocument | null) => {
		if (!canvas) return canvas;
		canvas.elements = canvas.elements.filter((e: CanvasElement) => !ids.includes(e.id));
		canvas.modified_at = Math.floor(Date.now() / 1000);
		return canvas;
	});
	clearSelection();
	log.info('Deleted selected elements', { count: ids.length });
}

/** Internal clipboard buffer for copy/paste operations. */
let clipboard: CanvasElement[] = [];

/** Copies the currently selected elements into the internal clipboard. */
export function copySelectedElements() {
	const ids = get(selectedElements);
	const canvasDoc = get(currentCanvas);
	if (!canvasDoc || ids.length === 0) return;

	clipboard = canvasDoc.elements
		.filter((e: CanvasElement) => ids.includes(e.id))
		.map((e: CanvasElement) => ({ ...e }));

	log.info('Copied elements to clipboard', { count: clipboard.length });
}

/** Pastes clipboard contents with new IDs, offset by 20px. Selects the new elements. */
export function pasteElements() {
	if (clipboard.length === 0) {
		log.warn('Clipboard is empty');
		return;
	}

	const canvasDoc = get(currentCanvas);
	if (!canvasDoc) return;

	const newElements = clipboard.map((e: CanvasElement) => ({
		...e,
		id: generateId(),
		x: e.x + 20,
		y: e.y + 20,
	}));

	currentCanvas.update((c: CanvasDocument | null) => {
		if (!c) return c;
		c.elements.push(...newElements);
		c.modified_at = Math.floor(Date.now() / 1000);
		return c;
	});

	clearSelection();
	newElements.forEach((e) => selectElement(e.id));

	log.info('Pasted elements', { count: newElements.length });
}

/** Copies then pastes the current selection (duplicate in-place with offset). */
export function duplicateSelectedElements() {
	copySelectedElements();
	setTimeout(() => pasteElements(), 10);
}
