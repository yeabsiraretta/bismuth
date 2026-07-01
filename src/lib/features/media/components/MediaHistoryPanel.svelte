<script lang="ts">
  /**
   * MediaHistoryPanel — shows the undo history stack from mediaStore.editChain.
   * Each operation is a removable row. Removal calls removeOperation from the store.
   */
  import { editChain, removeOperation } from '../stores/mediaStore';
  import type { PhotoOperation, VideoOperation } from '../types/media';

  $: chain = $editChain;
  $: operations = chain?.operations ?? [];

  function formatOperation(op: PhotoOperation | VideoOperation): string {
    const params = 'params' in op && op.params ? JSON.stringify(op.params) : '';
    return params ? `${op.type} (${params})` : op.type;
  }

  function handleRemove(index: number): void {
    removeOperation(index);
  }
</script>

<div class="media-history-panel">
  <h3 class="panel-title">Edit History</h3>
  {#if operations.length === 0}
    <p class="empty-state">No operations applied.</p>
  {:else}
    <ol class="op-list" aria-label="Edit operations history">
      {#each operations as op, index (index)}
        <li class="op-row">
          <span class="op-index" aria-hidden="true">{index + 1}</span>
          <span class="op-name">{formatOperation(op)}</span>
          <button
            class="remove-btn"
            on:click={() => handleRemove(index)}
            aria-label="Remove operation {index + 1}: {op.type}"
            title="Remove this operation">Remove</button
          >
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .media-history-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
    padding: var(--spacing-s);
    height: 100%;
    overflow-y: auto;
  }
  .panel-title {
    font-size: var(--font-ui-small);
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }
  .empty-state {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    text-align: center;
    padding: var(--spacing-m) 0;
  }
  .op-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  .op-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
  }
  .op-index {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    width: 20px;
    text-align: right;
    flex-shrink: 0;
  }
  .op-name {
    flex: 1;
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    font-family: var(--font-monospace, monospace);
    text-transform: capitalize;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .remove-btn {
    padding: 2px var(--spacing-xs);
    background: transparent;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    font-size: var(--font-smallest);
    flex-shrink: 0;
  }
  .remove-btn:hover {
    color: var(--text-error);
    border-color: var(--text-error);
    background: var(--background-modifier-error);
  }
</style>
