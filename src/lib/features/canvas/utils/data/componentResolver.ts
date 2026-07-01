import type {
  CanvasElement,
  ComponentDefinition,
  ComponentInstanceData,
} from '@/features/canvas/types';

/**
 * Resolves a component instance into renderable elements by merging
 * the definition's master element tree with per-instance overrides.
 *
 * The resolved elements are positioned relative to the instance's
 * (x, y) origin on the canvas.
 *
 * @param instance - The component_instance element on the canvas.
 * @param definition - The ComponentDefinition it references.
 * @returns A new array of CanvasElements ready for rendering.
 */
export function resolveInstance(
  instance: CanvasElement,
  definition: ComponentDefinition
): CanvasElement[] {
  const instanceData = instance.properties as unknown as ComponentInstanceData;
  const overrides = instanceData?.overrides ?? {};

  // Scale factor if instance was resized from the definition's natural size
  const scaleX = instance.width / definition.width;
  const scaleY = instance.height / definition.height;

  return definition.elements.map((defElement) => {
    // Apply positional transform relative to instance origin
    const resolved: CanvasElement = {
      ...defElement,
      id: `${instance.id}::${defElement.id}`,
      x: instance.x + defElement.x * scaleX,
      y: instance.y + defElement.y * scaleY,
      width: defElement.width * scaleX,
      height: defElement.height * scaleY,
      rotation: defElement.rotation + instance.rotation,
      properties: { ...defElement.properties },
    };

    // Apply property overrides from exposed props
    for (const [key, value] of Object.entries(overrides)) {
      const prop = definition.exposedProps.find((p) => p.key === key);
      if (prop) {
        (resolved.properties as Record<string, unknown>)[key] = value;
      }
    }

    return resolved;
  });
}

/**
 * Checks whether a component instance is detached (its definition no longer exists).
 */
export function isDetached(
  instance: CanvasElement,
  definitions: ComponentDefinition[]
): boolean {
  const instanceData = instance.properties as unknown as ComponentInstanceData;
  if (!instanceData?.definitionId) return true;
  return !definitions.some((d) => d.id === instanceData.definitionId);
}

/**
 * Detaches a component instance — converts it into a plain group element
 * by flattening the definition's elements at the instance position.
 */
export function detachInstance(
  instance: CanvasElement,
  definition: ComponentDefinition
): CanvasElement[] {
  const resolved = resolveInstance(instance, definition);
  // Convert to standalone elements (remove synthetic instance-scoped IDs)
  return resolved.map((el, i) => ({
    ...el,
    id: `${instance.id}_detached_${i}`,
    parentId: instance.parentId,
    layer_id: instance.layer_id,
    z_index: instance.z_index + i,
  }));
}

// ─── Override Management ──────────────────────────────────────────────────────

/**
 * Applies a prop override to an instance's properties.
 * Returns a new properties object with the override applied.
 */
export function applyOverride(
  instance: CanvasElement,
  propKey: string,
  value: unknown
): Record<string, unknown> {
  const props = instance.properties as unknown as ComponentInstanceData;
  const overrides = { ...(props?.overrides ?? {}) };
  overrides[propKey] = value;
  return {
    ...(instance.properties as Record<string, unknown>),
    overrides,
  };
}

/**
 * Resets a single override on an instance, reverting to the definition's default.
 */
export function resetOverride(
  instance: CanvasElement,
  propKey: string
): Record<string, unknown> {
  const props = instance.properties as unknown as ComponentInstanceData;
  const overrides = { ...(props?.overrides ?? {}) };
  delete overrides[propKey];
  return {
    ...(instance.properties as Record<string, unknown>),
    overrides,
  };
}

/**
 * Computes effective prop values for an instance by merging
 * the definition's defaults with per-instance overrides.
 */
export function getEffectiveProps(
  instance: CanvasElement,
  definition: ComponentDefinition
): Record<string, unknown> {
  const instanceData = instance.properties as unknown as ComponentInstanceData;
  const overrides = instanceData?.overrides ?? {};

  const effective: Record<string, unknown> = {};
  for (const prop of definition.exposedProps) {
    effective[prop.key] = overrides[prop.key] !== undefined
      ? overrides[prop.key]
      : prop.defaultValue;
  }
  return effective;
}
