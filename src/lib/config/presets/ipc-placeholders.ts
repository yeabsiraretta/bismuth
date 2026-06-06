/**
 * IPC Command Placeholder Data
 * Fallback data used when backend commands haven't returned real data yet.
 */

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
