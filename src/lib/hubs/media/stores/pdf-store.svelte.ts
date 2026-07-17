/**
 * Minimal PDF store state used by the editor outline panel.
 * The standalone PdfViewer component was removed, so only keep reactive
 * state currently consumed by the app.
 */

import type { PdfOutlineItem, PdfViewerState } from '@/hubs/media/types/pdf-types';

const viewerState = $state<PdfViewerState | null>(null);
const outline = $state<PdfOutlineItem[]>([]);

export function getPdfViewerState(): PdfViewerState | null {
  return viewerState;
}

export function getPdfOutline(): PdfOutlineItem[] {
  return outline;
}
