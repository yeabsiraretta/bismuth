/**
 * Arbor store — block tree state, selection, navigation, and undo/redo.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { ArborBlock, ArborTree, ArborSelection, ArborConfig } from '../types';
import {
  generateBlockId,
  getChildren,
  getRootBlocks,
  getAncestors,
  DEFAULT_ARBOR_CONFIG,
} from '../types';
import { parseArborNote, serializeArborNote } from '../services/parser';

/** The active arbor tree. */
export const arborTree = writable<ArborTree | null>(null);

/** Current selection state. */
export const arborSelection = writable<ArborSelection>({ blockId: null, editing: false });

/** Editor configuration. */
export const arborConfig = writable<ArborConfig>(loadConfig());

/** Undo history stack. */
const undoStack = writable<ArborTree[]>([]);
const redoStack = writable<ArborTree[]>([]);

/** Derived: selected block object. */
export const selectedBlock = derived(
  [arborTree, arborSelection],
  ([$tree, $sel]) => $tree?.blocks.find((b) => b.id === $sel.blockId) ?? null
);

/** Derived: breadcrumb path for selected block. */
export const breadcrumbPath = derived([arborTree, arborSelection], ([$tree, $sel]) => {
  if (!$tree || !$sel.blockId) return [];
  const ancestors = getAncestors($tree.blocks, $sel.blockId);
  const current = $tree.blocks.find((b) => b.id === $sel.blockId);
  return current ? [...ancestors, current] : ancestors;
});

/** Derived: root blocks. */
export const rootBlocks = derived(arborTree, ($tree) => ($tree ? getRootBlocks($tree.blocks) : []));

function loadConfig(): ArborConfig {
  try {
    const stored = localStorage.getItem('bismuth-arbor-config');
    return stored ? { ...DEFAULT_ARBOR_CONFIG, ...JSON.parse(stored) } : DEFAULT_ARBOR_CONFIG;
  } catch {
    return DEFAULT_ARBOR_CONFIG;
  }
}

/** Initialize arbor view from note content. */
export function initArborFromContent(content: string, notePath: string): void {
  const tree = parseArborNote(content, notePath);
  arborTree.set(tree);
  arborSelection.set({ blockId: tree.blocks[0]?.id ?? null, editing: false });
  undoStack.set([]);
  redoStack.set([]);
  log.info('Arbor tree initialized', { path: notePath, blocks: tree.blocks.length });
}

/** Push current state to undo stack before mutation. */
function pushUndo(): void {
  const tree = get(arborTree);
  if (tree) {
    undoStack.update((s) => [...s.slice(-49), structuredClone(tree)]);
    redoStack.set([]);
  }
}

/** Undo last action. */
export function arborUndo(): void {
  const prev = get(undoStack);
  if (prev.length === 0) return;
  const current = get(arborTree);
  if (current) redoStack.update((s) => [...s, structuredClone(current)]);
  const restored = prev[prev.length - 1];
  undoStack.update((s) => s.slice(0, -1));
  arborTree.set(restored);
}

/** Redo last undone action. */
export function arborRedo(): void {
  const next = get(redoStack);
  if (next.length === 0) return;
  const current = get(arborTree);
  if (current) undoStack.update((s) => [...s, structuredClone(current)]);
  const restored = next[next.length - 1];
  redoStack.update((s) => s.slice(0, -1));
  arborTree.set(restored);
}

/** Select a block. */
export function selectBlock(blockId: string | null): void {
  arborSelection.set({ blockId, editing: false });
}

/** Enter edit mode for selected block. */
export function enterEditMode(): void {
  arborSelection.update((s) => ({ ...s, editing: true }));
}

/** Exit edit mode. */
export function exitEditMode(): void {
  arborSelection.update((s) => ({ ...s, editing: false }));
}

/** Update a block's content. */
export function updateBlockContent(blockId: string, content: string): void {
  pushUndo();
  arborTree.update((tree) => {
    if (!tree) return tree;
    return { ...tree, blocks: tree.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)) };
  });
}

/** Create a new child block to the right. */
export function createChildBlock(parentId: string): string {
  pushUndo();
  const tree = get(arborTree);
  if (!tree) return '';
  const siblings = getChildren(tree.blocks, parentId);
  const newBlock: ArborBlock = {
    id: generateBlockId(),
    parentId,
    order: siblings.length,
    content: '',
    collapsed: false,
  };
  arborTree.update((t) => (t ? { ...t, blocks: [...t.blocks, newBlock] } : t));
  arborSelection.set({ blockId: newBlock.id, editing: true });
  return newBlock.id;
}

