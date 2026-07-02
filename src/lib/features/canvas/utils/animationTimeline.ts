/**
 * Animation Timeline Stub (T142)
 *
 * Defines types and functions for canvas element transitions and animation states.
 * Provides a foundation for animated state machines between component states.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** A named snapshot of element properties representing one visual state. */
export interface AnimationState {
  /** Unique state identifier (e.g. 'default', 'hover', 'pressed'). */
  id: string;
  /** Human-readable label. */
  name: string;
  /** Element property overrides active in this state. */
  properties: Record<string, unknown>;
}

/** What causes a state transition to fire. */
export type TransitionTrigger =
  'click' | 'hover' | 'hover-out' | 'focus' | 'blur' | 'auto' | 'drag';

/** Easing function identifier. */
export type EasingFunction = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

/** A directed edge in the animation state machine. */
export interface Transition {
  /** Unique transition identifier. */
  id: string;
  /** Source state ID. */
  fromStateId: string;
  /** Destination state ID. */
  toStateId: string;
  /** Duration in milliseconds. */
  duration: number;
  /** Easing function name. */
  easing: EasingFunction;
  /** What triggers this transition. */
  trigger: TransitionTrigger;
  /** Optional delay in milliseconds before the transition starts. */
  delay: number;
}

/** Full animation timeline attached to a component or element. */
export interface AnimationTimeline {
  /** Element or component ID this timeline belongs to. */
  elementId: string;
  /** All named states. */
  states: AnimationState[];
  /** All transitions between states. */
  transitions: Transition[];
  /** ID of the initial/default state. */
  initialStateId: string;
}

// ─── Factory Functions ────────────────────────────────────────────────────────

let _nextId = 1;
function nextId(prefix: string): string {
  return `${prefix}_${_nextId++}`;
}

/**
 * Creates a transition between two states with the given parameters.
 *
 * @param fromStateId - Source state ID.
 * @param toStateId - Destination state ID.
 * @param duration - Duration in milliseconds.
 * @param easing - CSS easing function name.
 * @param trigger - What event triggers this transition (defaults to 'click').
 */
export function createTransition(
  fromStateId: string,
  toStateId: string,
  duration: number,
  easing: string,
  trigger: TransitionTrigger = 'click'
): Transition {
  return {
    id: nextId('tr'),
    fromStateId,
    toStateId,
    duration,
    easing: easing as EasingFunction,
    trigger,
    delay: 0,
  };
}

/**
 * Creates a named animation state with optional property overrides.
 *
 * @param name - Human-readable state name.
 * @param properties - Element property values for this state.
 */
export function createAnimationState(
  name: string,
  properties: Record<string, unknown> = {}
): AnimationState {
  return {
    id: nextId('state'),
    name,
    properties,
  };
}

/**
 * Creates an empty animation timeline for the given element.
 *
 * @param elementId - The element or component this timeline belongs to.
 * @param initialState - The starting state (created automatically if not provided).
 */
export function createAnimationTimeline(
  elementId: string,
  initialState?: AnimationState
): AnimationTimeline {
  const defaultState = initialState ?? createAnimationState('default');
  return {
    elementId,
    states: [defaultState],
    transitions: [],
    initialStateId: defaultState.id,
  };
}

// ─── Application ──────────────────────────────────────────────────────────────

/**
 * Applies a transition's CSS properties to a DOM element.
 * Uses the Web Animations API when available, falls back to inline style.
 *
 * @param element - Target DOM element.
 * @param transition - The transition descriptor to apply.
 */
export function applyTransition(element: HTMLElement, transition: Transition): void {
  const { duration, easing, delay } = transition;
  element.style.transition = `all ${duration}ms ${easing} ${delay}ms`;
}

/**
 * Returns all transitions that can fire from a given state and trigger.
 *
 * @param timeline - The animation timeline to search.
 * @param fromStateId - Current state ID.
 * @param trigger - The event that occurred.
 */
export function getTransitionsFor(
  timeline: AnimationTimeline,
  fromStateId: string,
  trigger: TransitionTrigger
): Transition[] {
  return timeline.transitions.filter((t) => t.fromStateId === fromStateId && t.trigger === trigger);
}
