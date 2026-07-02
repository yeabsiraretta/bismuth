/**
 * Flow Document payload — navigation flows and state transitions.
 */

/** A single step in a user flow. */
export interface FlowStep {
  id: string;
  screen: string;
  action: string;
  transition: 'navigate' | 'async_load' | 'render' | 'modal' | 'dismiss';
}

/** An error/edge-case path branching from a flow step. */
export interface FlowErrorPath {
  from: string;
  condition: string;
  target: string;
  message?: string;
}

/** Flow document payload. */
export interface FlowPayload {
  flow_name: string;
  description: string;
  steps: FlowStep[];
  error_paths: FlowErrorPath[];
  components_used: string[];
}
