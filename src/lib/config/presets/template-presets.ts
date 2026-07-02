/**
 * Template data and default settings presets.
 */

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
