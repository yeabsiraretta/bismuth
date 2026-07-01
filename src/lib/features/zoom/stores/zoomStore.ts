/**
 * Zoom store — reactive state for zoom level, breadcrumbs, and config.
 */

import { writable, derived } from 'svelte/store';
import { log } from '@/utils/logger';
import type { ZoomState, ZoomTarget, ZoomConfig } from '../types/zoom';
import { INITIAL_ZOOM_STATE, DEFAULT_ZOOM_CONFIG } from '../types/zoom';
import { calculateZoomRange, buildBreadcrumbs } from '../services/zoomService';

const CONFIG_KEY = 'bismuth-zoom';

// ─── Config persistence ─────────────────────────────────────────────────────

function loadConfig(): ZoomConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (!stored) return { ...DEFAULT_ZOOM_CONFIG };
    return { ...DEFAULT_ZOOM_CONFIG, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_ZOOM_CONFIG };
  }
}

function persistConfig(config: ZoomConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    log.warn('Failed to persist zoom config');
  }
}

// ─── Stores ─────────────────────────────────────────────────────────────────

export const zoomState = writable<ZoomState>({ ...INITIAL_ZOOM_STATE });
export const zoomConfig = writable<ZoomConfig>(loadConfig());

// ─── Derived stores ─────────────────────────────────────────────────────────

export const isZoomed = derived(zoomState, ($s) => $s.active);
export const zoomTarget = derived(zoomState, ($s) => $s.target);
export const zoomRange = derived(zoomState, ($s) => $s.range);
export const zoomBreadcrumbs = derived(zoomState, ($s) => $s.stack);
export const zoomOnClick = derived(zoomConfig, ($c) => $c.zoomOnClick);

// ─── Actions ────────────────────────────────────────────────────────────────

/**
 * Zoom into a target heading or list item.
 * Pushes the current context onto the breadcrumb stack.
 */
export function zoomIn(content: string, target: ZoomTarget): void {
  const range = calculateZoomRange(content, target);
  if (!range) {
    log.warn('Zoom: failed to calculate range', { target });
    return;
  }

  const crumbs = buildBreadcrumbs(content, target);

  zoomState.set({
    active: true,
    target,
    range,
    stack: crumbs,
  });

  log.debug('Zoom: zoomed in', { kind: target.kind, line: target.line, text: target.text });
}

/**
 * Zoom out one level (to the parent in the breadcrumb stack).
 * If already at root, resets to unzoomed state.
 */
export function zoomOut(content: string): void {
  zoomState.update((state) => {
    if (!state.active || state.stack.length <= 1) {
      return { ...INITIAL_ZOOM_STATE };
    }

    // Pop current level, zoom to parent
    const parentCrumb = state.stack[state.stack.length - 2];
    const range = calculateZoomRange(content, parentCrumb.target);
    if (!range) return { ...INITIAL_ZOOM_STATE };

    return {
      active: true,
      target: parentCrumb.target,
      range,
      stack: state.stack.slice(0, -1),
    };
  });
  log.debug('Zoom: zoomed out one level');
}

/** Reset zoom completely (show entire document). */
export function zoomReset(): void {
  zoomState.set({ ...INITIAL_ZOOM_STATE });
  log.debug('Zoom: reset to full document');
}

/**
 * Navigate to a specific breadcrumb level.
 * All crumbs after the selected one are discarded.
 */
export function zoomToBreadcrumb(content: string, index: number): void {
  zoomState.update((state) => {
    if (index < 0 || index >= state.stack.length) return { ...INITIAL_ZOOM_STATE };

    const crumb = state.stack[index];
    const range = calculateZoomRange(content, crumb.target);
    if (!range) return { ...INITIAL_ZOOM_STATE };

    return {
      active: true,
      target: crumb.target,
      range,
      stack: state.stack.slice(0, index + 1),
    };
  });
}

/** Recalculate zoom range after content changes (e.g. typing while zoomed). */
export function refreshZoomRange(content: string): void {
  zoomState.update((state) => {
    if (!state.active || !state.target) return state;
    const range = calculateZoomRange(content, state.target);
    if (!range) return { ...INITIAL_ZOOM_STATE };
    return { ...state, range };
  });
}

// ─── Config actions ─────────────────────────────────────────────────────────

function updateConfig(fn: (c: ZoomConfig) => ZoomConfig): void {
  zoomConfig.update((c) => {
    const next = fn(c);
    persistConfig(next);
    return next;
  });
}

export function toggleZoomOnClick(): void {
  updateConfig((c) => ({ ...c, zoomOnClick: !c.zoomOnClick }));
}

export function toggleShowBreadcrumbs(): void {
  updateConfig((c) => ({ ...c, showBreadcrumbs: !c.showBreadcrumbs }));
}

export function toggleHighlightTarget(): void {
  updateConfig((c) => ({ ...c, highlightTarget: !c.highlightTarget }));
}
