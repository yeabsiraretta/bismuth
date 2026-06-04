import { get, derived } from 'svelte/store';
import type { CanvasElement, CanvasDocument, Page, ComponentDefinition } from '@/types/canvas';
import { currentCanvas, selectedElements, clearSelection, selectElement, activePageId } from './canvasStore';
import { addElement } from './canvasElements';
import { alignElements, distributeElements } from '@/utils/canvasUtils';
import type { AlignmentType } from '@/utils/canvasUtils';
import { log } from '@/utils/logger';

// ─── Grouping ────────────────────────────────────────────────────────────────

export function groupSelectedElements() {
	const ids = get(selectedElements);
	const canvasDoc = get(currentCanvas);

	if (!canvasDoc || ids.length < 2) {
		log.warn('Need at least 2 elements to group');
		return;
	}

	const elementsToGroup = canvasDoc.elements.filter((e: CanvasElement) => ids.includes(e.id));

	const minX = Math.min(...elementsToGroup.map((e: CanvasElement) => e.x));
	const minY = Math.min(...elementsToGroup.map((e: CanvasElement) => e.y));
	const maxX = Math.max(...elementsToGroup.map((e: CanvasElement) => e.x + e.width));
	const maxY = Math.max(...elementsToGroup.map((e: CanvasElement) => e.y + e.height));

	const groupElement: CanvasElement = {
		id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		element_type: 'group',
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY,
		rotation: 0,
		properties: { children: ids },
		layer_id: elementsToGroup[0].layer_id,
		z_index: Math.max(...elementsToGroup.map((e: CanvasElement) => e.z_index)),
		locked: false,
		visible: true,
	};

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
		const childIds = group.properties.children as string[];
		if (Array.isArray(childIds)) {
			childIds.forEach((id: string) => selectElement(id));
		}
	});

	log.info('Ungrouped elements', { count: groupElements.length });
}

// ─── Alignment & Distribution ────────────────────────────────────────────────

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

export const activePageElements = derived(
	[currentCanvas, activePageId],
	([$canvas, $pageId]: [CanvasDocument | null, string]) => {
		if (!$canvas) return [];
		const page = $canvas.pages?.find((p: Page) => p.id === $pageId);
		if (!page) return $canvas.elements;
		return $canvas.elements.filter((el: CanvasElement) => page.elements.includes(el.id));
	}
);

export function addPage(name: string) {
	const id = `page-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
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

export function renamePage(pageId: string, name: string) {
	currentCanvas.update((c: CanvasDocument | null) => {
		if (!c) return c;
		const page = c.pages?.find((p: Page) => p.id === pageId);
		if (page) page.name = name;
		return c;
	});
}

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

// ─── Components (Reusable Symbols) ──────────────────────────────────────────

export function createComponentFromSelection() {
	const ids = get(selectedElements);
	const canvasDoc = get(currentCanvas);
	if (!canvasDoc || ids.length === 0) return;

	const elements = canvasDoc.elements.filter((e: CanvasElement) => ids.includes(e.id));
	if (elements.length === 0) return;

	const minX = Math.min(...elements.map((e: CanvasElement) => e.x));
	const minY = Math.min(...elements.map((e: CanvasElement) => e.y));
	const maxX = Math.max(...elements.map((e: CanvasElement) => e.x + e.width));
	const maxY = Math.max(...elements.map((e: CanvasElement) => e.y + e.height));

	const normalized = elements.map((e: CanvasElement) => ({
		...e,
		x: e.x - minX,
		y: e.y - minY,
	}));

	const compId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
	const component: ComponentDefinition = {
		id: compId,
		name: `Component ${(canvasDoc.components?.length || 0) + 1}`,
		elements: normalized,
		exposedProps: [],
		width: maxX - minX,
		height: maxY - minY,
		created_at: Math.floor(Date.now() / 1000),
		modified_at: Math.floor(Date.now() / 1000),
	};

	const instanceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	const instance: CanvasElement = {
		id: instanceId,
		element_type: 'component_instance',
		x: minX,
		y: minY,
		width: component.width,
		height: component.height,
		rotation: 0,
		properties: { componentId: compId, overrides: {} },
		layer_id: elements[0].layer_id,
		z_index: Math.max(...elements.map((e: CanvasElement) => e.z_index)),
		locked: false,
		visible: true,
	};

	currentCanvas.update((c: CanvasDocument | null) => {
		if (!c) return c;
		c.components = [...(c.components || []), component];
		c.elements = c.elements.filter((e: CanvasElement) => !ids.includes(e.id));
		c.elements.push(instance);
		c.modified_at = Math.floor(Date.now() / 1000);
		return c;
	});

	clearSelection();
	selectElement(instanceId);
	log.info('Component created', { id: compId, name: component.name });
}

export function insertComponentInstance(componentId: string, x: number, y: number) {
	const canvasDoc = get(currentCanvas);
	if (!canvasDoc) return;

	const comp = canvasDoc.components?.find((c: ComponentDefinition) => c.id === componentId);
	if (!comp) return;

	const instanceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	const instance: CanvasElement = {
		id: instanceId,
		element_type: 'component_instance',
		x,
		y,
		width: comp.width,
		height: comp.height,
		rotation: 0,
		properties: { componentId, overrides: {} },
		layer_id: canvasDoc.layers[0]?.id || 'default',
		z_index: canvasDoc.elements.length,
		locked: false,
		visible: true,
	};

	addElement(instance);
	clearSelection();
	selectElement(instanceId);
	log.info('Component instance inserted', { componentId, instanceId });
}
