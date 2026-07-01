<script lang="ts">
  /**
   * T074: Breakpoint bar shown in canvas toolbar when responsive preview mode is active.
   */
  import BreakpointBar from './BreakpointBar.svelte';
  import type { Breakpoint } from '@/features/canvas/types/design/responsive';

  export let active: boolean = false;

  let activeBreakpoint: Breakpoint | null = null;
</script>

{#if active}
  <div class="responsive-toolbar">
    <BreakpointBar bind:activeBreakpoint />
    <span class="width-display">{activeBreakpoint ? `${activeBreakpoint.minWidth}-${activeBreakpoint.maxWidth}px` : 'Custom'}</span>
  </div>
{/if}

<style>
  .responsive-toolbar {
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    padding: 4px var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    background: var(--background-secondary);
  }

  .width-display {
    font-size: 11px;
    font-family: var(--font-monospace);
    color: var(--text-muted);
  }
</style>
