/**
 * GraphFilter logic — filter state computation and dispatch helpers.
 * Extracted from GraphFilter.svelte for 300-line compliance.
 */

export interface GraphFilterState {
  tags: string[];
  types: string[];
  folder: string;
  depth: number;
}

/** Builds filter state from current selections. */
export function buildFilterState(
  selectedTags: string[],
  selectedTypes: string[],
  folderFilter: string,
  linkDepth: number
): GraphFilterState {
  return {
    tags: selectedTags,
    types: selectedTypes,
    folder: folderFilter,
    depth: linkDepth,
  };
}

/** Toggles an item in a string array (add if missing, remove if present). */
export function toggleArrayItem(arr: string[], item: string): string[] {
  if (arr.includes(item)) {
    return arr.filter((t) => t !== item);
  }
  return [...arr, item];
}

/** Returns the default/cleared filter state. */
export function getDefaultFilterState(): GraphFilterState {
  return { tags: [], types: [], folder: '', depth: 3 };
}
