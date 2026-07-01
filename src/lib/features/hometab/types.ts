/** Home tab feature types. */

/** A bookmarked/starred file shown on the home tab grid. */
export interface HomeBookmark {
  path: string;
  title: string;
  icon?: string;
  addedAt: string;
}

/** Home tab settings persisted in localStorage. */
export interface HomeTabSettings {
  showRecentFiles: boolean;
  showBookmarks: boolean;
  maxRecentFiles: number;
  showSearchBar: boolean;
  /** Replace empty new tabs with home tab */
  replaceNewTab: boolean;
}

export const DEFAULT_HOME_SETTINGS: HomeTabSettings = {
  showRecentFiles: true,
  showBookmarks: true,
  maxRecentFiles: 8,
  showSearchBar: true,
  replaceNewTab: true,
};

/** File type filters for search */
export interface FileTypeFilter {
  key: string;
  label: string;
  extensions: string[];
}

export const FILE_TYPE_FILTERS: FileTypeFilter[] = [
  { key: 'markdown', label: 'Markdown', extensions: ['md'] },
  { key: 'image', label: 'Image', extensions: ['png', 'jpg', 'jpeg', 'svg', 'gif', 'bmp', 'webp'] },
  { key: 'video', label: 'Video', extensions: ['mp4', 'webm', 'ogv', 'mov', 'mkv'] },
  { key: 'audio', label: 'Audio', extensions: ['mp3', 'wav', 'm4a', 'ogg', '3gp', 'flac'] },
  { key: 'pdf', label: 'PDF', extensions: ['pdf'] },
  { key: 'canvas', label: 'Canvas', extensions: ['canvas'] },
];
