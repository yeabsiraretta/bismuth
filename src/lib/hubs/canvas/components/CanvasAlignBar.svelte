<script lang="ts">
  import {
    computeAlignment,
    computeDistribution,
    type AlignDirection,
    type DistributeDirection,
  } from '@/hubs/canvas/services/canvas-grid';
  import { getSelectedElements, updateElement } from '@/hubs/canvas/stores/canvas-store.svelte';
  import BIcon from '@/ui/b-icon.svelte';
  import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';

  let selected = $derived(getSelectedElements());
  let canAlign = $derived(selected.length >= 2);
  let canDistribute = $derived(selected.length >= 3);

  function align(dir: AlignDirection) {
    const result = computeAlignment(selected, dir);
    for (const [id, pos] of result) {
      updateElement(id, pos as Partial<CanvasElement>);
    }
  }

  function distribute(dir: DistributeDirection) {
    const result = computeDistribution(selected, dir);
    for (const [id, pos] of result) {
      updateElement(id, pos as Partial<CanvasElement>);
    }
  }

  const alignBtns: { dir: AlignDirection; icon: string; label: string }[] = [
    { dir: 'left', icon: 'align-left', label: 'Align Left' },
    { dir: 'center-x', icon: 'align-center-x', label: 'Align Center' },
    { dir: 'right', icon: 'align-right', label: 'Align Right' },
    { dir: 'top', icon: 'align-top', label: 'Align Top' },
    { dir: 'center-y', icon: 'align-center-y', label: 'Align Middle' },
    { dir: 'bottom', icon: 'align-bottom', label: 'Align Bottom' },
  ];

  const distBtns: { dir: DistributeDirection; icon: string; label: string }[] = [
    { dir: 'horizontal', icon: 'distribute-h', label: 'Distribute Horizontally' },
    { dir: 'vertical', icon: 'distribute-v', label: 'Distribute Vertically' },
  ];
</script>

{#if canAlign}
  <div class="align-bar">
    {#each alignBtns as btn (btn.dir)}
      <button
        class="align-btn"
        onclick={() => align(btn.dir)}
        title={btn.label}
        aria-label={btn.label}><BIcon name={btn.icon} size={14} /></button
      >
    {/each}
    {#if canDistribute}
      <span class="align-sep"></span>
      {#each distBtns as btn (btn.dir)}
        <button
          class="align-btn"
          onclick={() => distribute(btn.dir)}
          title={btn.label}
          aria-label={btn.label}><BIcon name={btn.icon} size={14} /></button
        >
      {/each}
    {/if}
  </div>
{/if}

<style>
  .align-bar {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .align-btn {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }
  .align-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .align-sep {
    width: 1px;
    height: 16px;
    background: var(--color-border);
    margin: 0 2px;
  }
</style>
