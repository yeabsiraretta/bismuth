<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    annotations,
    annotationCount,
    annotatorView,
    updateAnnotation,
    deleteAnnotation,
    setActiveColor,
  } from '../stores/annotatorStore';
  import { HIGHLIGHT_COLORS } from '../types';
  import type { HighlightColor, DocumentAnnotation } from '../types';

  let editingId: string | null = null;
  let editComment = '';
  let editTags = '';
  let filterColor: HighlightColor | 'all' = 'all';

  $: activeColor = $annotatorView.activeColor;
  $: filteredAnnotations =
    filterColor === 'all'
      ? $annotations
      : $annotations.filter((a: DocumentAnnotation) => a.color === filterColor);

  function startEdit(ann: DocumentAnnotation) {
    editingId = ann.id;
    editComment = ann.comment;
    editTags = ann.tags.join(', ');
  }

  async function saveEdit() {
    if (!editingId) return;
    await updateAnnotation(editingId, {
      comment: editComment,
      tags: editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    editingId = null;
  }

  function cancelEdit() {
    editingId = null;
  }

  async function handleDelete(id: string) {
    await deleteAnnotation(id);
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<div class="annotation-sidebar">
  <div class="sidebar-header">
    <h3>Annotations <span class="count">({$annotationCount})</span></h3>
  </div>

  <div class="color-palette">
    <span class="palette-label">Highlight:</span>
    {#each Object.entries(HIGHLIGHT_COLORS) as [name, hex]}
      <button
        class="color-swatch"
        class:active={activeColor === name}
        style="background: {hex}"
        on:click={() => setActiveColor(name as HighlightColor)}
        title={name}
      ></button>
    {/each}
  </div>

  <div class="filter-bar">
    <button
      class="filter-btn"
      class:active={filterColor === 'all'}
      on:click={() => (filterColor = 'all')}>All</button
    >
    {#each Object.entries(HIGHLIGHT_COLORS) as [name, hex]}
      <button
        class="filter-dot"
        class:active={filterColor === name}
        style="background: {hex}"
        on:click={() => (filterColor = filterColor === name ? 'all' : (name as HighlightColor))}
        title="Filter {name}"
      ></button>
    {/each}
  </div>

  <div class="annotations-list">
    {#each filteredAnnotations as ann (ann.id)}
      <div class="annotation-card" style="border-left-color: {HIGHLIGHT_COLORS[ann.color]}">
        {#if ann.page}
          <div class="ann-page">Page {ann.page}</div>
        {/if}

        <div class="ann-highlight">
          <mark style="background: {HIGHLIGHT_COLORS[ann.color]}">{ann.quoteSelector.exact}</mark>
        </div>

        {#if editingId === ann.id}
          <div class="ann-edit">
            <textarea
              bind:value={editComment}
              placeholder="Add comment…"
              class="edit-comment"
              rows="3"
            ></textarea>
            <input bind:value={editTags} placeholder="tag1, tag2, tag3" class="edit-tags" />
            <div class="edit-actions">
              <button class="save-btn" on:click={saveEdit}>Save</button>
              <button class="cancel-btn" on:click={cancelEdit}>Cancel</button>
            </div>
          </div>
        {:else}
          {#if ann.comment}
            <div class="ann-comment">{ann.comment}</div>
          {/if}

          {#if ann.tags.length > 0}
            <div class="ann-tags">
              {#each ann.tags as tag}
                <span class="tag">#{tag}</span>
              {/each}
            </div>
          {/if}

          <div class="ann-meta">
            <span class="ann-date">{formatDate(ann.createdAt)}</span>
            <div class="ann-actions">
              <button class="action-btn" on:click={() => startEdit(ann)} title="Edit">
                <Icon name="edit" size={12} />
              </button>
              <button
                class="action-btn danger"
                on:click={() => handleDelete(ann.id)}
                title="Delete"
              >
                <Icon name="trash" size={12} />
              </button>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="empty-state">
        <p>No annotations yet.</p>
        <p class="hint">Select text in the document to create highlights.</p>
      </div>
    {/each}
  </div>
</div>

<style>
  .annotation-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 280px;
    background: var(--bg-primary);
    border-left: 1px solid var(--border-primary);
    overflow: hidden;
  }
  .sidebar-header {
    padding: 12px 16px 8px;
    border-bottom: 1px solid var(--border-primary);
  }
  .sidebar-header h3 {
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
  }
  .count {
    color: var(--text-muted);
    font-weight: 400;
  }
  .color-palette,
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    font-size: var(--font-size-xs);
  }
  .palette-label {
    color: var(--text-secondary);
    margin-right: 4px;
  }
  .color-swatch,
  .filter-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .color-swatch.active,
  .filter-dot.active {
    border-color: var(--text-primary);
  }
  .filter-bar {
    border-bottom: 1px solid var(--border-primary);
    padding-top: 0;
  }
  .filter-btn {
    padding: 2px 8px;
    font-size: var(--font-size-xs);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: pointer;
  }
  .filter-btn.active {
    background: var(--bg-accent);
    color: var(--text-on-accent);
  }
  .annotations-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  .annotation-card {
    padding: 10px 12px;
    margin-bottom: 8px;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    border-left: 3px solid;
    font-size: var(--font-size-sm);
  }
  .ann-page {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-bottom: 4px;
  }
  .ann-highlight {
    margin-bottom: 6px;
    line-height: 1.4;
  }
  .ann-highlight mark {
    padding: 1px 3px;
    border-radius: 2px;
  }
  .ann-comment {
    color: var(--text-secondary);
    margin-bottom: 6px;
    line-height: 1.4;
  }
  .ann-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 6px;
  }
  .tag {
    font-size: var(--font-size-xs);
    color: var(--text-accent);
    background: var(--bg-accent-subtle);
    padding: 1px 6px;
    border-radius: var(--radius-sm);
  }
  .ann-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ann-date {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
  .ann-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .annotation-card:hover .ann-actions {
    opacity: 1;
  }
  .action-btn {
    padding: 2px 4px;
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm);
  }
  .action-btn:hover {
    background: var(--bg-hover);
  }
  .action-btn.danger:hover {
    color: var(--text-error);
  }
  .ann-edit {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .edit-comment,
  .edit-tags {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    font-family: inherit;
    resize: vertical;
  }
  .edit-actions {
    display: flex;
    gap: 6px;
  }
  .save-btn,
  .cancel-btn {
    padding: 4px 12px;
    font-size: var(--font-size-xs);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
  .save-btn {
    background: var(--bg-accent);
    color: var(--text-on-accent);
    border-color: var(--bg-accent);
  }
  .cancel-btn {
    background: var(--bg-secondary);
    color: var(--text-secondary);
  }
  .empty-state {
    text-align: center;
    padding: 24px 16px;
    color: var(--text-muted);
  }
  .hint {
    font-size: var(--font-size-xs);
    margin-top: 4px;
  }
</style>
