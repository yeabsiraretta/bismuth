/**
 * Arbor feature module — branching note editor.
 * Public API barrel. External consumers import from here only.
 */

// Stores (reactive state)
export {
  arborTree,
  arborSelection,
  arborConfig,
  selectedBlock,
  breadcrumbPath,
  rootBlocks,
} from './stores/arborStore';

// Actions (store mutations)
export {
  initArborFromContent,
  arborUndo,
  arborRedo,
  selectBlock,
  enterEditMode,
  exitEditMode,
  updateBlockContent,
  createChildBlock,
  createSiblingBlock,
  createRootBlock,
  deleteBlock,
  navigateParent,
  navigateChild,
  navigatePrevSibling,
  navigateNextSibling,
  getSerializedContent,
} from './stores/arborStore';

// Services (parsing)
export {
  parseArborNote,
  serializeArborNote,
  extractFrontmatter,
  isArborNote,
} from './services/parser';

// Components (lazy-loadable UI)
export { default as ArborCard } from './components/ArborCard.svelte';
export { default as ArborEditor } from './components/ArborEditor.svelte';

// Types (re-exported for consumers)
export type {
  ArborBlock,
  ArborTree,
  ArborSelection,
  ArborConfig,
  ArborMetadata,
  ArborBlockMeta,
  ArborLayoutNode,
} from './types';

export {
  DEFAULT_ARBOR_CONFIG,
  generateBlockId,
  getRootBlocks,
  getChildren,
  getAncestors,
  getDescendants,
} from './types';
