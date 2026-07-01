import { writable, derived, get } from 'svelte/store';
import type { StatusItem } from '@/types/layout';
import { log } from '@/utils/logger';

/**
 * Extensible Status Store
 *
 * Any component can register status items (icon + label + optional click action).
 * The StatusBar component reads from this store to render items in left/center/right regions.
 *
 * Usage:
 *   registerStatusItem({ id: 'word-count', position: 'right', label: '120 words', icon: 'type' });
 *   removeStatusItem('word-count');
 *   updateStatusItem('word-count', { label: '135 words' });
 */

const statusItems = writable<Map<string, StatusItem>>(new Map());

/** Register a new status item or replace an existing one with the same ID */
export function registerStatusItem(item: StatusItem): void {
  statusItems.update(items => {
    const next = new Map(items);
    next.set(item.id, { visible: true, priority: 100, ...item });
    return next;
  });
}

/** Remove a status item by ID */
export function removeStatusItem(id: string): void {
  statusItems.update(items => {
    const next = new Map(items);
    next.delete(id);
    return next;
  });
}

/** Update properties of an existing status item */
export function updateStatusItem(id: string, updates: Partial<Omit<StatusItem, 'id'>>): void {
  statusItems.update(items => {
    const existing = items.get(id);
    if (!existing) return items;
    const next = new Map(items);
    next.set(id, { ...existing, ...updates });
    return next;
  });
}

/** Clear all status items (e.g., on vault close) */
export function clearStatusItems(): void {
  statusItems.set(new Map());
}

/** Sort items by priority (lower first), then by insertion order */
function sortItems(items: StatusItem[]): StatusItem[] {
  return items
    .filter(item => item.visible !== false)
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
}

/** Derived store: all visible items in the left region */
export const statusItemsLeft = derived(statusItems, $items =>
  sortItems([...$items.values()].filter(i => i.position === 'left'))
);

/** Derived store: all visible items in the center region */
export const statusItemsCenter = derived(statusItems, $items =>
  sortItems([...$items.values()].filter(i => i.position === 'center'))
);

/** Derived store: all visible items in the right region */
export const statusItemsRight = derived(statusItems, $items =>
  sortItems([...$items.values()].filter(i => i.position === 'right'))
);

/** Read-only access to all items (for debugging/testing) */
export const allStatusItems = derived(statusItems, $items => [...$items.values()]);

/** Reorder status items in a given position by updating priorities */
export function reorderStatusItems(position: 'left' | 'center' | 'right', orderedIds: string[]): void {
  statusItems.update(items => {
    const next = new Map(items);
    orderedIds.forEach((id, index) => {
      const item = next.get(id);
      if (item && item.position === position) {
        next.set(id, { ...item, priority: index });
      }
    });
    return next;
  });
  saveStatusOrder();
}

const STATUS_ORDER_KEY = 'bismuth-status-order';

/** Save custom ordering to localStorage */
function saveStatusOrder(): void {
  const $items = get(statusItems);
  const order: Record<string, number> = {};
  for (const [id, item] of $items) {
    if (item.priority !== undefined) {
      order[id] = item.priority;
    }
  }
  try {
    localStorage.setItem(STATUS_ORDER_KEY, JSON.stringify(order));
  } catch (e) { log.warn('Failed to save status order to localStorage', { error: String(e) }); }
}

/** Load saved order from localStorage and apply to items */
export function loadStatusOrder(): void {
  try {
    const saved = localStorage.getItem(STATUS_ORDER_KEY);
    if (!saved) return;
    const order = JSON.parse(saved) as Record<string, number>;
    statusItems.update(items => {
      const next = new Map(items);
      for (const [id, priority] of Object.entries(order)) {
        const item = next.get(id);
        if (item) {
          next.set(id, { ...item, priority });
        }
      }
      return next;
    });
  } catch (e) { log.warn('Failed to load status order from localStorage', { error: String(e) }); }
}
