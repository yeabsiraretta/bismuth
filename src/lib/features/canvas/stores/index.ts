/**
 * Canvas stores barrel — public API for all canvas state.
 *
 * External consumers MUST import from this barrel:
 *   import { currentCanvas, selectedElements } from '@/features/canvas/stores'
 *
 * Sub-domain groupings:
 *   elements/    — canvasStore, canvasElements
 *   library/     — componentLibrary, builtinLibrary, componentEditMode
 *   arrangement/ — canvasArrangement, canvasArrangementHelpers
 *   history/     — historyStore
 *   presentation/— slidesStore
 */

// ─── Elements ─────────────────────────────────────────────────────────────────
export * from './elements/canvasStore';
export * from './elements/canvasElements';

// ─── Library ──────────────────────────────────────────────────────────────────
export * from './library/componentLibrary';
export * from './library/builtinLibrary';
export * from './library/componentEditMode';

// ─── Arrangement ──────────────────────────────────────────────────────────────
export * from './arrangement/canvasArrangement';
export * from './arrangement/canvasArrangementHelpers';

// ─── History ──────────────────────────────────────────────────────────────────
export * from './history/historyStore';

// ─── Presentation ─────────────────────────────────────────────────────────────
export * from './presentation/slidesStore';

// ─── Workspace (focus, edge highlight, collapsible groups, z-order) ───────
export * from './workspace/canvasInteractionModes';
export * from './workspace/canvasZOrder';
