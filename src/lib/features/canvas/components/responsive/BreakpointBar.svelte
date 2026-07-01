<script lang="ts">
  import { writable } from 'svelte/store';
  import { DEFAULT_BREAKPOINTS, type Breakpoint } from '@/features/canvas/types/design/responsive';

  export let activeBreakpoint: Breakpoint | null = null;

  const breakpoints = writable<Breakpoint[]>([...DEFAULT_BREAKPOINTS]);
  let customWidth = 1024;

  function selectBreakpoint(bp: Breakpoint) {
    activeBreakpoint = bp;
  }

  function setCustomWidth(width: number) {
    customWidth = Math.max(200, Math.min(3000, width));
    activeBreakpoint = { id: 'custom', name: 'Custom', minWidth: customWidth };
  }

  function clearBreakpoint() {
    activeBreakpoint = null;
  }
</script>

<div class="breakpoint-bar">
  <div class="breakpoint-segments">
    {#each $breakpoints as bp (bp.id)}
      <button
        class="segment"
        class:active={activeBreakpoint?.id === bp.id}
        on:click={() => selectBreakpoint(bp)}
        title="{bp.name}: {bp.minWidth}px{bp.maxWidth ? ` - ${bp.maxWidth}px` : '+'}"
      >
        <span class="segment-name">{bp.name}</span>
        <span class="segment-width">{bp.minWidth}px</span>
      </button>
    {/each}
  </div>

  <div class="custom-width">
    <input
      type="number"
      min="200"
      max="3000"
      bind:value={customWidth}
      on:change={() => setCustomWidth(customWidth)}
    />
    <span class="unit">px</span>
  </div>

  {#if activeBreakpoint}
    <button class="clear-btn" on:click={clearBreakpoint}>&#215;</button>
  {/if}
</div>

<style>
  .breakpoint-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
  }
  .breakpoint-segments {
    display: flex;
    gap: 2px;
  }
  .segment {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: none;
    cursor: pointer;
  }
  .segment:hover {
    background: var(--bg-hover);
  }
  .segment.active {
    background: var(--accent);
    color: var(--text-on-accent);
    border-color: var(--accent);
  }
  .segment-name {
    font-size: var(--font-size-xs);
    font-weight: 500;
  }
  .segment-width {
    font-size: 10px;
    opacity: 0.7;
  }
  .custom-width {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
  }
  .custom-width input {
    width: 60px;
    padding: 2px 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    text-align: right;
    font-size: var(--font-size-sm);
  }
  .unit {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  .clear-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 2px 6px;
  }
</style>
