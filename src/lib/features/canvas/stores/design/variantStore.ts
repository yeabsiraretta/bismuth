import type {
  VariantAxis,
  ComponentVariant,
  VariantOverride,
  VariantSelections,
} from '@/features/canvas/types/design';
import type { ComponentDefinition } from '@/features/canvas/types/components';
import type { ElementProperties } from '@/features/canvas/types/elements';
import { log } from '@/utils/logger';

// ─── Constants (SC-07) ──────────────────────────────────────────────────────

const MAX_AXES_PER_COMPONENT = 4;
const MAX_VALUES_PER_AXIS = 20;
const MAX_AXIS_NAME_LENGTH = 64;
const COMBINATION_WARNING_THRESHOLD = 50;

// ─── Resolution Cache ───────────────────────────────────────────────────────

const resolutionCache = new Map<string, VariantOverride[]>();

function cacheKey(defId: string, selections: VariantSelections): string {
  const sorted = Object.entries(selections).sort(([a], [b]) => a.localeCompare(b));
  return `${defId}::${sorted.map(([k, v]) => `${k}=${v}`).join(',')}`;
}

// ─── Axis Management ────────────────────────────────────────────────────────

/**
 * Validates and adds an axis to a component definition.
 * Enforces SC-07: max 4 axes, 64 char name, 20 values/axis.
 */
export function addAxis(
  definition: ComponentDefinition,
  axis: VariantAxis
): ComponentDefinition | { error: string } {
  const axes = definition.variantAxes ?? [];

  if (axes.length >= MAX_AXES_PER_COMPONENT) {
    return { error: `Maximum ${MAX_AXES_PER_COMPONENT} axes per component` };
  }
  if (axis.name.length > MAX_AXIS_NAME_LENGTH) {
    return { error: `Axis name must be ≤${MAX_AXIS_NAME_LENGTH} characters` };
  }
  if (axis.values.length > MAX_VALUES_PER_AXIS) {
    return { error: `Maximum ${MAX_VALUES_PER_AXIS} values per axis` };
  }

  // SC-07: Strip invalid characters from axis name
  const safeName = axis.name.replace(/[/\\:\0]/g, '');
  if (!safeName.trim()) {
    return { error: 'Invalid axis name' };
  }

  const updatedAxes = [...axes, { ...axis, name: safeName }];
  const totalCombos = updatedAxes.reduce((acc, a) => acc * a.values.length, 1);
  if (totalCombos > COMBINATION_WARNING_THRESHOLD) {
    log.warn('High variant combination count', { defId: definition.id, count: totalCombos });
  }

  resolutionCache.clear();
  return {
    ...definition,
    variantAxes: updatedAxes,
  };
}

/**
 * Removes an axis from a component definition, cleaning up related variants.
 */
export function removeAxis(definition: ComponentDefinition, axisId: string): ComponentDefinition {
  const axes = (definition.variantAxes ?? []).filter((a) => a.id !== axisId);
  const variants = (definition.variants ?? []).map((v) => {
    const { [axisId]: _removedAxis, ...rest } = v.selections;
    void _removedAxis;
    return { ...v, selections: rest };
  });

  resolutionCache.clear();
  return { ...definition, variantAxes: axes, variants };
}

// ─── Variant CRUD ───────────────────────────────────────────────────────────

/**
 * Creates a new variant combination.
 */
export function createVariant(
  definition: ComponentDefinition,
  selections: VariantSelections,
  overrides: VariantOverride[] = []
): ComponentDefinition {
  const variant: ComponentVariant = {
    id: crypto.randomUUID(),
    selections,
    overrides,
  };

  resolutionCache.clear();
  return {
    ...definition,
    variants: [...(definition.variants ?? []), variant],
  };
}

/**
 * Deletes a variant from a component definition.
 */
export function deleteVariant(
  definition: ComponentDefinition,
  variantId: string
): ComponentDefinition {
  resolutionCache.clear();
  return {
    ...definition,
    variants: (definition.variants ?? []).filter((v) => v.id !== variantId),
  };
}

/**
 * Updates overrides on a specific variant.
 */
export function updateVariantOverrides(
  definition: ComponentDefinition,
  variantId: string,
  overrides: VariantOverride[]
): ComponentDefinition {
  resolutionCache.clear();
  return {
    ...definition,
    variants: (definition.variants ?? []).map((v) =>
      v.id === variantId ? { ...v, overrides } : v
    ),
  };
}

// ─── Resolution ─────────────────────────────────────────────────────────────

/**
 * Resolves the matching variant overrides for given selections.
 * Uses memoized cache per definition + selections hash.
 */
export function resolveVariant(
  definition: ComponentDefinition,
  selections: VariantSelections
): VariantOverride[] {
  const key = cacheKey(definition.id, selections);
  const cached = resolutionCache.get(key);
  if (cached) return cached;

  const variants = definition.variants ?? [];
  const match = variants.find((v) => {
    return Object.entries(v.selections).every(([axisId, value]) => selections[axisId] === value);
  });

  const result = match?.overrides ?? [];
  resolutionCache.set(key, result);
  return result;
}

/**
 * Applies variant overrides to an element's properties.
 */
export function applyOverrides(
  baseProperties: ElementProperties,
  overrides: VariantOverride[],
  elementId: string
): ElementProperties {
  const override = overrides.find((o) => o.elementId === elementId);
  if (!override) return baseProperties;
  return { ...baseProperties, ...override.properties };
}

/**
 * Returns all possible variant combinations for a component.
 */
export function getAllCombinations(definition: ComponentDefinition): VariantSelections[] {
  const axes = definition.variantAxes ?? [];
  if (axes.length === 0) return [];

  const result: VariantSelections[] = [];

  function generate(index: number, current: VariantSelections) {
    if (index === axes.length) {
      result.push({ ...current });
      return;
    }
    const axis = axes[index];
    for (const value of axis.values) {
      current[axis.id] = value;
      generate(index + 1, current);
    }
  }

  generate(0, {});
  return result;
}

/**
 * Clears the variant resolution cache (call after definition changes).
 */
export function clearVariantCache(): void {
  resolutionCache.clear();
}
