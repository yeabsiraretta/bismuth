/**
 * Canvas drag-drop and component placement handlers.
 * Extracted from CanvasWorkspaceInteractive.svelte for the 300-line limit.
 */

import { screenToCanvas } from '@/features/canvas/utils/utils';
import { createComponentFromSelection, placeComponentInstance } from '@/features/canvas/stores';
import type { ViewportState } from '@/features/canvas/components/workspace/canvasRendering';

export function handleDragOver(e: DragEvent) {
  if (e.dataTransfer?.types.includes('application/x-bismuth-component')) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }
}

export function handleDrop(e: DragEvent, canvas: HTMLCanvasElement, viewport: ViewportState) {
  e.preventDefault();
  const componentId = e.dataTransfer?.getData('application/x-bismuth-component');
  if (!componentId) return;

  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  const canvasCoords = screenToCanvas(screenX, screenY, viewport);

  placeComponentInstance(componentId, canvasCoords.x, canvasCoords.y);
}

export async function handleComponentConfirm(name: string, category?: string) {
  await createComponentFromSelection(name, category);
}

/**
 * T048: Computes the insertion index for a dragged element over an auto-layout frame.
 * Returns the child index at which the element should be inserted based on pointer position.
 */
export function computeAutoLayoutInsertionIndex(
  pointerX: number,
  pointerY: number,
  direction: 'horizontal' | 'vertical',
  children: Array<{ x: number; y: number; width: number; height: number }>
): number {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (direction === 'horizontal') {
      if (pointerX < child.x + child.width / 2) return i;
    } else {
      if (pointerY < child.y + child.height / 2) return i;
    }
  }
  return children.length;
}
