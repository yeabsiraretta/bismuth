import type { Point } from './settings';

/** Trigger type for an interaction. */
export type InteractionTrigger = 'click' | 'hover' | 'press' | 'drag' | 'key_down' | 'mouse_enter' | 'mouse_leave' | 'after_timeout';

/** Action performed when an interaction triggers. */
export type InteractionAction =
  | { type: 'navigate'; destination: string; transition?: Transition }
  | { type: 'open_overlay'; overlayId: string; position?: Point }
  | { type: 'close_overlay' }
  | { type: 'swap_variant'; variantSelections: Record<string, string> }
  | { type: 'set_variable'; variableId: string; value: unknown }
  | { type: 'scroll_to'; nodeId: string; behavior?: 'smooth' | 'instant' };

/** Transition animation between states/frames. */
export interface Transition {
  type: 'instant' | 'dissolve' | 'smart_animate' | 'slide_in' | 'slide_out' | 'push' | 'move_in' | 'move_out';
  duration: number;
  easing: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'spring' | 'custom';
  /** Custom cubic-bezier control points. */
  customEasing?: [number, number, number, number];
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

/** A complete interaction definition on an element. */
export interface Interaction {
  trigger: InteractionTrigger;
  action: InteractionAction;
  /** Delay in ms before action fires (e.g., for after_timeout). */
  delay?: number;
}

/** Links a canvas element/component to its code implementation. */
export interface CodeConnect {
  /** Import path for the component (e.g., "@/components/ui/button"). */
  componentPath: string;
  /** Import statement (e.g., "import { Button } from '@/components/ui/button'"). */
  importStatement: string;
  /** Maps canvas property names to code prop names. */
  propsMapping: Record<string, string>;
  /** Example usage code snippet. */
  exampleCode: string;
  /** Target framework. */
  framework: 'svelte' | 'react' | 'vue' | 'html';
}

/** Grid layout configuration stored on a frame element. */
export interface GridLayoutConfig {
  columns: number | { mode: 'auto-fill' | 'auto-fit'; minWidth: number };
  rows: number;
  gap: number;
  columnGap?: number;
  rowGap?: number;
  alignItems: 'start' | 'center' | 'end' | 'stretch';
  justifyItems: 'start' | 'center' | 'end' | 'stretch';
}

/** A reusable style definition that can be applied to multiple elements. */
export interface SharedStyle {
  id: string;
  name: string;
  description?: string;
  type: 'fill' | 'stroke' | 'text' | 'effect';
  /** The style's property values (Partial<ElementProperties>). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: Record<string, any>;
}
