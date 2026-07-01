/**
 * Canvas & UI visual presets — colors, icons, keyboard shortcuts, constants.
 */

export const COLOR_PRESETS = {
  // Accent colors for folders/files
  accentColors: [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Rose', value: '#f43f5e' },
  ],

  // Theme colors
  themes: {
    light: {
      background: '#ffffff',
      foreground: '#000000',
      accent: '#3b82f6',
    },
    dark: {
      background: '#1a1a1a',
      foreground: '#ffffff',
      accent: '#3b82f6',
    },
  },
};

export const ICON_PRESETS = {
  // Folder/file icons
  folderIcons: [
    'folder',
    'folder-open',
    'archive',
    'book',
    'briefcase',
    'calendar',
    'code',
    'database',
    'file',
    'git-branch',
    'globe',
    'heart',
    'home',
    'inbox',
    'layers',
    'package',
    'star',
    'tag',
    'target',
    'zap',
  ],

  // Note type icons
  noteIcons: [
    'file-text',
    'sticky-note',
    'book-open',
    'clipboard',
    'edit',
    'feather',
  ],
};

export const KEYBOARD_SHORTCUTS = {
  // Global shortcuts
  global: {
    newNote: { key: 'n', modifiers: ['cmd'] },
    search: { key: 'k', modifiers: ['cmd'] },
    toggleLeftSidebar: { key: 'b', modifiers: ['cmd'] },
    toggleRightSidebar: { key: 'r', modifiers: ['cmd'] },
  },

  // Editor shortcuts
  editor: {
    save: { key: 's', modifiers: ['cmd'] },
    bold: { key: 'b', modifiers: ['cmd'] },
    italic: { key: 'i', modifiers: ['cmd'] },
    link: { key: 'k', modifiers: ['cmd'] },
  },

  // Navigation shortcuts
  navigation: {
    nextFile: { key: 'j', modifiers: [] },
    prevFile: { key: 'k', modifiers: [] },
    expandFolder: { key: 'ArrowRight', modifiers: [] },
    collapseFolder: { key: 'ArrowLeft', modifiers: [] },
  },

  // Quick shortcuts (Cmd+1-9)
  quickShortcuts: Array.from({ length: 9 }, (_, i) => ({
    key: String(i + 1),
    modifiers: ['cmd'],
    slot: i,
  })),
};

export const VALIDATION_RULES = {
  // File name validation
  fileName: {
    maxLength: 255,
    invalidChars: /[<>:"/\\|?*]/g,
    reservedNames: ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'],
  },

  // Tag validation
  tag: {
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },

  // Property validation
  property: {
    keyMaxLength: 50,
    valueMaxLength: 200,
  },
};

export const ERROR_MESSAGES = {
  // File operations
  fileNotFound: 'File not found',
  fileAlreadyExists: 'A file with this name already exists',
  invalidFileName: 'Invalid file name',

  // Vault operations
  vaultNotFound: 'Vault not found',
  vaultAlreadyOpen: 'Vault is already open',

  // Network errors
  networkError: 'Network error occurred',
  timeout: 'Request timed out',

  // Generic errors
  unknownError: 'An unknown error occurred',
  permissionDenied: 'Permission denied',
};

export const SUCCESS_MESSAGES = {
  fileSaved: 'File saved successfully',
  fileCreated: 'File created successfully',
  fileDeleted: 'File deleted successfully',
  fileRenamed: 'File renamed successfully',
  vaultCreated: 'Vault created successfully',
  vaultOpened: 'Vault opened successfully',
};
