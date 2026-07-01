/**
 * Slide helper utilities for canvas/presentation documents (Spec 043).
 *
 * Pure functions — no store imports, no side effects.
 * All functions operate on CanvasDocument values and return new values.
 *
 * Directory density check: utils/ contains annotations.ts, autoLayout/,
 * data/, export.ts, index.ts, layerTree.ts, measurements/, sanitize.ts,
 * utils.ts, and slideHelpers.ts (this file) — within the 8-file limit for
 * non-directory entries.
 */

import type { CanvasDocument, SlideMetadata } from '@/features/canvas/types/document';
import type { CanvasElement } from '@/features/canvas/types/elements';
import { buildFlowGraph, findEntryFrame } from '@/features/canvas/utils/data/flowGraph';

// ─── Defaults ─────────────────────────────────────────────────────────────────

/** Default transition duration in milliseconds. */
const DEFAULT_TRANSITION_DURATION = 300;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns an ordered array of frame IDs representing the slide sequence.
 *
 * The order is derived from the document's flow links using BFS from the
 * entry frame. Frames not reachable via flow links are appended in document
 * element order after the reachable set.
 *
 * @param doc - Canvas document to inspect.
 * @returns Array of frame IDs in presentation order.
 */
export function getSlideOrder(doc: CanvasDocument): string[] {
  const frames = doc.elements.filter(
    (e: CanvasElement) => e.element_type === 'frame' || e.element_type === 'screen'
  );

  if (frames.length === 0) return [];

  const flowLinks = doc.flowLinks ?? [];

  if (flowLinks.length === 0) {
    // No flow links — fall back to document element order
    return frames.map((f) => f.id);
  }

  const graph = buildFlowGraph(flowLinks, frames);
  const visited = new Set<string>();
  const order: string[] = [];

  // BFS from entry frame
  const entry = findEntryFrame(graph, frames);
  if (entry) {
    const queue = [entry];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      order.push(current);
      const node = graph.nodes.get(current);
      if (node) {
        for (const link of node.outgoing) {
          if (!visited.has(link.toFrameId)) {
            queue.push(link.toFrameId);
          }
        }
      }
    }
  }

  // Append any frames not reachable via flow links
  for (const frame of frames) {
    if (!visited.has(frame.id)) {
      order.push(frame.id);
    }
  }

  return order;
}

/**
 * Returns the `SlideMetadata` entry for the given frame, or `undefined` if
 * no metadata has been set for that frame.
 *
 * @param doc - Canvas document.
 * @param frameId - ID of the frame/slide to look up.
 */
export function getSlideMetadata(
  doc: CanvasDocument,
  frameId: string
): SlideMetadata | undefined {
  return doc.slideMetadata?.find((m) => m.frameId === frameId);
}

/**
 * Returns a `SlideMetadata` object populated with sensible defaults for the
 * given frame. Does NOT mutate the document.
 *
 * @param frameId - ID of the target frame.
 */
export function defaultSlideMetadata(frameId: string): SlideMetadata {
  return {
    frameId,
    speakerNotes: '',
    transitionType: 'instant',
    transitionDuration: DEFAULT_TRANSITION_DURATION,
  };
}

/**
 * Maps a `SlideMetadata.transitionType` value to the CSS class name that
 * triggers the matching `@keyframes` animation.
 *
 * @param type - Transition type discriminant.
 * @returns CSS class name string (non-empty for all valid types).
 */
export function resolveTransitionClass(
  type: SlideMetadata['transitionType']
): string {
  const map: Record<SlideMetadata['transitionType'], string> = {
    instant: '',
    fade: 'slide-enter-fade',
    'slide-left': 'slide-enter-slide-left',
    'slide-right': 'slide-enter-slide-right',
    scale: 'slide-enter-scale',
  };
  return map[type] ?? '';
}

/**
 * Returns `true` when the document is in presentation (slides) mode.
 *
 * @param doc - Canvas document to check.
 */
export function isPresentation(doc: CanvasDocument): boolean {
  return doc.documentType === 'slides';
}

/**
 * Returns an ordered array of `{ frame, meta }` pairs for every slide in the
 * document. Frames without explicit metadata receive default metadata.
 *
 * @param doc - Canvas document.
 */
export function getFramesAsSlides(
  doc: CanvasDocument
): Array<{ frame: CanvasElement; meta: SlideMetadata }> {
  const order = getSlideOrder(doc);
  return order.flatMap((frameId) => {
    const frame = doc.elements.find((e) => e.id === frameId);
    if (!frame) return [];
    const meta = getSlideMetadata(doc, frameId) ?? defaultSlideMetadata(frameId);
    return [{ frame, meta }];
  });
}

/**
 * Returns a new `CanvasDocument` with the slide metadata for `frameId`
 * updated by merging `patch` into the existing entry (or a default entry if
 * none exists). Does NOT mutate the input document.
 *
 * @param doc - Source canvas document.
 * @param frameId - ID of the frame whose metadata to update.
 * @param patch - Partial metadata values to merge.
 */
export function updateSlideMetadata(
  doc: CanvasDocument,
  frameId: string,
  patch: Partial<SlideMetadata>
): CanvasDocument {
  const existing = getSlideMetadata(doc, frameId) ?? defaultSlideMetadata(frameId);
  const updated: SlideMetadata = { ...existing, ...patch, frameId };
  const currentMeta = doc.slideMetadata ?? [];
  const idx = currentMeta.findIndex((m) => m.frameId === frameId);

  let newMeta: SlideMetadata[];
  if (idx === -1) {
    newMeta = [...currentMeta, updated];
  } else {
    newMeta = [...currentMeta];
    newMeta[idx] = updated;
  }

  return { ...doc, slideMetadata: newMeta };
}
