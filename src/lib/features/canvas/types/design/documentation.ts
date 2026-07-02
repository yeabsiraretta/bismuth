/**
 * Design System Documentation types.
 * Component documentation, annotations, and change tracking.
 */

/** Documentation attached to a component definition. */
export interface ComponentDoc {
  componentId: string;
  description: string;
  usageGuidelines: string;
  accessibilityNotes: string;
  doExamples: string[];
  dontExamples: string[];
  changeLog: DocChange[];
}

/** A single change entry in component documentation history. */
export interface DocChange {
  date: string;
  author: string;
  description: string;
}

/** A canvas annotation (sticky note). */
export interface CanvasAnnotation {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  visible: boolean;
}
