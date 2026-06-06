/**
 * Canvas drag-drop and component placement handlers.
 * Extracted from CanvasWorkspaceInteractive.svelte for the 300-line limit.
 */

import { screenToCanvas } from '@/utils/canvas/utils';
import { createComponentFromSelection, placeComponentInstance } from '@/stores/canvas/componentLibrary';
import type { ViewportState } from './canvasRendering';

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
