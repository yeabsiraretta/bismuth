/**
 * Centralized Preset Data & Constants
 * All hardcoded values, placeholder data, and default configurations
 * should be defined here for easy maintenance and modification.
 */

// ============================================================================
// IPC COMMAND PLACEHOLDER DATA
// ============================================================================

export const IPC_PLACEHOLDERS = {
  // Tag Tree Placeholders
  tagTree: {
    tags: [
      { name: 'project', count: 5, children: [] },
      { name: 'personal', count: 3, children: [] },
      { name: 'work', count: 8, children: [] },
    ],
  },

  // Property Browser Placeholders
  propertyBrowser: {
    status: [
      { value: 'draft', count: 12 },
      { value: 'published', count: 8 },
      { value: 'archived', count: 3 },
    ],
    author: [
      { value: 'John Doe', count: 15 },
      { value: 'Jane Smith', count: 7 },
    ],
    category: [
      { value: 'technical', count: 10 },
      { value: 'personal', count: 8 },
      { value: 'work', count: 6 },
    ],
    priority: [
      { value: 'high', count: 5 },
      { value: 'medium', count: 12 },
      { value: 'low', count: 8 },
    ],
  },

  // File List Placeholders
  fileList: {
    files: [
      { title: 'Example Note 1', path: '/example-1.md', modified: new Date().toISOString() },
      { title: 'Example Note 2', path: '/example-2.md', modified: new Date().toISOString() },
    ],
  },

  // Folder Tree Placeholders
  folderTree: {
    folders: [
      { name: 'Projects', path: '/projects', noteCount: 5, children: [] },
      { name: 'Archive', path: '/archive', noteCount: 12, children: [] },
    ],
  },

  // Backlinks Placeholders
  backlinks: {
    mentions: [
      {
        noteId: 'note-1',
        notePath: '/note-1.md',
        noteName: 'Example Note',
        context: 'This is a mention context...',
        lineNumber: 10,
      },
    ],
  },

  // Graph View Placeholders
  graphView: {
    nodes: [
      { id: 'node-1', title: 'Note 1', path: '/note-1.md' },
      { id: 'node-2', title: 'Note 2', path: '/note-2.md' },
    ],
    edges: [
      { source: 'node-1', target: 'node-2' },
    ],
  },
};

// ============================================================================
// COLOR PRESETS
// ============================================================================

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

// ============================================================================
// ICON PRESETS
// ============================================================================

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

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

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

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export const DEFAULT_SETTINGS = {
  // Editor settings
  editor: {
    fontSize: 14,
    fontFamily: 'Fira Code',
    lineHeight: 1.6,
    tabSize: 2,
    wordWrap: true,
    spellCheck: true,
    autoSave: true,
    autoSaveDelay: 500,
  },

  // View settings
  view: {
    defaultViewMode: 'edit' as 'edit' | 'preview' | 'split',
    showLineNumbers: false,
    showFoldGutter: true,
    highlightActiveLine: true,
  },

  // Sidebar settings
  sidebar: {
    leftSidebarWidth: 280,
    rightSidebarWidth: 320,
    leftSidebarVisible: true,
    rightSidebarVisible: true,
  },

  // File settings
  files: {
    defaultFileExtension: '.md',
    showHiddenFiles: false,
    sortBy: 'name' as 'name' | 'modified' | 'created',
    sortOrder: 'asc' as 'asc' | 'desc',
  },

  // Wikilink settings
  wikilinks: {
    autocompleteTrigger: '[[',
    maxSuggestions: 10,
    createMissingNotes: true,
    updateLinksOnRename: true,
  },

  // Graph settings
  graph: {
    nodeSize: 8,
    linkDistance: 100,
    linkStrength: 0.5,
    chargeStrength: -300,
    showOrphans: true,
    colorByFolder: false,
  },
};

// ============================================================================
// TEMPLATE DATA
// ============================================================================

export const TEMPLATES = {
  // Note templates
  notes: {
    daily: `# {{date}}

## Tasks
- [ ] 

## Notes

## References
`,
    meeting: `# Meeting: {{title}}

**Date:** {{date}}
**Attendees:** 

## Agenda

## Notes

## Action Items
- [ ] 
`,
    project: `# {{title}}

## Overview

## Goals

## Tasks
- [ ] 

## Resources

## Timeline
`,
  },

  // Frontmatter templates
  frontmatter: {
    basic: `---
title: {{title}}
created: {{created}}
modified: {{modified}}
tags: []
---
`,
    full: `---
title: {{title}}
created: {{created}}
modified: {{modified}}
tags: []
status: draft
priority: medium
type: note
---
`,
  },
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

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

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI_CONSTANTS = {
  // Debounce delays
  debounce: {
    search: 300,
    autoSave: 500,
    resize: 100,
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Z-index layers
  zIndex: {
    modal: 1000,
    dropdown: 900,
    tooltip: 800,
    sidebar: 100,
  },

  // Breakpoints
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1280,
  },
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

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

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  fileSaved: 'File saved successfully',
  fileCreated: 'File created successfully',
  fileDeleted: 'File deleted successfully',
  fileRenamed: 'File renamed successfully',
  vaultCreated: 'Vault created successfully',
  vaultOpened: 'Vault opened successfully',
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  IPC_PLACEHOLDERS,
  COLOR_PRESETS,
  ICON_PRESETS,
  KEYBOARD_SHORTCUTS,
  DEFAULT_SETTINGS,
  TEMPLATES,
  VALIDATION_RULES,
  UI_CONSTANTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
