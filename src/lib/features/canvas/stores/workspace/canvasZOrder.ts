/**
 * Z-order control actions for canvas elements.
 * Provides bring-to-front, send-to-back, bring-forward, send-backward.
 */

import { get } from 'svelte/store';
import type { CanvasElement, CanvasDocument } from '@/features/canvas/types';
import { currentCanvas, selectedElements } from '../elements/canvasStore';
import { log } from '@/utils/logger';

/**
 * Brings selected elements to the front (highest z_index in their layer).
 */
export function bringToFront(): void {
  mutateZOrder((elements, selectedIds) => {
    const maxZ = Math.max(...elements.map((e) => e.z_index), 0);
    let offset = 1;
    for (const el of elements) {
      if (selectedIds.includes(el.id)) {
        el.z_index = maxZ + offset++;
      }
    }
  });
  log.debug('Brought elements to front');
}

/**
 * Sends selected elements to the back (lowest z_index in their layer).
 */
export function sendToBack(): void {
  mutateZOrder((elements, selectedIds) => {
    const minZ = Math.min(...elements.map((e) => e.z_index), 0);
    let offset = 1;
    for (const el of elements) {
      if (selectedIds.includes(el.id)) {
        el.z_index = minZ - offset++;
      }
    }
  });
  log.debug('Sent elements to back');
}

/**
 * Moves selected elements one step forward in z-order.
 */
export function bringForward(): void {
  mutateZOrder((elements, selectedIds) => {
    const sorted = [...elements].sort((a, b) => a.z_index - b.z_index);
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (selectedIds.includes(sorted[i].id) && i < sorted.length - 1) {
        const temp = sorted[i].z_index;
        sorted[i].z_index = sorted[i + 1].z_index;
        sorted[i + 1].z_index = temp;
      }
    }
    // Apply back to elements array
    for (const s of sorted) {
      const target = elements.find((e) => e.id === s.id);
      if (target) target.z_index = s.z_index;
    }
  });
  log.debug('Brought elements forward');
}

/**
 * Moves selected elements one step backward in z-order.
 */
export function sendBackward(): void {
  mutateZOrder((elements, selectedIds) => {
    const sorted = [...elements].sort((a, b) => a.z_index - b.z_index);
    for (let i = 0; i < sorted.length; i++) {
      if (selectedIds.includes(sorted[i].id) && i > 0) {
        const temp = sorted[i].z_index;
        sorted[i].z_index = sorted[i - 1].z_index;
        sorted[i - 1].z_index = temp;
      }
    }
    for (const s of sorted) {
      const target = elements.find((e) => e.id === s.id);
      if (target) target.z_index = s.z_index;
    }
  });
  log.debug('Sent elements backward');
}

/**
 * Internal helper — applies a z_index mutation function to the canvas elements.
 */
function mutateZOrder(fn: (elements: CanvasElement[], selectedIds: string[]) => void): void {
  const ids = get(selectedElements);
  if (ids.length === 0) return;

  currentCanvas.update((canvas: CanvasDocument | null) => {
    if (!canvas) return canvas;
    fn(canvas.elements, ids);
    canvas.modified_at = Math.floor(Date.now() / 1000);
    return canvas;
  });
}
