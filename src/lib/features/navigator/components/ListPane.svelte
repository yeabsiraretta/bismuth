<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { navigatorStore, setActivePane } from '../stores/navigator';
  import { openNote } from '@/appNavigation';
  import { notes } from '@/stores/vault/vault';
  import {
    selectedTag,
    tagFilteredNotes,
    selectedProperty,
    propertyFilteredNotes,
    selectedNotes,
    toggleNoteSelection,
    clearNoteSelection,
  } from '../stores/navigatorActions';
  import {
    getFileName,
    getPreview,
    formatDate,
    getNoteTags,
    getSourceNotes,
    applyFilter,
  } from '../stores/listPaneLogic';
  import type { Note } from '@/types/data/vault';

  let focusIndex = -1;
  let listEl: HTMLElement;

  $: selectedFolder = $navigatorStore.selectedFolder;
  $: sortField = $navigatorStore.sortField;
  $: sortDirection = $navigatorStore.sortDirection;
  $: filterQuery = $navigatorStore.filterQuery;
  $: activeTab = $navigatorStore.activeTab;
  $: pinnedPaths = selectedFolder ? $navigatorStore.pinnedNotes[selectedFolder] || [] : [];

  $: sourceNotes = getSourceNotes(
    activeTab,
    $notes,
    selectedFolder,
    $selectedTag,
    $tagFilteredNotes,
    $selectedProperty,
    $propertyFilteredNotes
  );
  $: filteredNotes = applyFilter(sourceNotes, filterQuery, sortField, sortDirection);
  $: pinnedNotes = filteredNotes.filter((n) => pinnedPaths.includes(n.path));
  $: unpinnedNotes = filteredNotes.filter((n) => !pinnedPaths.includes(n.path));
  $: hasSelection =
    activeTab === 'folders'
      ? !!selectedFolder
      : activeTab === 'tags'
        ? !!$selectedTag
        : !!$selectedProperty;

  function handleNoteClick(note: Note, e: MouseEvent) {
    if (e.metaKey || e.ctrlKey) {
      toggleNoteSelection(note.path);
      return;
    }
    clearNoteSelection();
    navigatorStore.update((s) => ({ ...s, selectedNote: note }));
    setActivePane('list');
    openNote(note.path);
  }

  function handleListKeydown(e: KeyboardEvent) {
    const allNotes = [...pinnedNotes, ...unpinnedNotes];
    if (!allNotes.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusIndex = Math.min(focusIndex + 1, allNotes.length - 1);
      focusItem(focusIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusIndex = Math.max(focusIndex - 1, 0);
      focusItem(focusIndex);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusIndex = 0;
      focusItem(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusIndex = allNotes.length - 1;
      focusItem(focusIndex);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      focusIndex = Math.min(focusIndex + 10, allNotes.length - 1);
      focusItem(focusIndex);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      focusIndex = Math.max(focusIndex - 10, 0);
      focusItem(focusIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusIndex >= 0 && focusIndex < allNotes.length) {
        const note = allNotes[focusIndex];
        navigatorStore.update((s) => ({ ...s, selectedNote: note }));
        openNote(note.path);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActivePane('navigation');
    }
  }

  function focusItem(idx: number) {
    if (!listEl) return;
    const items = listEl.querySelectorAll('.note-item');
    if (items[idx]) {
      (items[idx] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="list-pane-content" bind:this={listEl} on:keydown={handleListKeydown}>
  {#if !hasSelection}
    <div class="empty-state">
      <Icon name="folder" size={16} />
      <p>Select a folder, tag, or property</p>
    </div>
  {:else if filteredNotes.length === 0}
    <div class="empty-state">
      <Icon name="file" size={16} />
      <p>No notes found</p>
    </div>
  {:else}
    <div class="list-header">
      <span class="list-count">
        {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
      </span>
    </div>

    {#if pinnedNotes.length > 0}
      <div class="section-label"><Icon name="pin" size={10} /> Pinned</div>
    {/if}

    <div class="note-list" role="listbox" aria-label="Notes">
      {#each pinnedNotes as note, i (note.path)}
        {@const isSelected = $navigatorStore.selectedNote?.path === note.path}
        {@const isMultiSelected = $selectedNotes.has(note.path)}
        <div
          class="note-item"
          class:selected={isSelected}
          class:multi-selected={isMultiSelected}
          class:focused={focusIndex === i}
          role="option"
          tabindex={i === 0 ? 0 : -1}
          aria-selected={isSelected}
          on:click={(e) => handleNoteClick(note, e)}
        >
          <div class="note-main">
            <div class="note-title-row">
              <Icon name="pin" size={10} />
              <span class="note-title">{getFileName(note.path)}</span>
            </div>
            <div class="note-preview">{getPreview(note)}</div>
            <div class="note-meta">
              <span class="note-date">{formatDate(note.modified_at)}</span>
              {#each getNoteTags(note) as tag}
                <span class="note-tag">#{tag}</span>
              {/each}
            </div>
          </div>
        </div>
      {/each}

      {#if pinnedNotes.length > 0 && unpinnedNotes.length > 0}
        <div class="section-divider"></div>
      {/if}

      {#each unpinnedNotes as note, i (note.path)}
        {@const globalIdx = pinnedNotes.length + i}
        {@const isSelected = $navigatorStore.selectedNote?.path === note.path}
        {@const isMultiSelected = $selectedNotes.has(note.path)}
        <div
          class="note-item"
          class:selected={isSelected}
          class:multi-selected={isMultiSelected}
          class:focused={focusIndex === globalIdx}
          role="option"
          tabindex={globalIdx === 0 ? 0 : -1}
          aria-selected={isSelected}
          on:click={(e) => handleNoteClick(note, e)}
        >
          <div class="note-main">
            <div class="note-title-row">
              <span class="note-title">{getFileName(note.path)}</span>
            </div>
            <div class="note-preview">{getPreview(note)}</div>
            <div class="note-meta">
              <span class="note-date">{formatDate(note.modified_at)}</span>
              {#each getNoteTags(note) as tag}
                <span class="note-tag">#{tag}</span>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .list-pane-content {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    font-size: 12px;
    gap: 6px;
  }

  .list-header {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
  }

  .list-count {
    font-size: 10px;
    color: var(--text-faint);
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-divider {
    height: 1px;
    background: var(--border-color);
    margin: 2px 8px;
  }

  .note-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 2px 4px;
    flex: 1;
  }

  .note-item {
    padding: 6px 8px;
    border-radius: var(--radius-s);
    cursor: pointer;
  }

  .note-item:hover {
    background: var(--interactive-hover);
  }

  .note-item.selected {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .note-item.multi-selected {
    background: var(--background-modifier-hover);
    outline: 1px solid var(--interactive-accent);
  }

  .note-item.focused {
    box-shadow: inset 0 0 0 1px var(--interactive-accent);
  }

  .note-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .note-title-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .note-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-normal);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .note-item.selected .note-title {
    color: var(--text-on-accent);
  }

  .note-preview {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
  }

  .note-item.selected .note-preview {
    color: var(--text-on-accent);
    opacity: 0.8;
  }

  .note-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .note-date {
    font-size: 10px;
    color: var(--text-faint);
  }

  .note-tag {
    font-size: 10px;
    color: var(--interactive-accent);
    background: var(--background-modifier-hover);
    border-radius: 2px;
    padding: 0 3px;
  }

  .note-item.selected .note-date {
    color: var(--text-on-accent);
    opacity: 0.7;
  }

  .note-item.selected .note-tag {
    color: var(--text-on-accent);
    background: rgba(255, 255, 255, 0.15);
  }
</style>
