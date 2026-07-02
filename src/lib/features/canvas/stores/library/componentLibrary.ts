import { writable, derived, get } from 'svelte/store';
import type { ComponentDefinition } from '@/features/canvas/types';
import * as componentService from '@/features/canvas/services/components';
import {
  currentCanvas,
  selectedElements,
  clearSelection,
  selectElement,
} from '../elements/canvasStore';
import { addElement } from '../elements/canvasElements';
import { BUILTIN_COMPONENTS } from '@/config/presets/canvas-library';
import { generatePrefixedId } from '@/utils/id';
import { log } from '@/utils/logger';

/** Returns true if the component ID belongs to the built-in library. */
function isBuiltin(id: string): boolean {
  return BUILTIN_COMPONENTS.some((c) => c.id === id);
}

// ─── State ───────────────────────────────────────────────────────────────────

/** All component definitions in the vault library. */
export const components = writable<ComponentDefinition[]>([]);

/** Whether the library is currently loading. */
export const isLoading = writable<boolean>(false);

/** Current search/filter query for the library panel. */
export const searchQuery = writable<string>('');

/** Active category filter (null = show all). */
export const categoryFilter = writable<string | null>(null);

/** ID of the component currently being edited (null = not in edit mode). */
export const editingComponentId = writable<string | null>(null);

// ─── Derived ─────────────────────────────────────────────────────────────────

/** All unique categories from loaded components. */
export const categories = derived(components, ($components) => {
  const cats = new Set<string>();
  for (const comp of $components) {
    if (comp.category) cats.add(comp.category);
  }
  return Array.from(cats).sort();
});

