<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let selectedCount: number;
  export let portentTypes: string[];
  export let lifecycleStates: string[];
  export let onSelectAll: () => void;
  export let onClearSelection: () => void;
  export let onBatchClassify: (type: string, lifecycle: string) => void;

  let batchType = '';
  let batchLifecycle = '';

  function handleClassify() {
    onBatchClassify(batchType, batchLifecycle);
    batchType = '';
    batchLifecycle = '';
  }
</script>

<div class="batch-actions">
  <div class="batch-info">
    <Icon name="check-square" size={16} />
    <span>{selectedCount} selected</span>
    <button class="text-btn" on:click={onSelectAll}>Select all</button>
    <button class="text-btn" on:click={onClearSelection}>Clear</button>
  </div>

  <div class="batch-controls">
    <select bind:value={batchType} class="batch-select">
      <option value="">Assign type...</option>
      {#each portentTypes as type}
        <option value={type}>{type}</option>
      {/each}
    </select>

    <select bind:value={batchLifecycle} class="batch-select">
      <option value="">Set lifecycle...</option>
      {#each lifecycleStates as state}
        <option value={state}>{state}</option>
      {/each}
    </select>

    <button
      class="classify-btn"
      on:click={handleClassify}
      disabled={!batchType && !batchLifecycle}
    >
      <Icon name="check" size={14} />
      Classify Selected
    </button>
  </div>
</div>

<style>
  .batch-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 20px;
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .batch-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: var(--text-normal);
  }

  .text-btn {
    background: none;
    border: none;
    color: var(--interactive-accent);
    font-size: 13px;
    cursor: pointer;
    text-decoration: underline;
  }

  .text-btn:hover {
    color: var(--interactive-accent-hover);
  }

  .batch-controls {
    display: flex;
    gap: 8px;
  }

  .batch-select {
    padding: 6px 10px;
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: 12px;
    cursor: pointer;
  }

  .classify-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .classify-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
