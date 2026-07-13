<script lang="ts">
  /** Renders one or more keyboard keys as styled `<kbd>` elements. @component */
  let { keys }: { keys: string | string[] } = $props();
  let keyArray = $derived(Array.isArray(keys) ? keys : [keys]);
</script>

<span class="kbd-group">
  {#each keyArray as key, i (key)}
    {#if i > 0}<span class="kbd-sep">+</span>{/if}
    <kbd class="kbd">{key}</kbd>
  {/each}
</span>

<style>
  .kbd-group {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--color-text-muted);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    line-height: 1.6;
  }
  .kbd-sep {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
  }
</style>
