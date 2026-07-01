/**
 * Canvas element factory — barrel re-exporting node and edge factories.
 * Node elements (shapes, frames): elementFactory.node.ts
 * Edge elements (lines, arrows, paths): elementFactory.edge.ts
 */
export { generateId } from '@/utils/id';
export { createRectangle, createCircle, createText, createFrame, createScreen } from './elementFactory.node';
export { createLine, createArrow, createPenPath } from './elementFactory.edge';
