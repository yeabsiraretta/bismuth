/**
 * Pure logic helpers for CanvasLibrary component.
 * No Svelte store reactivity — all functions accept values as arguments.
 */
import type { CanvasDocument } from '@/features/canvas/types';

export type ViewMode = 'grid' | 'list';
export type SortField = 'modified_at' | 'created_at' | 'name';

/** Sorts a list of canvas documents by the given field. Descending for timestamps, ascending for name. */
export function sortCanvases(list: CanvasDocument[], field: SortField): CanvasDocument[] {
  return [...list].sort((a, b) => {
    if (field === 'name') return a.name.localeCompare(b.name);
    return (b[field] as number) - (a[field] as number);
  });
}

/** Filters a list of canvas documents by a case-insensitive search query against the name. */
export function filterCanvases(list: CanvasDocument[], query: string): CanvasDocument[] {
  const lower = query.toLowerCase();
  return list.filter((c) => c.name.toLowerCase().includes(lower));
}

/** Returns the default library state values. */
export function defaultLibraryState(): {
  searchQuery: string;
  isCreating: boolean;
  newCanvasName: string;
  useDesignTemplate: boolean;
  viewMode: ViewMode;
  sortField: SortField;
} {
  return {
    searchQuery: '',
    isCreating: false,
    newCanvasName: '',
    useDesignTemplate: false,
    viewMode: 'grid',
    sortField: 'modified_at',
  };
}
