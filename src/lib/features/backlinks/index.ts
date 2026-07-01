// Types
export type {
  CachedBacklink,
  BacklinkCacheEntry,
  OutgoingLink,
  BacklinkSource,
  CanvasLink,
  FrontmatterLink,
  CacheStats,
  BacklinkCacheSettings,
} from './types';
export { DEFAULT_CACHE_SETTINGS, WIKILINK_RE, MD_LINK_RE, FRONTMATTER_MD_LINK_RE } from './types';

// Services
export {
  BacklinkCache,
  hashContent,
  extractWikilinks,
  extractMarkdownLinks,
} from './services/backlinkCache';
export type { NoteInput } from './services/backlinkCache';
export { extractCanvasLinks, isCanvasFile } from './services/canvasLinks';
export {
  extractFrontmatterLinks,
  flattenFrontmatterValues,
  parseMarkdownLinks,
} from './services/frontmatterLinks';

// Store
export {
  cacheSettings,
  cacheStats,
  cacheBuilding,
  cacheVersion,
  buildCache,
  updateCacheForFile,
  removeCacheForFile,
  getCachedBacklinks,
  getCachedBacklinkCount,
  getCachedBacklinksSafe,
  clearCache,
  updateCacheSettings,
  backlinkCountForPath,
} from './stores/backlinkStore';

// Components
export { default as BacklinksPanel } from './components/BacklinksPanel.svelte';
export { default as Backlinks } from './components/Backlinks.svelte';
export { default as OutgoingLinks } from './components/OutgoingLinks.svelte';
