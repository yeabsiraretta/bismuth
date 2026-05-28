import type { CanvasElement, DeviceType } from '@/types/canvas';
import { DEVICE_PRESETS } from '@/types/canvas';

// Generate unique ID for canvas elements
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new rectangle element
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

// Create a new circle element
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

// Create a new text element
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

// Create a frame element (container like Figma frames)
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

// Create a line element
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

// Create an arrow element
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

// Create a pen/path element
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

// Create a screen element (device frame)
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

// Snap coordinate to grid
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

// Check if point is inside element bounds
export function isPointInElement(
  px: number,
  py: number,
  element: CanvasElement
): boolean {
  return (
    px >= element.x &&
    px <= element.x + element.width &&
    py >= element.y &&
    py <= element.y + element.height
  );
}

// Get element at point (returns topmost element)
export function getElementAtPoint(
  x: number,
  y: number,
  elements: CanvasElement[]
): CanvasElement | null {
  // Iterate in reverse to get topmost element first
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element.visible && !element.locked && isPointInElement(x, y, element)) {
      return element;
    }
  }
  return null;
}

// Transform screen coordinates to canvas coordinates
export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: { x: number; y: number; scale: number }
): { x: number; y: number } {
  return {
    x: (screenX - viewport.x) / viewport.scale,
    y: (screenY - viewport.y) / viewport.scale,
  };
}

// Transform canvas coordinates to screen coordinates
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: { x: number; y: number; scale: number }
): { x: number; y: number } {
  return {
    x: canvasX * viewport.scale + viewport.x,
    y: canvasY * viewport.scale + viewport.y,
  };
}

// Calculate element bounds including rotation
export function getElementBounds(element: CanvasElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  // For now, return simple bounds (rotation handling can be added later)
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };
}

// Align elements
export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export function alignElements(
  elements: CanvasElement[],
  alignment: AlignmentType
): CanvasElement[] {
  if (elements.length < 2) return elements;

  const bounds = elements.map(getElementBounds);

  switch (alignment) {
    case 'left': {
      const minX = Math.min(...bounds.map((b) => b.x));
      return elements.map((el) => ({ ...el, x: minX }));
    }
    case 'center': {
      const avgCenterX =
        bounds.reduce((sum, b) => sum + b.x + b.width / 2, 0) / bounds.length;
      return elements.map((el) => ({
        ...el,
        x: avgCenterX - el.width / 2,
      }));
    }
    case 'right': {
      const maxRight = Math.max(...bounds.map((b) => b.x + b.width));
      return elements.map((el) => ({ ...el, x: maxRight - el.width }));
    }
    case 'top': {
      const minY = Math.min(...bounds.map((b) => b.y));
      return elements.map((el) => ({ ...el, y: minY }));
    }
    case 'middle': {
      const avgCenterY =
        bounds.reduce((sum, b) => sum + b.y + b.height / 2, 0) / bounds.length;
      return elements.map((el) => ({
        ...el,
        y: avgCenterY - el.height / 2,
      }));
    }
    case 'bottom': {
      const maxBottom = Math.max(...bounds.map((b) => b.y + b.height));
      return elements.map((el) => ({ ...el, y: maxBottom - el.height }));
    }
    default:
      return elements;
  }
}

// Distribute elements
export function distributeElements(
  elements: CanvasElement[],
  direction: 'horizontal' | 'vertical'
): CanvasElement[] {
  if (elements.length < 3) return elements;

  const sorted = [...elements].sort((a, b) =>
    direction === 'horizontal' ? a.x - b.x : a.y - b.y
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (direction === 'horizontal') {
    const totalSpace = last.x + last.width - first.x;
    const elementSpace = sorted.reduce((sum, el) => sum + el.width, 0);
    const gap = (totalSpace - elementSpace) / (sorted.length - 1);

    let currentX = first.x + first.width + gap;
    return sorted.map((el, i) => {
      if (i === 0 || i === sorted.length - 1) return el;
      const newEl = { ...el, x: currentX };
      currentX += el.width + gap;
      return newEl;
    });
  } else {
    const totalSpace = last.y + last.height - first.y;
    const elementSpace = sorted.reduce((sum, el) => sum + el.height, 0);
    const gap = (totalSpace - elementSpace) / (sorted.length - 1);

    let currentY = first.y + first.height + gap;
    return sorted.map((el, i) => {
      if (i === 0 || i === sorted.length - 1) return el;
      const newEl = { ...el, y: currentY };
      currentY += el.height + gap;
      return newEl;
    });
  }
}
