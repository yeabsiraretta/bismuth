import type { Command } from '@/stores/commands/commands';
import { get } from 'svelte/store';
import { showToast } from '@/stores/toast/toast';
import { activeNote, notes } from '@/stores/vault/vault';

export function buildEditorCommands(): Command[] {
  return [
    {
      id: 'note:duplicate',
      name: 'Duplicate Note',
      description: 'Create a copy of the active note',
      category: 'Notes',
      action: async () => {
        const note = get(activeNote);
        if (!note?.path) {
          showToast('No note open', 'warning');
          return;
        }
        const { duplicateNote } = await import('@/services/vault/vault');
        const { refreshNotes } = await import('@/stores/vault/vault');
        const dup = await duplicateNote(note.path);
        await refreshNotes();
        showToast(`Duplicated as ${dup.title || 'Untitled'}`, 'info');
      },
    },
    {
      id: 'note:delete',
      name: 'Delete Note',
      description: 'Delete the active note',
      category: 'Notes',
      action: async () => {
        const note = get(activeNote);
        if (!note?.path) {
          showToast('No note open', 'warning');
          return;
        }
        const { deleteNote } = await import('@/services/vault/vault');
        const { refreshNotes } = await import('@/stores/vault/vault');
        await deleteNote(note.path);
        await refreshNotes();
        showToast('Note deleted', 'info');
      },
    },
    {
      id: 'note:reveal-in-finder',
      name: 'Reveal in File Manager',
      description: 'Show the active note in your system file manager',
      category: 'Notes',
      action: async () => {
        const note = get(activeNote);
        if (!note?.path) {
          showToast('No note open', 'warning');
          return;
        }
        const { openInFileManager } = await import('@/services/vault/vault');
        await openInFileManager(note.path);
      },
    },
    {
      id: 'note:random',
      name: 'Open Random Note',
      description: 'Navigate to a random note in the vault',
      category: 'Notes',
      action: async () => {
        const allNotes = get(notes);
        if (allNotes.length === 0) {
          showToast('No notes in vault', 'warning');
          return;
        }
        const idx = Math.floor(Math.random() * allNotes.length);
        const { openNote } = await import('@/appNavigation');
        await openNote(allNotes[idx].path);
      },
    },
    {
      id: 'note:copy-path',
      name: 'Copy Note Path',
      description: 'Copy the active note path to clipboard',
      category: 'Notes',
      action: async () => {
        const note = get(activeNote);
        if (!note?.path) {
          showToast('No note open', 'warning');
          return;
        }
        await navigator.clipboard.writeText(note.path);
        showToast('Path copied to clipboard', 'info');
      },
    },
    {
      id: 'note:copy-title',
      name: 'Copy Note Title',
      description: 'Copy the active note title to clipboard',
      category: 'Notes',
      action: async () => {
        const note = get(activeNote);
        if (!note) {
          showToast('No note open', 'warning');
          return;
        }
        const title = note.title || 'Untitled';
        await navigator.clipboard.writeText(title);
        showToast('Title copied to clipboard', 'info');
      },
    },
    {
      id: 'note:copy-wikilink',
      name: 'Copy as Wiki Link',
      description: 'Copy a [[wikilink]] to the active note',
      category: 'Notes',
      action: async () => {
        const note = get(activeNote);
        if (!note) {
          showToast('No note open', 'warning');
          return;
        }
        const title = note.title || 'Untitled';
        await navigator.clipboard.writeText(`[[${title}]]`);
        showToast('Wiki link copied', 'info');
      },
    },
    {
      id: 'vault:export-markdown',
      name: 'Export Vault as Markdown',
      description: 'Export all notes to a folder preserving directory structure',
      category: 'Vault',
      action: async () => {
        const { exportVaultMarkdown } = await import('@/services/vault/vault');
        try {
          const result = await exportVaultMarkdown('');
          showToast(result, 'info');
        } catch (e) {
          showToast(`Export failed: ${e}`, 'error');
        }
      },
    },
    {
      id: 'editor:zoom-in',
      name: 'Zoom In',
      description: 'Increase the UI scale',
      category: 'Editor',
      shortcut: 'Cmd+=',
      action: async () => {
        const { getStoredZoom, setZoom } = await import('@/services/app/zoom');
        const current = getStoredZoom();
        await setZoom(current + 0.1);
      },
    },
    {
      id: 'editor:zoom-out',
      name: 'Zoom Out',
      description: 'Decrease the UI scale',
      category: 'Editor',
      shortcut: 'Cmd+-',
      action: async () => {
        const { getStoredZoom, setZoom } = await import('@/services/app/zoom');
        const current = getStoredZoom();
        await setZoom(current - 0.1);
      },
    },
    {
      id: 'editor:zoom-reset',
      name: 'Reset Zoom',
      description: 'Reset UI scale to 100%',
      category: 'Editor',
      shortcut: 'Cmd+0',
      action: async () => {
        const { setZoom } = await import('@/services/app/zoom');
        await setZoom(1.0);
        showToast('Zoom reset to 100%', 'info');
      },
    },
    {
      id: 'note:lint',
      name: 'Lint Current Note',
      description: 'Run writing quality checks on the active note',
      category: 'Editor',
      action: async () => {
        const note = get(activeNote);
        if (!note?.path) {
          showToast('No note open', 'warning');
          return;
        }
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'writing');
        showToast('Writing panel opened — lint results shown', 'info');
      },
    },
    {
      id: 'note:archive',
      name: 'Archive Note',
      description: 'Move the active note to the archive folder',
      category: 'Notes',
      action: async () => {
        const note = get(activeNote);
        if (!note?.path) {
          showToast('No note open', 'warning');
          return;
        }
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('archive_note', { path: note.path });
        const { refreshNotes } = await import('@/stores/vault/vault');
        await refreshNotes();
        showToast('Note archived', 'info');
      },
    },
    {
      id: 'canvas:new',
      name: 'New Canvas',
      description: 'Create a new canvas document',
      category: 'Canvas',
      action: async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        try {
          await invoke('create_canvas', { name: `Canvas ${Date.now()}` });
          showToast('Canvas created', 'info');
        } catch (e) {
          showToast(`Failed to create canvas: ${e}`, 'error');
        }
      },
    },
    {
      id: 'vault:scan',
      name: 'Rescan Vault',
      description: 'Refresh the note index by rescanning the vault',
      category: 'Vault',
      action: async () => {
        const { refreshNotes } = await import('@/stores/vault/vault');
        await refreshNotes();
        showToast('Vault rescanned', 'info');
      },
    },
    {
      id: 'vault:reveal-root',
      name: 'Reveal Vault in File Manager',
      description: 'Open the vault root folder in your file manager',
      category: 'Vault',
      action: async () => {
        const { currentVault } = await import('@/stores/vault/vault');
        const vault = get(currentVault);
        if (!vault?.root_path) {
          showToast('No vault open', 'warning');
          return;
        }
        const { openInFileManager } = await import('@/services/vault/vault');
        await openInFileManager(vault.root_path);
      },
    },
    {
      id: 'editor:paste-url-into-selection',
      name: 'Paste URL into Selection',
      description:
        'Wrap selected text with a pasted URL as a markdown link, or insert text into a selected URL',
      category: 'Editor',
      action: async () => {
        const editorEl = document.querySelector('.cm-editor') as HTMLElement | null;
        if (!editorEl) {
          showToast('No editor focused', 'warning');
          return;
        }
        const view = (editorEl as unknown as { cmView?: { view: unknown } }).cmView?.view;
        if (!view) {
          showToast('No editor focused', 'warning');
          return;
        }
        const { pasteTextIntoSelectedUrl } =
          await import('@/components/editor/extensions/pasteUrlIntoSelection');
        const { EditorView } = await import('@codemirror/view');
        if (view instanceof EditorView) {
          const ok = await pasteTextIntoSelectedUrl(view);
          if (!ok) showToast('Select text or a URL first, then copy a URL or text', 'warning');
        }
      },
    },
    {
      id: 'footnote:insert-numbered',
      name: 'Insert Numbered Footnote',
      description: 'Insert an auto-numbered footnote [^n] at cursor and jump to detail',
      category: 'Editor',
      shortcut: 'Alt+0',
      action: async () => {
        const editorEl = document.querySelector('.cm-editor') as HTMLElement | null;
        if (!editorEl) {
          showToast('No editor focused', 'warning');
          return;
        }
        const view = (editorEl as unknown as { cmView?: { view: unknown } }).cmView?.view;
        if (!view) {
          showToast('No editor focused', 'warning');
          return;
        }
        const { insertNumberedFootnote } = await import('@/features/footnotes');
        const { EditorView } = await import('@codemirror/view');
        if (view instanceof EditorView) insertNumberedFootnote(view);
      },
    },
    {
      id: 'footnote:insert-named',
      name: 'Insert Named Footnote',
      description: 'Insert a named footnote [^name] at cursor or create detail for existing',
      category: 'Editor',
      shortcut: 'Alt+-',
      action: async () => {
        const editorEl = document.querySelector('.cm-editor') as HTMLElement | null;
        if (!editorEl) {
          showToast('No editor focused', 'warning');
          return;
        }
        const view = (editorEl as unknown as { cmView?: { view: unknown } }).cmView?.view;
        if (!view) {
          showToast('No editor focused', 'warning');
          return;
        }
        const { insertNamedFootnote } = await import('@/features/footnotes');
        const { EditorView } = await import('@codemirror/view');
        if (view instanceof EditorView) insertNamedFootnote(view);
      },
    },
    {
      id: 'clipper:clip-from-clipboard',
      name: 'ReadItLater: Create from clipboard',
      description: 'Clip the URL or text in your clipboard as a new note',
      category: 'Editor',
      action: async () => {
        const { clipFromClipboard } = await import('@/features/clipper');
        await clipFromClipboard();
      },
    },
    {
      id: 'clipper:batch-from-clipboard',
      name: 'ReadItLater: Create from batch in clipboard',
      description: 'Clip multiple URLs from clipboard (one per line)',
      category: 'Editor',
      action: async () => {
        const { clipBatchFromClipboard } = await import('@/features/clipper');
        await clipBatchFromClipboard();
      },
    },
    {
      id: 'clipper:insert-at-cursor',
      name: 'ReadItLater: Insert at cursor position',
      description: 'Insert clipped content at the current cursor position',
      category: 'Editor',
      action: async () => {
        const { insertAtCursor } = await import('@/features/clipper');
        await insertAtCursor();
      },
    },
  ];
}
