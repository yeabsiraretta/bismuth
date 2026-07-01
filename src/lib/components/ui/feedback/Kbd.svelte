<script lang="ts">
  export let keys: string | string[];
  $: keyArray = Array.isArray(keys) ? keys : [keys];
</script>

<span class="kbd-group">
  {#each keyArray as key, i}
    {#if i > 0}<span class="kbd-sep">+</span>{/if}
    <kbd class="kbd">{key}</kbd>
  {/each}
</span>

<style>
  .kbd-group {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xxs, 2px);
  }

  .kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--spacing-xs);
    font-family: var(--font-monospace);
    font-size: var(--font-smallest);
    color: var(--text-muted);
    background: var(--background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xs);
    line-height: 1.6;
  }

  .kbd-sep {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
</style>
