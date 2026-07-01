import { writable, derived } from 'svelte/store';

export const inspectEnabled = writable(false);
export const hoveredElement = writable<string | null>(null);
export const measureFrom = writable<string | null>(null);
export const measureTo = writable<string | null>(null);

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const elementBoundsCache = writable<Map<string, ElementBounds>>(new Map());

/** Computed spacing between measureFrom and measureTo elements. */
export const spacing = derived(
  [measureFrom, measureTo, elementBoundsCache],
  ([$from, $to, $bounds]) => {
    if (!$from || !$to) return null;
    const fromBounds = $bounds.get($from);
    const toBounds = $bounds.get($to);
    if (!fromBounds || !toBounds) return null;

    const dx = toBounds.x - (fromBounds.x + fromBounds.width);
    const dy = toBounds.y - (fromBounds.y + fromBounds.height);

    return {
      horizontal: Math.abs(dx),
      vertical: Math.abs(dy),
      fromBounds,
      toBounds,
    };
  }
);

/** Toggle inspect mode on/off. */
export function toggleInspect(): void {
  inspectEnabled.update((v) => !v);
  if (!inspectEnabled) {
    measureFrom.set(null);
    measureTo.set(null);
  }
}

/** Register element bounds for measurement. */
export function registerBounds(elementId: string, bounds: ElementBounds): void {
  elementBoundsCache.update((map) => {
    const next = new Map(map);
    next.set(elementId, bounds);
    return next;
  });
}

/** Set measurement elements for distance calculation. */
export function setMeasurement(from: string, to: string): void {
  measureFrom.set(from);
  measureTo.set(to);
}

/** Clear all measurement state. */
export function clearMeasurement(): void {
  measureFrom.set(null);
  measureTo.set(null);
}
