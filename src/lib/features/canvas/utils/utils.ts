import type { CanvasElement } from '@/features/canvas/types';

// Re-export element factory functions
export {
  generateId,
  createRectangle,
  createCircle,
  createText,
  createFrame,
  createLine,
  createArrow,
  createPenPath,
  createScreen,
} from '@/features/canvas/utils';

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
