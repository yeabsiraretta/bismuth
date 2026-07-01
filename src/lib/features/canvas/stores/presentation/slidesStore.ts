/**
 * slidesStore — Presentation mode state (Spec 043, Phase 4).
 *
 * Manages presentation mode flag, active slide frame, and the presenter
 * elapsed timer. Reads canvas document state from canvasStore to resolve
 * slide order. No component imports.
 */

import { writable, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { getSlideOrder } from '@/features/canvas/utils/presentation/slideHelpers';
import type { CanvasDocument } from '@/features/canvas/types/document';

// ─── Stores ──────────────────────────────────────────────────────────────────

/** Whether the app is currently in presentation (fullscreen) mode. */
export const presentationMode = writable<boolean>(false);

/** Frame ID of the slide currently being presented. */
export const activeSlideFrameId = writable<string | null>(null);

/** Elapsed presenter time in milliseconds. */
export const presenterElapsedMs = writable<number>(0);

// ─── Timer internals ─────────────────────────────────────────────────────────

let timerHandle: ReturnType<typeof setInterval> | null = null;
const TICK_INTERVAL_MS = 1000;

function startTimer() {
  if (timerHandle !== null) return;
  timerHandle = setInterval(() => {
    presenterElapsedMs.update((ms) => ms + TICK_INTERVAL_MS);
  }, TICK_INTERVAL_MS);
}

function stopTimer() {
  if (timerHandle !== null) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Enters presentation mode for the given document.
 * Sets the active slide to the first slide in flow order.
 *
 * @param doc - Canvas document to present (must have documentType === 'slides').
 */
export function startPresentation(doc: CanvasDocument): void {
  const order = getSlideOrder(doc);
  const firstFrame = order[0] ?? null;
  presentationMode.set(true);
  activeSlideFrameId.set(firstFrame);
  presenterElapsedMs.set(0);
  startTimer();
  log.info('slidesStore: presentation started', {
    docId: doc.id,
    firstFrame,
    slideCount: order.length,
  });
}

/**
 * Exits presentation mode and stops the timer.
 */
export function stopPresentation(): void {
  presentationMode.set(false);
  activeSlideFrameId.set(null);
  stopTimer();
  log.info('slidesStore: presentation stopped');
}

/**
 * Navigates to the specified frame if it exists in the current slide order.
 * No-op if frameId is not in the order.
 *
 * @param doc - Current canvas document.
 * @param frameId - Target frame ID.
 */
export function goToSlide(doc: CanvasDocument, frameId: string): void {
  const order = getSlideOrder(doc);
  if (!order.includes(frameId)) {
    log.warn('slidesStore: goToSlide — frameId not in order', { frameId });
    return;
  }
  activeSlideFrameId.set(frameId);
  log.debug('slidesStore: goToSlide', { frameId });
}

/**
 * Advances to the next slide. No-op if already on the last slide.
 *
 * @param doc - Current canvas document.
 */
export function nextSlide(doc: CanvasDocument): void {
  const order = getSlideOrder(doc);
  const current = get(activeSlideFrameId);
  const idx = current ? order.indexOf(current) : -1;
  if (idx < order.length - 1) {
    activeSlideFrameId.set(order[idx + 1]);
    log.debug('slidesStore: nextSlide', { idx: idx + 1 });
  }
}

/**
 * Retreats to the previous slide. No-op if already on the first slide.
 *
 * @param doc - Current canvas document.
 */
export function prevSlide(doc: CanvasDocument): void {
  const order = getSlideOrder(doc);
  const current = get(activeSlideFrameId);
  const idx = current ? order.indexOf(current) : 0;
  if (idx > 0) {
    activeSlideFrameId.set(order[idx - 1]);
    log.debug('slidesStore: prevSlide', { idx: idx - 1 });
  }
}

/**
 * Resets the presenter timer to zero.
 */
export function resetTimer(): void {
  presenterElapsedMs.set(0);
  log.debug('slidesStore: timer reset');
}

/**
 * Advances the timer by one tick interval (used for manual control in tests).
 */
export function tickTimer(): void {
  presenterElapsedMs.update((ms) => ms + TICK_INTERVAL_MS);
}
