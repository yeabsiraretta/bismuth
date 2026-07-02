/**
 * Component Variant System types.
 * Supports variant axes, combinations, and instance-level variant selection.
 */

import type { ElementProperties } from '../elements';

/** A variant axis defining one dimension of variation (e.g., Size, State). */
export interface VariantAxis {
  id: string;
  name: string;
  values: string[];
  defaultValue: string;
}

/** A specific variant combination with element overrides. */
export interface ComponentVariant {
  id: string;
  /** Maps axis IDs to their selected value for this variant. */
  selections: Record<string, string>;
  /** Element overrides that differ from the base component. */
  overrides: VariantOverride[];
}

/** An override applied to a specific element within a variant. */
export interface VariantOverride {
  elementId: string;
  properties: Partial<ElementProperties>;
}

/** Variant selections on a component instance. */
export interface VariantSelections {
  /** Maps axis IDs to the chosen value. */
  [axisId: string]: string;
}
