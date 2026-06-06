/**
 * Auto Layout Engine — barrel re-export.
 * Implementation split into autoLayout/ directory.
 */

export type { LayoutResult } from './autoLayout/algorithm';
export { computeAutoLayout, applyAutoLayout, hugContents, createAutoLayout } from './autoLayout/algorithm';

export type { GridLayout, GridPlacement } from './autoLayout/constraints';
export { computeGridLayout, createGridLayout } from './autoLayout/constraints';
