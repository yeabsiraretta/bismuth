<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let syncing = false;
  export let direction: 'canvas_to_code' | 'code_to_canvas' = 'canvas_to_code';

  const dispatch = createEventDispatcher<{ sync: { direction: typeof direction } }>();

  function handleSync() {
    if (syncing) return;
    dispatch('sync', { direction });
  }
</script>

<button
  class="sync-btn"
  class:syncing
  on:click={handleSync}
  disabled={syncing}
  title={direction === 'canvas_to_code' ? 'Generate docs from canvas' : 'Reflect code to canvas'}
>
  <span class="sync-icon" class:spinning={syncing}>⟳</span>
  <span class="sync-label">
    {#if syncing}Syncing...{:else}{direction === 'canvas_to_code' ? 'Canvas → Code' : 'Code → Canvas'}{/if}
  </span>
</button>

<style>
  .sync-btn { display: inline-flex; align-items: center; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-s); border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-primary); font-size: 11px; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
  .sync-btn:hover:not(:disabled) { background: var(--background-hover); border-color: var(--color-primary); }
  .sync-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .sync-btn.syncing { border-color: var(--color-primary); }
  .sync-icon { font-size: 14px; display: inline-block; }
  .sync-icon.spinning { animation: spin 1s linear infinite; }
  .sync-label { white-space: nowrap; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
