/**
 * Arbor branching note types.
 * A single markdown note is decomposed into a tree of blocks.
 * Storage: visible block markers + hidden metadata comment in the same .md file.
 */

/** A single block in the branching tree. */
export interface ArborBlock {
  id: string;
  parentId: string | null;
  order: number;
  content: string;
  collapsed: boolean;
}

/** The full block tree structure for one note. */
export interface ArborTree {
  noteId: string;
  notePath: string;
  blocks: ArborBlock[];
  version: number;
}

/** Metadata stored as hidden comment at the end of the note. */
export interface ArborMetadata {
  version: number;
  blocks: ArborBlockMeta[];
}

/** Minimal block metadata for the hidden comment. */
export interface ArborBlockMeta {
  id: string;
  parentId: string | null;
  order: number;
}

/** Selection state for the editor. */
export interface ArborSelection {
  blockId: string | null;
  editing: boolean;
}

/** Layout node for spatial positioning. */
export interface ArborLayoutNode {
  block: ArborBlock;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  children: ArborLayoutNode[];
}

/** Configuration for the arbor editor. */
export interface ArborConfig {
  cardWidth: number;
  cardMinHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  zoom: number;
  showBreadcrumbs: boolean;
  dragEnabled: boolean;
  previewSnippetLength: number;
}

export const DEFAULT_ARBOR_CONFIG: ArborConfig = {
  cardWidth: 280,
  cardMinHeight: 100,
  horizontalSpacing: 24,
  verticalSpacing: 12,
  zoom: 1,
  showBreadcrumbs: true,
  dragEnabled: true,
  previewSnippetLength: 200,
};

/** Generate a unique block ID. */
export function generateBlockId(): string {
  return `b-${crypto.randomUUID().slice(0, 12)}`;
}

/** Get root blocks (no parent). */
export function getRootBlocks(blocks: ArborBlock[]): ArborBlock[] {
  return blocks.filter(b => b.parentId === null).sort((a, b) => a.order - b.order);
}

/** Get children of a block, sorted by order. */
export function getChildren(blocks: ArborBlock[], parentId: string): ArborBlock[] {
  return blocks.filter(b => b.parentId === parentId).sort((a, b) => a.order - b.order);
}

/** Get the ancestry chain from a block up to root. */
export function getAncestors(blocks: ArborBlock[], blockId: string): ArborBlock[] {
  const ancestors: ArborBlock[] = [];
  let current = blocks.find(b => b.id === blockId);
  while (current && current.parentId) {
    const parent = blocks.find(b => b.id === current!.parentId);
    if (parent) { ancestors.unshift(parent); current = parent; }
    else break;
  }
  return ancestors;
}

/** Get all descendants of a block (recursive). */
export function getDescendants(blocks: ArborBlock[], blockId: string): ArborBlock[] {
  const children = getChildren(blocks, blockId);
  const result: ArborBlock[] = [...children];
  for (const child of children) {
    result.push(...getDescendants(blocks, child.id));
  }
  return result;
}
