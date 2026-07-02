<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { formatDistanceToNow, fromUnixTime, format } from 'date-fns';
  import type { CanvasDocument } from '@/features/canvas/types';
  function formatRelativeTime(ts: number): string {
    return formatDistanceToNow(fromUnixTime(ts), { addSuffix: true });
  }

  function formatShortDate(ts: number): string {
    return format(fromUnixTime(ts), 'MMM d, yyyy');
  }

  export let canvases: CanvasDocument[] = [];
  export let onOpen: ((detail: { id: string }) => void) | undefined = undefined;
  export let onDelete: ((detail: { id: string; name: string }) => void) | undefined = undefined;
</script>

{#if canvases.length === 0}
  <div class="empty-state">
    <Icon name="layout" size={48} color="var(--text-faint)" />
    <p class="empty-title">No canvases found</p>
    <p class="empty-hint">Create your first canvas to get started</p>
  </div>
{:else}
  <div class="list-table">
    <div class="list-header">
      <span class="col-name">Name</span>
      <span class="col-modified">Last modified</span>
      <span class="col-created">Created</span>
      <span class="col-elements">Elements</span>
    </div>
    {#each canvases as canvas (canvas.id)}
      <div
        class="list-row"
        on:click={() => onOpen?.({ id: canvas.id })}
        on:keydown={(e) => e.key === 'Enter' && onOpen?.({ id: canvas.id })}
        role="button"
        tabindex="0"
      >
        <div class="col-name">
          <div class="row-thumbnail">
            <Icon name="layout" size={16} color="var(--text-faint)" />
          </div>
          <span class="row-name">{canvas.name}</span>
        </div>
        <span class="col-modified">{formatRelativeTime(canvas.modified_at)}</span>
        <span class="col-created">{formatShortDate(canvas.created_at)}</span>
        <span class="col-elements">{canvas.elements.length}</span>
        <button
          class="row-delete"
          on:click|stopPropagation={() => onDelete?.({ id: canvas.id, name: canvas.name })}
          title="Delete"
          aria-label="Delete canvas"
        >
          <Icon name="trash-2" size={14} />
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .list-table {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    overflow: hidden;
  }

  .list-header {
    display: grid;
    grid-template-columns: 1fr 140px 140px 80px 32px;
    gap: var(--spacing-m);
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .list-row {
    display: grid;
    grid-template-columns: 1fr 140px 140px 80px 32px;
    gap: var(--spacing-m);
    align-items: center;
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-primary);
    border: none;
    border-bottom: 1px solid var(--border-subtle);
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast);
    width: 100%;
  }

  .list-row:last-child {
    border-bottom: none;
  }

  .list-row:hover {
    background: var(--background-modifier-hover);
  }

  .col-name {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    min-width: 0;
  }

  .row-thumbnail {
    width: 36px;
    height: 28px;
    border-radius: var(--radius-s);
    background: var(--background-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid var(--border-color);
  }

  .row-name {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-modified,
  .col-created,
  .col-elements {
    font-size: var(--font-smallest);
    color: var(--text-muted);
  }

  .row-delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-s);
    background: none;
    border: none;
    color: var(--text-faint);
    cursor: pointer;
    opacity: 0;
    transition:
      opacity var(--transition-fast),
      color var(--transition-fast);
  }

  .list-row:hover .row-delete {
    opacity: 1;
  }

  .row-delete:hover {
    color: var(--text-error);
    background: var(--background-modifier-error);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xxl) var(--spacing-m);
    color: var(--text-muted);
  }

  .empty-title {
    margin: 0;
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .empty-hint {
    margin: 0;
    font-size: var(--font-smaller);
    color: var(--text-faint);
  }
</style>
