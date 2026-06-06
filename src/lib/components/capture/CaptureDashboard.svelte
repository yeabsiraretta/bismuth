<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import CaptureNoteCard from './CaptureNoteCard.svelte';
  import CaptureBatchBar from './CaptureBatchBar.svelte';
  import { onMount, onDestroy } from 'svelte';
  import {
    capturedNotes as capturedNotesStore,
    selectedCaptures,
    isCaptureLoading,
    toggleCaptureSelection,
    selectAllCaptures,
    clearCaptureSelection,
    assignType,
    setLifecycleState,
    batchClassify,
    quickCapture,
    setupCaptureListeners,
  } from '@/stores/capture/capture';
  import { refreshNotes } from '@/stores/vault/vault';
  import { DEFAULT_PORTENT_TYPES } from '@/types/entity';
  import type { PortentType, LifecycleState } from '@/types/entity';
  import * as vaultService from '@/services/vault/vault';

  const portentTypes = DEFAULT_PORTENT_TYPES.map((t) => t.name);
  const lifecycleStates: LifecycleState[] = ['captured', 'organized', 'archived'];

  let cleanupListeners: (() => void) | null = null;

  function toggleSelection(path: string, event: MouseEvent) {
    if (event.metaKey || event.ctrlKey) {
      toggleCaptureSelection(path);
    } else {
      clearCaptureSelection();
      toggleCaptureSelection(path);
    }
  }

  async function handleAssignType(path: string, type: string) {
    try {
      await assignType(path, type as PortentType);
    } catch (error) {
      console.error('Failed to assign type:', error);
    }
  }

  async function handleSetLifecycle(path: string, lifecycle: string) {
    try {
      await setLifecycleState(path, lifecycle as LifecycleState);
    } catch (error) {
      console.error('Failed to set lifecycle:', error);
    }
  }

  async function handleBatchClassify(type: string, lifecycle: string) {
    try {
      await batchClassify(
        type ? (type as PortentType) : null,
        lifecycle ? (lifecycle as LifecycleState) : null
      );
    } catch (error) {
      console.error('Batch classify failed:', error);
    }
  }

  async function handleDelete(path: string) {
    if (!confirm(`Delete "${path}"?`)) return;
    try {
      await vaultService.deleteNote(path);
      await refreshNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }

  async function handleQuickCapture() {
    try {
      await quickCapture();
    } catch (error) {
      console.error('Quick capture failed:', error);
    }
  }

  onMount(async () => {
    await refreshNotes();
    cleanupListeners = await setupCaptureListeners();
  });

  onDestroy(() => {
    cleanupListeners?.();
  });

  type SortKey = 'date' | 'type' | 'title';
  let sortBy: SortKey = 'date';
  let filterType = '';

  $: captured = $capturedNotesStore;
  $: selected = $selectedCaptures;
  $: isLoading = $isCaptureLoading;

  $: filteredNotes = filterType
    ? captured.filter(n => n.frontmatter?.type === filterType)
    : captured;

  $: sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'type') return (a.frontmatter?.type || '').localeCompare(b.frontmatter?.type || '');
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
</script>

<div class="capture-dashboard">
  <div class="dashboard-header">
    <div class="header-left">
      <Icon name="inbox" size={18} />
      <h2>Inbox</h2>
      <span class="count-badge">{captured.length}</span>
    </div>

    <div class="header-actions">
      <select class="sort-select" bind:value={sortBy} aria-label="Sort notes">
        <option value="date">Newest</option>
        <option value="title">Title</option>
        <option value="type">Type</option>
      </select>
      <select class="sort-select" bind:value={filterType} aria-label="Filter by type">
        <option value="">All types</option>
        {#each portentTypes as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
      <button class="icon-btn" on:click={handleQuickCapture} title="Quick Capture (Cmd+Shift+N)" aria-label="Quick capture">
        <Icon name="plus" size={16} />
      </button>
      <button class="icon-btn" on:click={refreshNotes} title="Refresh" aria-label="Refresh notes">
        <Icon name="refresh-cw" size={16} />
      </button>
    </div>
  </div>

  <CaptureBatchBar
    selectedCount={selected.size}
    totalCount={sortedNotes.length}
    {portentTypes}
    {lifecycleStates}
    onSelectAll={selectAllCaptures}
    onClearSelection={clearCaptureSelection}
    onBatchClassify={handleBatchClassify}
  />

  <div class="notes-list">
    {#if isLoading}
      <div class="loading-state">
        <Icon name="loader" size={32} />
        <p>Loading captured notes...</p>
      </div>
    {:else if sortedNotes.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <Icon name="inbox" size={48} />
        </div>
        <h3 class="empty-title">{filterType ? 'No matching notes' : 'Inbox is empty'}</h3>
        <p class="empty-description">
          {filterType ? 'Try removing the filter or capture new notes.' : 'Capture fleeting thoughts before they slip away.'}
        </p>
        {#if !filterType}
          <button class="cta-btn" on:click={handleQuickCapture}>
            <Icon name="plus" size={16} />
            Quick Capture
          </button>
        {/if}
        <span class="empty-hint">Cmd+Shift+N from anywhere</span>
      </div>
    {:else}
      <div class="notes-grid">
        {#each sortedNotes as note (note.path)}
          <CaptureNoteCard
            title={note.title}
            snippet={note.content?.slice(0, 120) || ''}
            created={note.created_at}
            path={note.path}
            type={note.frontmatter?.type}
            selected={selected.has(note.path)}
            {portentTypes}
            {lifecycleStates}
            onSelect={(e) => toggleSelection(note.path, e)}
            onAssignType={(type) => handleAssignType(note.path, type)}
            onSetLifecycle={(lc) => handleSetLifecycle(note.path, lc)}
            onDelete={() => handleDelete(note.path)}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .capture-dashboard {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--background-primary);
  }

  .dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .header-left h2 {
    font-size: var(--font-ui-medium);
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }

  .count-badge {
    padding: 1px 6px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sort-select {
    padding: 4px 6px;
    background: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: var(--font-smallest);
    color: var(--text-muted);
    cursor: pointer;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
  }

  .icon-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .notes-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-m);
  }

  .notes-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl) var(--spacing-m);
    gap: var(--spacing-s);
    color: var(--text-muted);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl) var(--spacing-m);
    gap: var(--spacing-s);
    text-align: center;
  }

  .empty-icon {
    color: var(--text-faint);
    opacity: 0.5;
  }

  .empty-title {
    margin: 0;
    font-size: var(--font-ui-medium);
    font-weight: 600;
    color: var(--text-muted);
  }

  .empty-description {
    margin: 0;
    font-size: var(--font-ui-small);
    color: var(--text-faint);
    max-width: 240px;
    line-height: 1.5;
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-m);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-m);
    font-size: var(--font-ui-small);
    font-weight: 600;
    cursor: pointer;
    margin-top: var(--spacing-xs);
  }

  .cta-btn:hover {
    background: var(--interactive-accent-hover);
  }

  .empty-hint {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    margin-top: var(--spacing-xs);
  }
</style>
