<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import Icon from '@/components/icons/Icon.svelte';
  import FileContextMenu from '@/components/sidebar/FileContextMenu.svelte';
  import { selectNote, navigatorStore, activeProfile } from '@/stores/navigator/navigator';
  import { currentVault } from '@/stores/vault/vault';
  import type { Note } from '@/types/vault';

  interface FileItem extends Note {
    isPinned: boolean;
    previewLines: string[];
    featuredImage?: string;
  }

  export let folderPath: string | null = null;

  let files: FileItem[] = [];
  let sortBy: 'name' | 'date' | 'pinned' = 'name';
  let sortDirection: 'asc' | 'desc' = 'asc';
  let selectedIndex = 0;
  // let draggedFile: FileItem | null = null; // Deferred to post-MVP
  let contextMenu: { note: Note; x: number; y: number } | null = null;

  $: profile = $activeProfile;
  $: sortBy = profile.sortPreference;
  $: sortDirection = profile.sortDirection;
  $: pinnedPaths = folderPath ? $navigatorStore.pinnedNotes[folderPath] || [] : [];

  $: if (folderPath) {
    loadFiles(folderPath);
  }

  async function loadFiles(path: string) {
    if (!$currentVault) return;

    try {
      const notes = await invoke<Note[]>('list_notes', {
        vaultPath: $currentVault.root_path,
        folderPath: path,
      });

      files = notes.map((note) => ({
        ...note,
        isPinned: pinnedPaths.includes(note.path),
        previewLines: extractPreview(note.content),
        featuredImage: extractFeaturedImage(note),
      }));

      sortFiles();
    } catch (error) {
      console.error('Failed to load files:', error);
      files = [];
    }
  }

  function extractPreview(content: string): string[] {
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    return lines.slice(0, 5);
  }

  function extractFeaturedImage(note: Note): string | undefined {
    if (note.frontmatter && note.frontmatter.image) {
      return note.frontmatter.image as string;
    }
    return undefined;
  }

  function sortFiles() {
    files.sort((a, b) => {
      // Pinned notes always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime();
          break;
        case 'pinned':
          comparison = 0; // Already sorted by pinned status
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    files = files; // Trigger reactivity
  }

  function handleSelect(file: FileItem, index: number) {
    selectNote(file);
    selectedIndex = index;
  }

  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
      case 'j':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, files.length - 1);
        if (files[selectedIndex]) {
          selectNote(files[selectedIndex]);
        }
        break;

      case 'ArrowUp':
      case 'k':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        if (files[selectedIndex]) {
          selectNote(files[selectedIndex]);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (files[selectedIndex]) {
          // Open note in editor
          selectNote(files[selectedIndex]);
        }
        break;
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  function getFileIcon(file: FileItem): string {
    const customIcon = $navigatorStore.fileIcons[file.path];
    if (customIcon) return customIcon;
    return 'file-text';
  }

  function getFileColor(file: FileItem): string {
    return $navigatorStore.fileColors[file.path] || 'var(--text-primary)';
  }

  function handleDragStart(_event: DragEvent, _file: FileItem) {
    // Drag-and-drop deferred to post-MVP
  }

  // Drag-and-drop handlers (deferred to post-MVP per T051)
  // function handleDragOver(event: DragEvent) {
  //   event.preventDefault();
  //   if (event.dataTransfer) {
  //     event.dataTransfer.dropEffect = 'move';
  //   }
  // }

  // async function handleDrop(event: DragEvent, targetFolder: string) {
  //   event.preventDefault();
  //   if (!draggedFile) return;

  //   try {
  //     await invoke('move_note', {
  //       oldPath: draggedFile.path,
  //       newDir: targetFolder,
  //     });
  //     // Reload files
  //     if (folderPath) {
  //       await loadFiles(folderPath);
  //     }
  //   } catch (error) {
  //     console.error('Failed to move note:', error);
  //   } finally {
  //     draggedFile = null;
  //   }
  // }

  function handleContextMenu(event: MouseEvent, note: Note) {
    event.preventDefault();
    contextMenu = {
      note,
      x: event.clientX,
      y: event.clientY,
    };
  }

  async function handleContextAction(action: string, note: Note) {
    switch (action) {
      case 'duplicate':
        const newName = prompt('Enter name for duplicate:');
        if (newName) {
          await invoke('duplicate_note', { path: note.path, newName });
          if (folderPath) await loadFiles(folderPath);
        }
        break;
      case 'delete':
        if (confirm(`Delete "${note.title}"?`)) {
          await invoke('delete_note', { path: note.path });
          if (folderPath) await loadFiles(folderPath);
        }
        break;
      case 'rename':
        const renamed = prompt('Enter new name:', note.title);
        if (renamed) {
          const newPath = note.path.replace(note.title, renamed);
          await invoke('rename_note', { oldPath: note.path, newPath });
          if (folderPath) await loadFiles(folderPath);
        }
        break;
    }
  }
</script>

<div class="file-list" on:keydown={handleKeydown} role="list" tabindex="0">
  <div class="file-list-header">
    <span class="file-count">{files.length} {files.length === 1 ? 'note' : 'notes'}</span>
    <div class="sort-controls">
      <button
        class="sort-btn"
        class:active={sortBy === 'name'}
        on:click={() => {
          sortBy = 'name';
          sortFiles();
        }}
        aria-label="Sort by name"
      >
        <Icon name="sort-alpha" size={14} />
      </button>
      <button
        class="sort-btn"
        class:active={sortBy === 'date'}
        on:click={() => {
          sortBy = 'date';
          sortFiles();
        }}
        aria-label="Sort by date"
      >
        <Icon name="calendar" size={14} />
      </button>
      <button
        class="sort-btn"
        on:click={() => {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          sortFiles();
        }}
        aria-label="Toggle sort direction"
      >
        <Icon name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} />
      </button>
    </div>
  </div>

  <div class="file-list-content">
    {#each files as file, index}
      {@const isSelected = index === selectedIndex}

      <div
        class="file-item"
        class:selected={isSelected}
        class:pinned={file.isPinned}
        style="color: {getFileColor(file)}"
        draggable="true"
        on:click={() => handleSelect(file, index)}
        on:dragstart={(e) => handleDragStart(e, file)}
        on:contextmenu={(e) => handleContextMenu(e, file)}
        role="listitem"
        tabindex={isSelected ? 0 : -1}
      >
        <div class="file-item-header">
          {#if file.isPinned}
            <Icon name="pin" size={12} />
          {/if}
          <Icon name={getFileIcon(file)} size={16} />
          <span class="file-title">{file.title}</span>
        </div>

        <div class="file-meta">
          <span class="file-date">{formatDate(file.modified_at)}</span>
        </div>

        {#if file.featuredImage}
          <div class="featured-image">
            <img src={file.featuredImage} alt="" loading="lazy" />
          </div>
        {/if}

        {#if file.previewLines.length > 0}
          <div class="file-preview">
            {#each file.previewLines as line}
              <p class="preview-line">{line}</p>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    {#if files.length === 0}
      <div class="empty-state">
        <Icon name="folder-open" size={48} />
        <p>No notes in this folder</p>
      </div>
    {/if}
  </div>
</div>

{#if contextMenu}
  <FileContextMenu
    note={contextMenu.note}
    x={contextMenu.x}
    y={contextMenu.y}
    onClose={() => (contextMenu = null)}
    onAction={(action) => {
      if (contextMenu) handleContextAction(action, contextMenu.note);
    }}
  />
{/if}

<style>
  .file-list {
    height: 100%;
    display: flex;
    flex-direction: column;
    outline: none;
  }

  .file-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .file-count {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    font-weight: var(--font-medium);
  }

  .sort-controls {
    display: flex;
    gap: 0.25rem;
  }

  .sort-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    background: none;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.15s ease;
  }

  .sort-btn:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-primary);
  }

  .sort-btn.active {
    background-color: var(--background-modifier-active-hover);
    color: var(--interactive-accent);
  }

  .file-list-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .file-item {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
    border: 1px solid transparent;
  }

  .file-item:hover {
    background-color: var(--background-modifier-hover);
  }

  .file-item.selected {
    background-color: var(--background-modifier-active-hover);
    border-color: var(--interactive-accent);
  }

  .file-item.pinned {
    background-color: var(--background-secondary);
  }

  .file-item-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .pin-icon {
    color: var(--interactive-accent);
  }

  .file-title {
    flex: 1;
    font-size: var(--font-size-md);
    font-weight: var(--font-medium);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .file-date {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .featured-image {
    width: 100%;
    height: 8rem;
    margin-bottom: 0.5rem;
    border-radius: 0.375rem;
    overflow: hidden;
  }

  .featured-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .file-preview {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
  }

  .preview-line {
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    gap: 1rem;
  }

  .empty-state p {
    font-size: var(--font-size-sm);
  }
</style>
