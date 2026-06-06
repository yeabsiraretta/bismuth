import { get } from 'svelte/store';
import type { ComponentDefinition } from '@/types/canvas';
import { currentCanvas, clearSelection } from './canvasStore';
import { editingComponentId, getComponentById, saveComponentToLibrary, deleteComponentFromLibrary } from './componentLibrary';
import { log } from '@/utils/logger';

/** Snapshot of the canvas elements before entering component edit mode. */
let preEditCanvasSnapshot: unknown[] | null = null;

/**
 * Enters component edit mode: isolates the definition's elements on the canvas
 * so the user can modify the master template.
 */
export function enterComponentEditMode(definitionId: string): void {
  const definition = getComponentById(definitionId);
  if (!definition) return;

  const canvas = get(currentCanvas);
  if (!canvas) return;

  // Snapshot existing elements for restoration
  preEditCanvasSnapshot = JSON.parse(JSON.stringify(canvas.elements));

  // Replace canvas elements with the component's master elements
  currentCanvas.update((c) => {
    if (!c) return c;
    c.elements = JSON.parse(JSON.stringify(definition.elements));
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });

  clearSelection();
  editingComponentId.set(definitionId);
  log.info('Entered component edit mode', { definitionId, name: definition.name });
}

/**
 * Exits component edit mode: saves the edited elements back to the definition,
 * restores the canvas, and triggers re-resolve of all instances.
 */
export async function exitComponentEditMode(): Promise<void> {
  const defId = get(editingComponentId);
  if (!defId) return;

  const definition = getComponentById(defId);
  if (!definition) return;

  const canvas = get(currentCanvas);
  if (!canvas) return;

  // Capture edited elements as the new definition
  const updatedElements = JSON.parse(JSON.stringify(canvas.elements));

  // Compute new bounding box
  const minX = Math.min(...updatedElements.map((e: { x: number }) => e.x), 0);
  const minY = Math.min(...updatedElements.map((e: { y: number }) => e.y), 0);
  const maxX = Math.max(
    ...updatedElements.map((e: { x: number; width: number }) => e.x + e.width),
    0
  );
  const maxY = Math.max(
    ...updatedElements.map((e: { y: number; height: number }) => e.y + e.height),
    0
  );

  const updatedDef: ComponentDefinition = {
    ...definition,
    elements: updatedElements,
    width: maxX - minX,
    height: maxY - minY,
    modified_at: Math.floor(Date.now() / 1000),
  };

  // Save updated definition
  await saveComponentToLibrary(updatedDef);

  // Restore canvas to pre-edit state
  currentCanvas.update((c) => {
    if (!c) return c;
    c.elements = preEditCanvasSnapshot as typeof c.elements;
    c.modified_at = Math.floor(Date.now() / 1000);
    return c;
  });

  preEditCanvasSnapshot = null;
  editingComponentId.set(null);
  clearSelection();

  log.info('Exited component edit mode, definition saved', { id: defId });
}

/**
 * Deletes a component definition and detaches all instances on the current canvas.
 * Detached instances become plain groups.
 */
export async function deleteComponentWithDetach(definitionId: string): Promise<void> {
  const definition = getComponentById(definitionId);

  // Convert all instances of this component to plain groups on current canvas
  if (definition) {
    currentCanvas.update((c) => {
      if (!c) return c;
      const newElements = [];
      for (const el of c.elements) {
        if (
          el.element_type === 'component_instance' &&
          (el.properties as Record<string, unknown>).definitionId === definitionId
        ) {
          // Flatten to group
          newElements.push({
            ...el,
            element_type: 'group' as const,
            name: `${el.name ?? definition.name} (detached)`,
            properties: { ...el.properties, definitionId: undefined, overrides: undefined },
          });
        } else {
          newElements.push(el);
        }
      }
      c.elements = newElements;
      c.modified_at = Math.floor(Date.now() / 1000);
      return c;
    });
  }

  // Delete from library
  await deleteComponentFromLibrary(definitionId);
  log.info('Deleted component and detached instances', { definitionId });
}