/** Create a sibling block (above or below). */
export function createSiblingBlock(referenceId: string, position: 'above' | 'below'): string {
  pushUndo();
  const tree = get(arborTree);
  if (!tree) return '';
  const ref = tree.blocks.find((b) => b.id === referenceId);
  if (!ref) return '';

  const insertOrder = position === 'above' ? ref.order : ref.order + 1;

  const newBlock: ArborBlock = {
    id: generateBlockId(),
    parentId: ref.parentId,
    order: insertOrder,
    content: '',
    collapsed: false,
  };

  // Shift orders for siblings after insertion point
  const updatedBlocks = tree.blocks.map((b) => {
    if (b.parentId === ref.parentId && b.order >= insertOrder) {
      return { ...b, order: b.order + 1 };
    }
    return b;
  });

  arborTree.set({ ...tree, blocks: [...updatedBlocks, newBlock] });
  arborSelection.set({ blockId: newBlock.id, editing: true });
  return newBlock.id;
}

/** Create a new root block. */
export function createRootBlock(): string {
  pushUndo();
  const tree = get(arborTree);
  if (!tree) return '';
  const roots = getRootBlocks(tree.blocks);
  const newBlock: ArborBlock = {
    id: generateBlockId(),
    parentId: null,
    order: roots.length,
    content: '',
    collapsed: false,
  };
  arborTree.update((t) => (t ? { ...t, blocks: [...t.blocks, newBlock] } : t));
  arborSelection.set({ blockId: newBlock.id, editing: true });
  return newBlock.id;
}

/** Delete a block (and optionally its subtree). */
export function deleteBlock(blockId: string, includeChildren: boolean): void {
  pushUndo();
  arborTree.update((tree) => {
    if (!tree) return tree;
    const idsToRemove = new Set([blockId]);
    if (includeChildren) {
      const addDescendants = (id: string) => {
        tree.blocks
          .filter((b) => b.parentId === id)
          .forEach((b) => {
            idsToRemove.add(b.id);
            addDescendants(b.id);
          });
      };
      addDescendants(blockId);
    } else {
      // Reparent children to deleted block's parent
      const deleted = tree.blocks.find((b) => b.id === blockId);
      if (deleted) {
        const reparented = tree.blocks.map((b) =>
          b.parentId === blockId ? { ...b, parentId: deleted.parentId } : b
        );
        return { ...tree, blocks: reparented.filter((b) => !idsToRemove.has(b.id)) };
      }
    }
    return { ...tree, blocks: tree.blocks.filter((b) => !idsToRemove.has(b.id)) };
  });

  // Select next available block
  const tree = get(arborTree);
  if (tree && tree.blocks.length > 0) {
    selectBlock(tree.blocks[0].id);
  } else {
    selectBlock(null);
  }
}

/** Navigate to parent block. */
export function navigateParent(): void {
  const sel = get(arborSelection);
  const tree = get(arborTree);
  if (!tree || !sel.blockId) return;
  const block = tree.blocks.find((b) => b.id === sel.blockId);
  if (block?.parentId) selectBlock(block.parentId);
}

/** Navigate to first child. */
export function navigateChild(): void {
  const sel = get(arborSelection);
  const tree = get(arborTree);
  if (!tree || !sel.blockId) return;
  const children = getChildren(tree.blocks, sel.blockId);
  if (children.length > 0) selectBlock(children[0].id);
}

/** Navigate to previous sibling. */
export function navigatePrevSibling(): void {
  const sel = get(arborSelection);
  const tree = get(arborTree);
  if (!tree || !sel.blockId) return;
  const block = tree.blocks.find((b) => b.id === sel.blockId);
  if (!block) return;
  const siblings = tree.blocks
    .filter((b) => b.parentId === block.parentId)
    .sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((b) => b.id === sel.blockId);
  if (idx > 0) selectBlock(siblings[idx - 1].id);
}

/** Navigate to next sibling. */
export function navigateNextSibling(): void {
  const sel = get(arborSelection);
  const tree = get(arborTree);
  if (!tree || !sel.blockId) return;
  const block = tree.blocks.find((b) => b.id === sel.blockId);
  if (!block) return;
  const siblings = tree.blocks
    .filter((b) => b.parentId === block.parentId)
    .sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((b) => b.id === sel.blockId);
  if (idx < siblings.length - 1) selectBlock(siblings[idx + 1].id);
}

/** Get the serialized markdown for persistence. */
export function getSerializedContent(): string | null {
  const tree = get(arborTree);
  if (!tree) return null;
  return serializeArborNote(tree);
}

/** Persist config on change. */
arborConfig.subscribe((cfg) => {
  try {
    localStorage.setItem('bismuth-arbor-config', JSON.stringify(cfg));
  } catch (e) {
    log.warn('Failed to persist arbor config to localStorage', { error: String(e) });
  }
});
