<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { formatDistanceToNow, fromUnixTime } from 'date-fns';
  import type { CanvasDocument } from '@/features/canvas/types';

  function formatRelativeTime(ts: number): string {
    return formatDistanceToNow(fromUnixTime(ts), { addSuffix: true });
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
  <div class="card-grid">
    {#each canvases as canvas (canvas.id)}
      <div
        class="card"
        on:click={() => onOpen?.({ id: canvas.id })}
        on:keydown={(e) => e.key === 'Enter' && onOpen?.({ id: canvas.id })}
        role="button"
        tabindex="0"
      >
        <div class="card-thumbnail">
          <div class="thumbnail-content">
            {#if canvas.elements.length > 0}
              <span class="element-badge">{canvas.elements.length} elements</span>
            {:else}
              <Icon name="layout" size={24} color="var(--text-faint)" />
            {/if}
          </div>
        </div>
        <div class="card-footer">
          <div class="card-meta">
            <span class="card-name">{canvas.name}</span>
            <span class="card-time">Edited {formatRelativeTime(canvas.modified_at)}</span>
          </div>
          <button
            class="card-delete"
            on:click|stopPropagation={() => onDelete?.({ id: canvas.id, name: canvas.name })}
            title="Delete"
            aria-label="Delete canvas"
          >
            <Icon name="trash-2" size={14} />
          </button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--spacing-m);
    padding-bottom: var(--spacing-m);
  }

  .card {
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    overflow: hidden;
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast);
    text-align: left;
    padding: 0;
  }

  .card:hover {
    border-color: var(--interactive-accent);
    box-shadow: var(--shadow-m);
  }

  .card-thumbnail {
    aspect-ratio: 16 / 10;
    background: var(--background-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--border-color);
  }

  .thumbnail-content {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-faint);
  }

  .element-badge {
    font-size: var(--font-smallest);
    font-weight: var(--font-medium);
    color: var(--text-muted);
    background: var(--background-primary-alt);
    padding: 2px 8px;
    border-radius: var(--radius-s);
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-s) var(--spacing-m);
    gap: var(--spacing-s);
  }

  .card-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .card-name {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-time {
    font-size: var(--font-smallest);
    color: var(--text-muted);
  }

  .card-delete {
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

  .card:hover .card-delete {
    opacity: 1;
  }

  .card-delete:hover {
    color: var(--text-error);
    background: var(--background-modifier-error);
  }

  .empty-state {
    grid-column: 1 / -1;
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
