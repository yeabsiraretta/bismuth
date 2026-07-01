/**
 * Variant resolver service.
 * Resolves variant overrides for component instances during rendering.
 */

import type { ComponentDefinition, ComponentInstanceData } from '@/features/canvas/types/components';
import type { VariantSelections } from '@/features/canvas/types/design/variants';
import type { CanvasElement } from '@/features/canvas/types/elements';
import { resolveVariant, applyOverrides } from '@/features/canvas/stores/design/variantStore';

/**
 * Resolves a component instance's element tree with variant overrides applied.
 * T025: Apply variant selections to produce the correct visual output.
 */
export function resolveInstanceElements(
  definition: ComponentDefinition,
  instance: ComponentInstanceData,
): CanvasElement[] {
  const selections: VariantSelections = instance.variantSelections ?? {};

  // Get the overrides for the current selections
  const overrides = resolveVariant(definition, selections);

  if (overrides.length === 0) {
    return definition.elements;
  }

  // Apply overrides to each element that has a matching override
  return definition.elements.map((element) => {
    const updatedProps = applyOverrides(
      element.properties,
      overrides,
      element.id,
    );

    if (updatedProps === element.properties) {
      return element;
    }

    return { ...element, properties: updatedProps };
  });
}

/**
 * Checks whether a definition has any defined variants.
 */
export function hasVariants(definition: ComponentDefinition): boolean {
  return (definition.variantAxes?.length ?? 0) > 0;
}

/**
 * Gets the default selections (first value of each axis).
 */
export function getDefaultSelections(definition: ComponentDefinition): VariantSelections {
  const selections: VariantSelections = {};
  for (const axis of definition.variantAxes ?? []) {
    selections[axis.id] = axis.defaultValue;
  }
  return selections;
}