/** Filtered components based on search query and category. */
export const filteredComponents = derived(
  [components, searchQuery, categoryFilter],
  ([$components, $query, $category]) => {
    let result = $components;

    if ($category) {
      result = result.filter((c) => c.category === $category);
    }

    if ($query) {
      const q = $query.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }
);

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Loads all component definitions from the vault. */
export async function loadLibrary(): Promise<void> {
  isLoading.set(true);
  try {
    const list = await componentService.listComponents();
    components.set(list);
    log.info('Component library: loaded', { count: list.length });
  } catch (error) {
    log.error('Component library: failed to load', error as Error);
  } finally {
    isLoading.set(false);
  }
}

/** Creates or updates a component definition and refreshes the store. */
export async function saveComponentToLibrary(
  component: ComponentDefinition
): Promise<ComponentDefinition> {
  // Guard: builtin components cannot be renamed or overwritten
  const isExisting = get(components).some((c) => c.id === component.id);
  if (isExisting && isBuiltin(component.id)) {
    log.warn('saveComponentToLibrary: blocked rename of built-in component', { id: component.id });
    return component;
  }
  const saved = await componentService.saveComponent(component);
  // Update in-place or append
  components.update((list) => {
    const idx = list.findIndex((c) => c.id === saved.id);
    if (idx >= 0) {
      list[idx] = saved;
      return [...list];
    }
    return [...list, saved];
  });
  return saved;
}

/** Deletes a component definition from library and store. */
export async function deleteComponentFromLibrary(id: string): Promise<void> {
  if (isBuiltin(id)) {
    log.warn('deleteComponentFromLibrary: blocked deletion of built-in component', { id });
    return;
  }
  await componentService.deleteComponent(id);
  components.update((list) => list.filter((c) => c.id !== id));
}

/** Gets a component definition by ID from user library or built-in registry. */
export function getComponentById(id: string): ComponentDefinition | undefined {
  const user = get(components).find((c) => c.id === id);
  if (user) return user;
  return BUILTIN_COMPONENTS.find((c) => c.id === id);
}

/** Sets the component library search query. */
export function setSearchQuery(query: string): void {
  searchQuery.set(query);
}

/** Sets the active category filter (null = show all). */
export function setCategoryFilter(category: string | null): void {
  categoryFilter.set(category);
}

/** Clears both search query and category filter. */
export function clearFilters(): void {
  searchQuery.set('');
  categoryFilter.set(null);
}

/**
 * Creates a component definition from the currently selected canvas elements.
 * Removes the selected elements from the canvas and replaces them with a single
 * component instance element linked to the new definition.
 *
 * @param name - User-provided component name.
 * @param category - Optional category for library organization.
 * @returns The created ComponentDefinition.
 */
export async function createComponentFromSelection(
  name: string,
  category?: string
): Promise<ComponentDefinition | null> {
  const canvas = get(currentCanvas);
  const selectedIds = get(selectedElements);

  if (!canvas || selectedIds.length === 0) {
    log.warn('createComponentFromSelection: no selection');
    return null;
  }

  // Gather selected elements
  const selectedEls = canvas.elements.filter((e) => selectedIds.includes(e.id));
  if (selectedEls.length === 0) return null;

  // Compute bounding box of selected elements
  const minX = Math.min(...selectedEls.map((e) => e.x));
  const minY = Math.min(...selectedEls.map((e) => e.y));
  const maxX = Math.max(...selectedEls.map((e) => e.x + e.width));
  const maxY = Math.max(...selectedEls.map((e) => e.y + e.height));
  const width = maxX - minX;
  const height = maxY - minY;

  // Normalize element positions relative to component origin (0,0)
  const normalizedElements = selectedEls.map((e) => ({
    ...e,
    x: e.x - minX,
    y: e.y - minY,
  }));

  const now = Math.floor(Date.now() / 1000);
  const id = generatePrefixedId('comp');

  const definition: ComponentDefinition = {
    id,
    name,
    category,
    elements: normalizedElements,
    exposedProps: [],
    width,
    height,
    tags: [],
    created_at: now,
    modified_at: now,
  };

  // Save to backend
  const saved = await saveComponentToLibrary(definition);

  // Remove original elements from canvas
  currentCanvas.update((c) => {
    if (!c) return c;
    c.elements = c.elements.filter((e) => !selectedIds.includes(e.id));
    c.modified_at = now;
    return c;
  });

  clearSelection();

  // Place a component instance at the original bounding box position
  const instanceId = generatePrefixedId('inst');
  const instanceElement = {
    id: instanceId,
    element_type: 'component_instance' as const,
    x: minX,
    y: minY,
    width,
    height,
    rotation: 0,
    properties: {
      definitionId: saved.id,
      overrides: {},
    },
    layer_id: selectedEls[0].layer_id,
    z_index: Math.max(...selectedEls.map((e) => e.z_index)),
    locked: false,
    visible: true,
    name: saved.name,
  };

  addElement(instanceElement);
  selectElement(instanceId);

  log.info('Created component from selection', {
    id: saved.id,
    name: saved.name,
    elementCount: normalizedElements.length,
  });
  return saved;
}

/**
 * Places a component instance on the canvas at the specified position.
 *
 * @param definitionId - The ComponentDefinition.id to instantiate.
 * @param x - Canvas X position.
 * @param y - Canvas Y position.
 * @returns The created instance element ID.
 */
export function placeComponentInstance(definitionId: string, x: number, y: number): string | null {
  const definition = getComponentById(definitionId);
  if (!definition) {
    log.warn('placeComponentInstance: definition not found', { definitionId });
    return null;
  }

  const instanceId = generatePrefixedId('inst');
  const instanceElement = {
    id: instanceId,
    element_type: 'component_instance' as const,
    x,
    y,
    width: definition.width,
    height: definition.height,
    rotation: 0,
    properties: {
      definitionId: definition.id,
      overrides: {},
    },
    layer_id: 'default',
    z_index: 0,
    locked: false,
    visible: true,
    name: definition.name,
  };

  addElement(instanceElement);
  clearSelection();
  selectElement(instanceId);

  log.info('Placed component instance', { definitionId, instanceId, x, y });
  return instanceId;
}
