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

  $: captured = $capturedNotesStore;
  $: selected = $selectedCaptures;
  $: isLoading = $isCaptureLoading;
  $: showBatchActions = selected.size > 0;
</script>

<div class="capture-dashboard">
  <div class="dashboard-header">
    <div class="header-left">
      <Icon name="inbox" size={20} />
      <h2>Capture Dashboard</h2>
      <span class="count-badge">{captured.length}</span>
    </div>

    <div class="header-actions">
      <button class="refresh-btn" on:click={handleQuickCapture} title="Quick Capture (Cmd+Shift+N)">
        <Icon name="plus" size={16} />
      </button>
      <button class="refresh-btn" on:click={refreshNotes} title="Refresh">
        <Icon name="refresh-cw" size={16} />
      </button>
    </div>
  </div>

  {#if showBatchActions}
    <CaptureBatchBar
      selectedCount={selected.size}
      {portentTypes}
      {lifecycleStates}
      onSelectAll={selectAllCaptures}
      onClearSelection={clearCaptureSelection}
      onBatchClassify={handleBatchClassify}
    />
  {/if}

  <div class="notes-list">
    {#if isLoading}
      <div class="loading-state">
        <Icon name="loader" size={32} />
        <p>Loading captured notes...</p>
      </div>
    {:else if captured.length === 0}
      <div class="empty-state">
        <Icon name="inbox" size={48} />
        <p>No captured notes</p>
        <span class="hint">Use Cmd/Ctrl+Shift+N to quick-capture a new note</span>
      </div>
    {:else}
      {#each captured as note}
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
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-left h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }

  .count-badge {
    padding: 2px 8px;
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .refresh-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .notes-list {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 32px;
    gap: 16px;
    color: var(--text-muted);
    text-align: center;
  }

  .empty-state p {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
  }

  .hint {
    font-size: 13px;
    color: var(--text-faint);
  }
</style>
