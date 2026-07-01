/**
 * Tag management feature module.
 * Public API barrel.
 */

// Types
export type { TagNode } from './stores/tag';

// Stores
export {
  allTags,
  tagHierarchy,
  hiddenTags,
  visibleTags,
  filteredNotes,
  toggleTagVisibility,
  hideTag,
  showTag,
  renameTag,
  mergeTags,
} from './stores/tag';

// Services
export type { TagInfo, TagStats, RenameResult } from './services/tags';
export {
  createTagPage,
  getAllTags,
  getNotesByTag,
  getTagStats,
  searchTags,
  renameTag as renameTagService,
  mergeTags as mergeTagsService,
  getRandomNoteWithTag,
} from './services/tags';

// Components
export { default as TagPanel } from './components/TagPanel.svelte';
export { default as TagContextMenu } from './components/TagContextMenu.svelte';
