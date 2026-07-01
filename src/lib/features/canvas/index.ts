// Canvas feature — public API barrel
// Internal paths: @/features/canvas/{stores,services,components,utils,types}
export { default as CanvasApp } from './components/CanvasApp.svelte';
export { currentCanvas, viewport, canvasSettings, activeTool, selectedElements, loadCanvas } from './stores/elements/canvasStore';
export { getColumns, type KanbanGroupBy } from './components/kanban/kanbanLogic';
export type { CanvasElement, CanvasSettings, NodeShape, ArrowHeadStyle, EdgePathfinding, BorderStyle } from './types';
export type { ComponentDefinition } from './types';
export type { CanvasDocument, CanvasVariable, Page } from './types/document';
export type { FlowLink } from './types/components';

// Workspace interaction modes
export {
  focusModeEnabled, focusedElementId, toggleFocusMode, focusElement, exitFocusMode,
  edgeHighlightEnabled, highlightedEdgeIds, toggleEdgeHighlight,
  toggleCollapse, setCollapsed, getGroupChildren,
} from './stores/workspace/canvasInteractionModes';
export {
  bringToFront, sendToBack, bringForward, sendBackward,
} from './stores/workspace/canvasZOrder';
