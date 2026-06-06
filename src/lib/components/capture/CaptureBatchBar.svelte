<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let selectedCount: number;
  export let totalCount: number = 0;
  export let portentTypes: string[];
  export let lifecycleStates: string[];
  export let onSelectAll: () => void;
  export let onClearSelection: () => void;
  export let onBatchClassify: (type: string, lifecycle: string) => void;
  export let onBatchDelete: (() => void) | undefined = undefined;

  let batchType = '';
  let batchLifecycle = '';

  $: expanded = selectedCount > 0;

  function handleClassify() {
    onBatchClassify(batchType, batchLifecycle);
    batchType = '';
    batchLifecycle = '';
  }
</script>

<div class="batch-bar" class:expanded>
  {#if !expanded}
    <!-- Collapsed: always visible with count badge -->
    <div class="batch-collapsed">
      <span class="batch-badge">{totalCount}</span>
      <span class="batch-summary">notes</span>
      <button class="select-all-btn" on:click={onSelectAll} aria-label="Select all notes">
        <Icon name="check-square" size={14} />
        Select all
      </button>
    </div>
  {:else}
    <!-- Expanded: full batch controls -->
    <div class="batch-header">
      <div class="batch-info">
        <span class="count-badge">{selectedCount}</span>
        <span class="count-label">selected</span>
      </div>
      <div class="batch-links">
        <button class="text-btn" on:click={onSelectAll}>All</button>
        <button class="text-btn" on:click={onClearSelection}>Clear</button>
      </div>
    </div>

    <div class="batch-controls">
      <select bind:value={batchType} class="batch-select" aria-label="Assign type">
        <option value="">Type...</option>
        {#each portentTypes as type}
          <option value={type}>{type}</option>
        {/each}
      </select>

      <select bind:value={batchLifecycle} class="batch-select" aria-label="Set lifecycle">
        <option value="">Lifecycle...</option>
        {#each lifecycleStates as state}
          <option value={state}>{state}</option>
        {/each}
      </select>

      <button
        class="classify-btn"
        on:click={handleClassify}
        disabled={!batchType && !batchLifecycle}
        aria-label="Classify selected"
      >
        <Icon name="check" size={14} />
        Apply
      </button>

      {#if onBatchDelete}
        <button class="delete-btn" on:click={onBatchDelete} aria-label="Delete selected">
          <Icon name="trash-2" size={14} />
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .batch-bar {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-m);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
    transition: padding 0.15s ease;
  }

  .batch-bar.expanded {
    padding: var(--spacing-s) var(--spacing-m);
  }

  .batch-collapsed {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .batch-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: var(--background-modifier-hover);
    color: var(--text-muted);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .batch-summary {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    margin-right: auto;
  }

  .select-all-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 4px 8px;
    border: none;
    background: none;
    color: var(--text-muted);
    font-size: var(--font-smallest);
    cursor: pointer;
    border-radius: var(--radius-s);
  }

  .select-all-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .batch-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .batch-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .count-label {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  .batch-links {
    display: flex;
    gap: var(--spacing-s);
  }

  .text-btn {
    background: none;
    border: none;
    color: var(--interactive-accent);
    font-size: var(--font-smallest);
    cursor: pointer;
    font-weight: 500;
  }

  .text-btn:hover {
    color: var(--interactive-accent-hover);
    text-decoration: underline;
  }

  .batch-controls {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .batch-select {
    flex: 1;
    padding: 5px 8px;
    background: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: 11px;
    cursor: pointer;
  }

  .classify-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .classify-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    color: var(--text-muted);
    border-radius: var(--radius-s);
    cursor: pointer;
  }

  .delete-btn:hover {
    background: var(--background-modifier-error);
    color: #ffffff;
  }
</style>
