/**
 * Zoom level service — uniform UI scaling via CSS custom properties.
 *
 * Instead of using Tauri's webview.setZoom() (which zooms toward a focal point
 * like browser pinch-to-zoom), this service scales the entire UI uniformly by
 * applying a CSS `zoom` property on the app root and a `--ui-scale` custom
 * property for components that need to compensate.
 *
 * Security: Input is clamped to [0.75, 1.5] before application.
 */

import { log } from '@/utils/logger';

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.5;
const ZOOM_STORAGE_KEY = 'bismuth-zoom-level';

/** Clamp a zoom factor to safe bounds. */
export function clampZoom(factor: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, factor));
}

/** Apply uniform UI scale to all components. Clamped before application. */
export async function setZoom(factor: number): Promise<void> {
  const clamped = clampZoom(factor);
  const root = document.documentElement;

  // Set CSS custom property for any component that needs scale awareness
  root.style.setProperty('--ui-scale', String(clamped));

  // Clean up any stale zoom from prior implementations
  root.style.removeProperty('zoom');
  const appEl = document.getElementById('app');
  if (appEl) {
    appEl.style.removeProperty('zoom');
    appEl.style.removeProperty('width');
    appEl.style.removeProperty('height');
  }

  // Apply zoom on <body>. When zoom is on the body element, the CSS
  // viewport units (vw/vh) used by children are automatically adjusted
  // by the browser — 100vw/100vh fills the visible area at any scale.
  // No dimension compensation needed.
  document.body.style.zoom = clamped === 1 ? '' : String(clamped);

  localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped));
  log.info('UI scale set', { factor: clamped });
}

/** Get persisted zoom level (defaults to 1.0). */
export function getStoredZoom(): number {
  const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
  if (stored) {
    const parsed = parseFloat(stored);
    if (!isNaN(parsed)) return clampZoom(parsed);
  }
  return 1.0;
}

/** Restore zoom level on app start. */
export async function restoreZoom(): Promise<void> {
  // One-time migration: clear stale zoom from broken prior implementations
  const migrationKey = 'bismuth-zoom-migrated-v2';
  if (!localStorage.getItem(migrationKey)) {
    localStorage.removeItem(ZOOM_STORAGE_KEY);
    localStorage.setItem(migrationKey, '1');
  }

  const level = getStoredZoom();
  await setZoom(level);
}
