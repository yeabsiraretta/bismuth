<script lang="ts">
  import type { LayoutChild } from '@/features/canvas/types/settings';

  export let sizing: LayoutChild['sizing'] = 'hug';
  export let minWidth: number | undefined = undefined;
  export let maxWidth: number | undefined = undefined;
  export let onChange: ((value: LayoutChild['sizing']) => void) | undefined = undefined;

  const sizingOptions: Array<{ value: LayoutChild['sizing']; icon: string; label: string }> = [
    { value: 'fill', icon: '↔', label: 'Fill container' },
    { value: 'hug', icon: '⊂⊃', label: 'Hug contents' },
    { value: 'fixed', icon: '▬', label: 'Fixed size' },
  ];

  function cycle() {
    const idx = sizingOptions.findIndex((o) => o.value === sizing);
    const next = sizingOptions[(idx + 1) % sizingOptions.length];
    onChange?.(next.value);
  }
</script>

<div class="sizing-toggle">
  <button
    class="toggle-btn"
    on:click={cycle}
    title={sizingOptions.find((o) => o.value === sizing)?.label}
  >
    <span class="icon">{sizingOptions.find((o) => o.value === sizing)?.icon}</span>
    <span class="label">{sizing}</span>
  </button>
  {#if sizing === 'fixed' && (minWidth !== undefined || maxWidth !== undefined)}
    <div class="constraints">
      {#if minWidth !== undefined}<span class="bound">min:{minWidth}</span>{/if}
      {#if maxWidth !== undefined}<span class="bound">max:{maxWidth}</span>{/if}
    </div>
  {/if}
</div>

<style>
  .sizing-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }
  .toggle-btn:hover {
    background: var(--bg-hover);
  }
  .icon {
    font-size: 0.9em;
  }
  .label {
    text-transform: capitalize;
  }
  .constraints {
    display: flex;
    gap: 4px;
  }
  .bound {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    padding: 0 3px;
    background: var(--bg-tertiary);
    border-radius: 2px;
  }
</style>
