<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import CaptureNoteCard from './CaptureNoteCard.svelte';
  import CaptureBatchBar from './CaptureBatchBar.svelte';
  import ClassificationView from './ClassificationView.svelte';
  import MergeNotesModal from './MergeNotesModal.svelte';
  import { onMount, onDestroy } from 'svelte';
  import {
    capturedNotes as capturedNotesStore,
    selectedCaptures,
    isCaptureLoading,
    toggleCaptureSelection,
    selectAllCaptures,
    clearCaptureSelection,
    setupCaptureListeners,
    notesByLifecycle,
  } from '../stores/capture';
  import { refreshNotes } from '@/stores/vault/vault';
  import { DEFAULT_PORTENT_TYPES, deriveLifecycle } from '@/types/data/entity';
  import type { LifecycleState } from '@/types/data/entity';
  import {
    openClassification,
    handleClassificationSave as doClassificationSave,
    handleClassificationDelete as doClassificationDelete,
    handleAssignType,
    handleSetLifecycle,
    handleBatchClassify,
    handleDelete,
    handleQuickCapture,
    handleArchiveNote,
    handleOrganizeNote,
  } from './captureDashboardLogic';

  const portentTypes = DEFAULT_PORTENT_TYPES.map((t) => t.name);
  const lifecycleStates: LifecycleState[] = ['captured', 'organized', 'archived'];

  let cleanupListeners: (() => void) | null = null;
  let activeNotePath: string | null = null;
  let mergeModalOpen = false;
  $: mergeSourcePaths = Array.from($selectedCaptures);

  $: activeNote = activeNotePath ? captured.find((n) => n.path === activeNotePath) || null : null;

  function closeClassification() {
    activeNotePath = null;
  }

  async function handleSave(data: {
    title: string;
    content: string;
    type: string;
    lifecycle: string;
    tags: string[];
  }) {
    if (!activeNotePath) return;
    await doClassificationSave(activeNotePath, data, closeClassification);
  }

  async function handleDeleteClassification() {
    if (!activeNotePath) return;
    await doClassificationDelete(activeNotePath, closeClassification);
  }

  function toggleSelection(path: string, event: MouseEvent) {
    if (event.metaKey || event.ctrlKey) {
      toggleCaptureSelection(path);
    } else {
      openClassification(path);
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
  $: stats = {
    captured: $notesByLifecycle.captured.length,
    organized: $notesByLifecycle.organized.length,
    archived: $notesByLifecycle.archived.length,
  };

  $: filteredNotes = filterType
    ? captured.filter((n) => n.frontmatter?.type === filterType)
    : captured;

  $: sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'type')
      return (a.frontmatter?.type || '').localeCompare(b.frontmatter?.type || '');
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
</script>

{#if activeNote}
  <ClassificationView
    title={activeNote.title}
    content={activeNote.content || ''}
    path={activeNote.path}
    type={activeNote.frontmatter?.type}
    lifecycle={activeNote.frontmatter ? deriveLifecycle(activeNote.frontmatter) : 'captured'}
    tags={activeNote.frontmatter?.tags || []}
    {portentTypes}
    {lifecycleStates}
    onBack={closeClassification}
    onSave={handleSave}
    onDelete={handleDeleteClassification}
  />
{:else}
  <div class="capture-dashboard">
    <PanelHeader icon="inbox" title="Inbox" count={captured.length || undefined}>
      <svelte:fragment slot="actions">
        <button
          class="icon-btn"
          on:click={handleQuickCapture}
          title="Quick Capture (Cmd+Shift+N)"
          aria-label="Quick capture"
        >
          <Icon name="plus" size={14} />
        </button>
        <button class="icon-btn" on:click={refreshNotes} title="Refresh" aria-label="Refresh notes">
          <Icon name="refresh-cw" size={14} />
        </button>
      </svelte:fragment>
    </PanelHeader>

    <div class="lifecycle-stats" aria-label="Lifecycle counts">
      <span class="stat-badge">Captured: {stats.captured}</span>
      <span class="stat-badge">Organized: {stats.organized}</span>
      <span class="stat-badge">Archived: {stats.archived}</span>
    </div>

    <div class="filter-bar">
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
    </div>

    <CaptureBatchBar
      selectedCount={selected.size}
      totalCount={sortedNotes.length}
      {portentTypes}
      {lifecycleStates}
      onSelectAll={selectAllCaptures}
      onClearSelection={clearCaptureSelection}
      onBatchClassify={handleBatchClassify}
      onMerge={selected.size >= 2
        ? () => {
            mergeModalOpen = true;
          }
        : undefined}
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
            {filterType
              ? 'Try removing the filter or capture new notes.'
              : 'Capture fleeting thoughts before they slip away.'}
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
              onArchive={() => handleArchiveNote(note.path)}
              onOrganize={(folder) => handleOrganizeNote(note.path, folder)}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<MergeNotesModal
  isOpen={mergeModalOpen}
  sources={mergeSourcePaths}
  onClose={() => {
    mergeModalOpen = false;
  }}
  onMerged={() => {
    mergeModalOpen = false;
    clearCaptureSelection();
  }}
/>

<style>
  .capture-dashboard {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--background-primary);
  }
  .lifecycle-stats {
    display: flex;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }
  .stat-badge {
    font-size: var(--font-smallest);
    font-weight: 500;
    color: var(--text-muted);
    background: var(--background-modifier-hover);
    border-radius: var(--radius-s);
    padding: 2px 6px;
    white-space: nowrap;
  }
  .filter-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
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
