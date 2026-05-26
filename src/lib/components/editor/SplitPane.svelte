<script lang="ts">
  import { onMount } from 'svelte';
  import NoteEditor from '@/components/note/NoteEditor.svelte';

  type SplitMode = 'none' | 'horizontal' | 'vertical';

  interface Pane {
    path: string;
    content: string;
  }

  export let split: SplitMode = 'none';
  export let panes: Pane[] = [{ path: '', content: '' }];

  let dividerPosition = 50;
  let isDragging = false;
  let containerRef: HTMLDivElement;

  function handleMouseDown(event: MouseEvent) {
    isDragging = true;
    event.preventDefault();
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging || !containerRef) return;

    const rect = containerRef.getBoundingClientRect();

    if (split === 'horizontal') {
      const newPosition = ((event.clientX - rect.left) / rect.width) * 100;
      dividerPosition = Math.max(20, Math.min(80, newPosition));
    } else if (split === 'vertical') {
      const newPosition = ((event.clientY - rect.top) / rect.height) * 100;
      dividerPosition = Math.max(20, Math.min(80, newPosition));
    }
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function closePane(index: number) {
    if (panes.length > 1) {
      panes = panes.filter((_, i) => i !== index);
      if (panes.length === 1) {
        split = 'none';
      }
    }
  }

  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });
</script>

<div
  class="split-pane-container"
  bind:this={containerRef}
  class:split-horizontal={split === 'horizontal'}
  class:split-vertical={split === 'vertical'}
>
  {#if split === 'none'}
    <div class="pane">
      <NoteEditor />
    </div>
  {:else}
    <div
      class="pane"
      style={split === 'horizontal' ? `width: ${dividerPosition}%` : `height: ${dividerPosition}%`}
    >
      <div class="pane-header">
        <span class="pane-title">Pane 1</span>
        <button class="pane-close" on:click={() => closePane(0)} aria-label="Close pane">×</button>
      </div>
      <NoteEditor />
    </div>

    <div
      class="divider"
      class:horizontal={split === 'horizontal'}
      class:vertical={split === 'vertical'}
      on:mousedown={handleMouseDown}
      role="separator"
      tabindex="0"
      aria-valuenow={dividerPosition}
      aria-valuemin={20}
      aria-valuemax={80}
      aria-label="Resize panes"
    >
      <div class="divider-handle"></div>
    </div>

    <div
      class="pane"
      style={split === 'horizontal'
        ? `width: ${100 - dividerPosition}%`
        : `height: ${100 - dividerPosition}%`}
    >
      <div class="pane-header">
        <span class="pane-title">Pane 2</span>
        <button class="pane-close" on:click={() => closePane(1)} aria-label="Close pane">×</button>
      </div>
      <NoteEditor />
    </div>
  {/if}
</div>

<style>
  .split-pane-container {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .split-horizontal {
    flex-direction: row;
  }

  .split-vertical {
    flex-direction: column;
  }

  .pane {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .pane-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    min-height: 36px;
  }

  .pane-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .pane-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: 4px;
    font-size: 1.25rem;
    line-height: 1;
    transition: all 0.15s ease;
  }

  .pane-close:hover {
    background: var(--color-border);
    color: var(--color-text);
  }

  .pane-close:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .divider {
    position: relative;
    flex-shrink: 0;
    background: var(--color-border);
    transition: background 0.15s ease;
  }

  .divider:hover {
    background: var(--color-primary);
  }

  .divider.horizontal {
    width: 4px;
    cursor: col-resize;
  }

  .divider.vertical {
    height: 4px;
    cursor: row-resize;
  }

  .divider-handle {
    position: absolute;
    background: transparent;
  }

  .divider.horizontal .divider-handle {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 40px;
  }

  .divider.vertical .divider-handle {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 12px;
  }

  .divider:active {
    background: var(--color-primary);
  }

  @media (max-width: 640px) {
    .split-horizontal {
      flex-direction: column;
    }

    .divider.horizontal {
      width: 100%;
      height: 4px;
      cursor: row-resize;
    }
  }
</style>
