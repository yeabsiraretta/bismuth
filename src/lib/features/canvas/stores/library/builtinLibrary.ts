import { derived, get } from 'svelte/store';
import type { ComponentDefinition } from '@/features/canvas/types';
import { BUILTIN_COMPONENTS, getBuiltinByCategory } from '@/config/presets/canvas-library';
import { components, filteredComponents, searchQuery, categoryFilter } from './componentLibrary';
import { log } from '@/utils/logger';

/** All components (built-in + user) merged into a single list. */
export const allComponents = derived([components], ([$userComponents]) => [
  ...BUILTIN_COMPONENTS,
  ...$userComponents,
]);

/** Filtered components including built-in entries. */
export const allFilteredComponents = derived(
  [filteredComponents, searchQuery, categoryFilter],
  ([$userFiltered, $query, $category]) => {
    let builtins = BUILTIN_COMPONENTS;
    if ($category) {
      builtins = builtins.filter((c) => c.category === $category);
    }
    if ($query) {
      const q = $query.toLowerCase();
      builtins = builtins.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return { builtins, user: $userFiltered };
  }
);

/** Built-in components grouped by category (static). */
export const builtinByCategory = getBuiltinByCategory();

/** Check if a component ID belongs to a built-in definition. */
export function isBuiltinComponent(id: string): boolean {
  return BUILTIN_COMPONENTS.some((c) => c.id === id);
}

/** Get a built-in component definition by ID. */
export function getBuiltinById(id: string): ComponentDefinition | undefined {
  return BUILTIN_COMPONENTS.find((c) => c.id === id);
}

/**
 * Prevents deletion of built-in components.
 * Returns true if the component can be deleted, false if protected.
 */
export function canDeleteComponent(id: string): boolean {
  if (isBuiltinComponent(id)) {
    log.warn('Cannot delete built-in component', { id });
    return false;
  }
  return true;
}

/**
 * Prevents renaming of built-in components.
 * Returns true if the component can be renamed, false if protected.
 */
export function canRenameComponent(id: string): boolean {
  if (isBuiltinComponent(id)) {
    log.warn('Cannot rename built-in component', { id });
    return false;
  }
  return true;
}

/** Total count of built-in components. */
export function getBuiltinCount(): number {
  return BUILTIN_COMPONENTS.length;
}

/** Resolve a component definition from either built-in or user library. */
export function resolveComponent(id: string): ComponentDefinition | undefined {
  const builtin = getBuiltinById(id);
  if (builtin) return builtin;
  return get(components).find((c) => c.id === id);
}
