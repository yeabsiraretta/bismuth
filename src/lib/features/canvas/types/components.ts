import type { CanvasElement } from '@/features/canvas/types/elements';
import type { VariantAxis, ComponentVariant } from '@/features/canvas/types/design/variants';

/** A reusable component (symbol) that can be instantiated on the canvas. */
export interface ComponentDefinition {
  id: string;
  name: string;
  description?: string;
  category?: string;
  /** The master element tree for this component */
  elements: CanvasElement[];
  /** Exposed props that instances can override */
  exposedProps: ComponentProp[];
  width: number;
  height: number;
  /** Base64 PNG preview for library panel */
  thumbnail?: string;
  /** Searchable tags for library organization */
  tags?: string[];
  /** Whether this is a built-in (non-editable) library component */
  isBuiltin?: boolean;
  /** Icon name for library panel preview (from icons.ts registry) */
  icon?: string;
  /** Variant axes for multi-dimensional component variants (max 4). */
  variantAxes?: VariantAxis[];
  /** Defined variant combinations with their overrides. */
  variants?: ComponentVariant[];
  created_at: number;
  modified_at: number;
}

/** Properties specific to a component instance element. */
export interface ComponentInstanceData {
  /** Reference to the ComponentDefinition.id */
  definitionId: string;
  /** Per-instance prop overrides keyed by ComponentProp.key */
  overrides: Record<string, unknown>;
  /** Per-instance variant selections */
  variantSelections?: Record<string, string>;
}

/** A navigational connection between frames in a canvas document. */
export interface FlowLink {
  id: string;
  /** Source frame element ID */
  fromFrameId: string;
  /** Target frame element ID */
  toFrameId: string;
  /** Click target within source frame (optional) */
  hotspotElementId?: string;
  /** Transition style */
  transition: FlowTransition;
  /** Optional edge label */
  label?: string;
}

/** Transition animation for flow link navigation. */
export interface FlowTransition {
  type: 'instant' | 'dissolve' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down';
  /** Duration in ms (0 = instant) */
  duration: number;
}

/** An overridable property exposed by a component definition. */
export interface ComponentProp {
  key: string;
  label: string;
  type: 'text' | 'color' | 'boolean' | 'number' | 'image';
  defaultValue: unknown;
}
