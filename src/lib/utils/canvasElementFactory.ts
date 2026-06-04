import type { CanvasElement, DeviceType } from '@/types/canvas';
import { DEVICE_PRESETS } from '@/types/canvas';

/** Generates a unique ID combining timestamp and random suffix. */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a rectangle element with default blue fill.
 * @param layerId - The layer to place this element on.
 */
export function createRectangle(
	x: number,
	y: number,
	width: number,
	height: number,
	layerId: string
): CanvasElement {
	return {
		id: generateId(),
		element_type: 'rectangle',
		x,
		y,
		width,
		height,
		rotation: 0,
		properties: {
			fill: '#3b82f6',
			stroke: '#1e40af',
			strokeWidth: 2,
			opacity: 1,
		},
		layer_id: layerId,
		z_index: 0,
		locked: false,
		visible: true,
	};
}

/**
 * Creates a circle element (stored as equal width/height bounding box).
 * @param radius - Circle radius in canvas units.
 */
export function createCircle(
	x: number,
	y: number,
	radius: number,
	layerId: string
): CanvasElement {
	return {
		id: generateId(),
		element_type: 'circle',
		x: x - radius,
		y: y - radius,
		width: radius * 2,
		height: radius * 2,
		rotation: 0,
		properties: {
			fill: '#10b981',
			stroke: '#059669',
			strokeWidth: 2,
			opacity: 1,
			radius,
		},
		layer_id: layerId,
		z_index: 0,
		locked: false,
		visible: true,
	};
}

/**
 * Creates a text element with default Inter font at 16px.
 * @param text - Initial text content.
 */
export function createText(
	x: number,
	y: number,
	text: string,
	layerId: string
): CanvasElement {
	return {
		id: generateId(),
		element_type: 'text',
		x,
		y,
		width: 100,
		height: 24,
		rotation: 0,
		properties: {
			text,
			fontSize: 16,
			fontFamily: 'Inter, sans-serif',
			fill: '#000000',
			opacity: 1,
		},
		layer_id: layerId,
		z_index: 0,
		locked: false,
		visible: true,
	};
}

/**
 * Creates a frame (container) element that can hold child elements.
 * Frames clip content by default and support auto layout.
 * @param name - Optional display name (defaults to "Frame").
 */
export function createFrame(
	x: number,
	y: number,
	width: number,
	height: number,
	layerId: string,
	name?: string
): CanvasElement {
	return {
		id: generateId(),
		element_type: 'frame',
		x,
		y,
		width,
		height,
		rotation: 0,
		properties: {
			fill: '#ffffff',
			stroke: '#d4d4d8',
			strokeWidth: 1,
			opacity: 1,
			clipContent: true,
			padding: 0,
		},
		layer_id: layerId,
		z_index: 0,
		locked: false,
		visible: true,
		name: name || 'Frame',
	};
}

/**
 * Creates a line between two points.
 * Bounding box is calculated from the point extremes.
 */
export function createLine(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	layerId: string
): CanvasElement {
	const minX = Math.min(x1, x2);
	const minY = Math.min(y1, y2);
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

/**
 * Creates an arrow (line with end-cap arrowhead).
 * @param x1 - Start X coordinate.
 * @param y1 - Start Y coordinate.
 * @param x2 - End X coordinate.
 * @param y2 - End Y coordinate.
 */
export function createArrow(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	layerId: string
): CanvasElement {
	const minX = Math.min(x1, x2);
	const minY = Math.min(y1, y2);
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

/**
 * Creates a freehand path element from a series of points.
 * Generates an SVG path `d` attribute for rendering.
 * @param points - Array of absolute coordinates drawn by the user.
 */
export function createPenPath(
	points: Array<{ x: number; y: number }>,
	layerId: string
): CanvasElement {
	if (points.length === 0) {
		return createRectangle(0, 0, 1, 1, layerId);
	}
	const xs = points.map((p) => p.x);
	const ys = points.map((p) => p.y);
	const minX = Math.min(...xs);
	const minY = Math.min(...ys);
	const maxX = Math.max(...xs);
	const maxY = Math.max(...ys);

	// Build SVG path
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
		width: maxX - minX || 1,
		height: maxY - minY || 1,
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

/**
 * Creates a device screen frame with preset dimensions and rounded corners.
 * @param deviceType - The device preset to use for width/height.
 */
export function createScreen(
	x: number,
	y: number,
	deviceType: DeviceType,
	layerId: string
): CanvasElement {
	const preset = DEVICE_PRESETS[deviceType] || { width: 393, height: 852 };
	return {
		id: generateId(),
		element_type: 'screen',
		x,
		y,
		width: preset.width,
		height: preset.height,
		rotation: 0,
		properties: {
			fill: '#ffffff',
			stroke: '#27272a',
			strokeWidth: 2,
			opacity: 1,
			clipContent: true,
			deviceType,
			borderRadius: { topLeft: 40, topRight: 40, bottomRight: 40, bottomLeft: 40 },
		},
		layer_id: layerId,
		z_index: 0,
		locked: false,
		visible: true,
		name: DEVICE_PRESETS[deviceType]?.label || 'Screen',
	};
}
