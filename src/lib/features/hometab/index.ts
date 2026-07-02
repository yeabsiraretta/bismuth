/** Home Tab feature — browser-like landing page with search, bookmarks, and recents. */

export type { HomeBookmark, HomeTabSettings, FileTypeFilter } from './types';
export { DEFAULT_HOME_SETTINGS, FILE_TYPE_FILTERS } from './types';

export {
  homeSettings,
  bookmarks,
  recentNotes,
  recentFilePaths,
  bookmarkCount,
  addBookmark,
  removeBookmark,
  isBookmarked,
  recordRecentFile,
  updateHomeSettings,
  setupRecentTracking,
} from './stores/homeStore';

export { searchFiles, detectFilter, getFileIcon } from './services/homeSearch';

export { default as HomeTab } from './components/HomeTab.svelte';
export { default as HomeSettings } from './components/HomeSettings.svelte';
