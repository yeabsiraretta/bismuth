import type { Command } from '@/stores/commands/commands';
import type { DefaultCommandActions } from '@/stores/commands/defaultCommands';

export function buildNavigationCommands(actions: DefaultCommandActions): Command[] {
  return [
    {
      id: 'note:new',
      name: 'New Note',
      description: 'Create a new note',
      category: 'Notes',
      shortcut: 'Cmd+N',
      action: actions.newNote ?? (() => {}),
    },
    {
      id: 'search:open',
      name: 'Search',
      description: 'Open search panel',
      category: 'Navigation',
      shortcut: 'Cmd+P',
      action: actions.openSearch ?? (() => {}),
    },
    {
      id: 'palette:open',
      name: 'Command Palette',
      description: 'Open command palette',
      category: 'Navigation',
      shortcut: 'Cmd+Shift+P',
      action: actions.openCommandPalette ?? (() => {}),
    },
    {
      id: 'settings:open',
      name: 'Settings',
      description: 'Open settings modal',
      category: 'General',
      shortcut: 'Cmd+,',
      action: actions.openSettings ?? (() => {}),
    },
    {
      id: 'layout:toggle-left',
      name: 'Toggle Left Sidebar',
      description: 'Show or hide the left sidebar',
      category: 'Layout',
      shortcut: 'Cmd+\\',
      action: actions.toggleLeftSidebar ?? (() => {}),
    },
    {
      id: 'layout:toggle-right',
      name: 'Toggle Right Sidebar',
      description: 'Show or hide the right sidebar',
      category: 'Layout',
      shortcut: 'Cmd+Shift+\\',
      action: actions.toggleRightSidebar ?? (() => {}),
    },
    {
      id: 'capture:quick',
      name: 'Quick Capture',
      description: 'Create a quick capture note',
      category: 'Capture',
      shortcut: 'Cmd+Shift+N',
      action: actions.quickCapture ?? (() => {}),
    },
    {
      id: 'view:graph',
      name: 'Open Graph View',
      description: 'Open the graph visualization',
      category: 'Views',
      action: actions.openGraph ?? (() => {}),
    },
    {
      id: 'view:capture-dashboard',
      name: 'Open Capture Dashboard',
      description: 'Open the capture/inbox dashboard',
      category: 'Views',
      action: actions.openCaptureDashboard ?? (() => {}),
    },
    {
      id: 'links:find-unlinked',
      name: 'Find Unlinked References',
      description: 'Scan current note for text matching other note titles that are not yet linked',
      category: 'Links',
      action: actions.openAutoLinker ?? (() => {}),
    },
    {
      id: 'layout:preset-focus',
      name: 'Layout: Focus Mode',
      description: 'Hide all sidebars for distraction-free writing',
      category: 'Layout',
      shortcut: 'Cmd+1',
      action: async () => {
        const { applyPreset } = await import('@/stores/layout/presets');
        applyPreset('preset-focus');
      },
    },
    {
      id: 'layout:preset-write',
      name: 'Layout: Write Mode',
      description: 'Left sidebar only',
      category: 'Layout',
      shortcut: 'Cmd+2',
      action: async () => {
        const { applyPreset } = await import('@/stores/layout/presets');
        applyPreset('preset-write');
      },
    },
    {
      id: 'layout:preset-research',
      name: 'Layout: Research Mode',
      description: 'Both sidebars visible',
      category: 'Layout',
      shortcut: 'Cmd+3',
      action: async () => {
        const { applyPreset } = await import('@/stores/layout/presets');
        applyPreset('preset-research');
      },
    },
    {
      id: 'rss:open-reader',
      name: 'RSS: Open Reader',
      description: 'Switch viewport to RSS reader',
      category: 'RSS',
      action: async () => {
        const { setViewportMode } = await import('@/stores/layout/presets');
        setViewportMode('rss');
      },
    },
    {
      id: 'tabs:reopen-closed',
      name: 'Reopen Closed Tab',
      description: 'Reopen the most recently closed tab',
      category: 'Tabs',
      shortcut: 'Cmd+Shift+T',
      action: async () => {
        const { reopenClosedTab } = await import('@/stores/editor/tabFeatures');
        reopenClosedTab();
      },
    },
    {
      id: 'tabs:pin',
      name: 'Pin Current Tab',
      description: 'Promote ephemeral preview tab to permanent',
      category: 'Tabs',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeEditorTabId } = await import('@/stores/editor/tabs');
        const { pinTab } = await import('@/stores/editor/tabFeatures');
        const id = get(activeEditorTabId);
        if (id) pinTab(id);
      },
    },
    {
      id: 'tabs:new-group',
      name: 'Create Tab Group',
      description: 'Create a new tab group and move current tab to it',
      category: 'Tabs',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeEditorTabId, moveTabToGroup } = await import('@/stores/editor/tabs');
        const { createTabGroup } = await import('@/stores/editor/tabFeatures');
        const id = get(activeEditorTabId);
        if (id) { const gid = createTabGroup('Group'); moveTabToGroup(id, gid); }
      },
    },
    {
      id: 'tabs:zoom-in',
      name: 'Zoom In (Current Tab)',
      description: 'Increase zoom level for the current tab',
      category: 'Tabs',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeEditorTabId, editorTabs } = await import('@/stores/editor/tabs');
        const { setTabZoom } = await import('@/stores/editor/tabFeatures');
        const id = get(activeEditorTabId);
        const tab = get(editorTabs).find(t => t.id === id);
        if (tab) setTabZoom(tab.id, tab.zoomLevel + 10);
      },
    },
    {
      id: 'tabs:zoom-out',
      name: 'Zoom Out (Current Tab)',
      description: 'Decrease zoom level for the current tab',
      category: 'Tabs',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeEditorTabId, editorTabs } = await import('@/stores/editor/tabs');
        const { setTabZoom } = await import('@/stores/editor/tabFeatures');
        const id = get(activeEditorTabId);
        const tab = get(editorTabs).find(t => t.id === id);
        if (tab) setTabZoom(tab.id, tab.zoomLevel - 10);
      },
    },
    {
      id: 'tabs:zoom-reset',
      name: 'Reset Zoom (Current Tab)',
      description: 'Reset zoom level to 100% for the current tab',
      category: 'Tabs',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeEditorTabId } = await import('@/stores/editor/tabs');
        const { setTabZoom } = await import('@/stores/editor/tabFeatures');
        const id = get(activeEditorTabId);
        if (id) setTabZoom(id, 100);
      },
    },
    {
      id: 'tabs:toggle-vertical',
      name: 'Toggle Vertical Tabs',
      description: 'Switch between horizontal and vertical tab layout',
      category: 'Tabs',
      action: async () => {
        const { toggleTabOrientation } = await import('@/stores/editor/tabs');
        toggleTabOrientation();
      },
    },
    {
      id: 'attachment:rearrange-linked',
      name: 'Rearrange Linked Attachments',
      description: 'Rename and move attachments in current note per config',
      category: 'Attachments',
      action: async () => {
        const { get: sGet } = await import('svelte/store');
        const { activeNote } = await import('@/stores/vault/vault');
        const { rearrangeNoteAttachments } = await import('@/features/attachment');
        const note = sGet(activeNote);
        if (!note) return;
        const vaultRoot = note.path.split('/').slice(0, -1).join('/');
        const r = await rearrangeNoteAttachments(note.path, vaultRoot);
        const { showToast } = await import('@/stores/toast/toast');
        showToast(`Moved ${r.moved}, skipped ${r.skipped}${r.errors.length ? `, ${r.errors.length} errors` : ''}`, 'info');
      },
    },
    {
      id: 'attachment:rearrange-all',
      name: 'Rearrange All Linked Attachments',
      description: 'Rename all linked attachments across vault',
      category: 'Attachments',
      action: async () => {
        const { get: sGet } = await import('svelte/store');
        const { notes: notesStore } = await import('@/stores/vault/vault');
        const { rearrangeAllAttachments } = await import('@/features/attachment');
        const allNotes = sGet(notesStore);
        if (allNotes.length === 0) return;
        const vaultRoot = allNotes[0].path.split('/').slice(0, -1).join('/');
        const paths = allNotes.map(n => n.path);
        const r = await rearrangeAllAttachments(paths, vaultRoot);
        const { showToast } = await import('@/stores/toast/toast');
        showToast(`Rearranged: ${r.moved} moved, ${r.skipped} skipped`, 'info');
      },
    },
    {
      id: 'attachment:reset-override',
      name: 'Reset Attachment Override',
      description: 'Reset attachment path override for the current note',
      category: 'Attachments',
      action: async () => {
        const { get: sGet } = await import('svelte/store');
        const { activeNote } = await import('@/stores/vault/vault');
        const { resetOverridesForPath } = await import('@/features/attachment');
        const note = sGet(activeNote);
        if (note) resetOverridesForPath(note.path);
        const { showToast } = await import('@/stores/toast/toast');
        showToast('Override reset for current note', 'info');
      },
    },
    {
      id: 'attachment:clear-orignames',
      name: 'Clear Unused Original Name Storage',
      description: 'Prune original name entries for deleted files',
      category: 'Attachments',
      action: async () => {
        const { pruneOriginalNames } = await import('@/features/attachment');
        const pruned = pruneOriginalNames(new Set());
        const { showToast } = await import('@/stores/toast/toast');
        showToast(`Pruned ${pruned} unused entries`, 'info');
      },
    },
  ];
}
