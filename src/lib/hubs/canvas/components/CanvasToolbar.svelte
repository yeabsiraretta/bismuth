<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import {
    canUndo,
    canRedo,
    undoCanvas,
    redoCanvas,
  } from '@/hubs/canvas/stores/canvas-store.svelte';
  import {
    getToolMode,
    setToolMode,
    type CanvasToolMode,
  } from '@/hubs/canvas/stores/canvas-tool-store.svelte';

  let mode = $derived(getToolMode());
  let hasUndo = $derived(canUndo());
  let hasRedo = $derived(canRedo());

  const tools: { id: CanvasToolMode; label: string; icon: string }[] = [
    { id: 'select', label: 'Select (V)', icon: 'tool-select' },
    { id: 'rect', label: 'Rectangle (R)', icon: 'tool-rect' },
    { id: 'ellipse', label: 'Ellipse (O)', icon: 'tool-ellipse' },
    { id: 'line', label: 'Line (L)', icon: 'tool-line' },
    { id: 'text', label: 'Text (T)', icon: 'tool-text' },
    { id: 'note', label: 'Sticky Note (N)', icon: 'tool-note' },
    { id: 'connect', label: 'Connect (C)', icon: 'tool-connect' },
    { id: 'pan', label: 'Pan (H)', icon: 'tool-pan' },
  ];
</script>

<div class="canvas-tools">
  <button
    class="tool-btn undo"
    onclick={undoCanvas}
    disabled={!hasUndo}
    title="Undo (⌘Z)"
    aria-label="Undo"><BIcon name="undo" size={14} /></button
  >
  <button
    class="tool-btn redo"
    onclick={redoCanvas}
    disabled={!hasRedo}
    title="Redo (⌘⇧Z)"
    aria-label="Redo"><BIcon name="redo" size={14} /></button
  >
  <span class="tool-sep"></span>
  {#each tools as tool (tool.id)}
    <button
      class="tool-btn"
      class:active={mode === tool.id}
      onclick={() => setToolMode(tool.id)}
      title={tool.label}
      aria-label={tool.label}><BIcon name={tool.icon} size={14} /></button
    >
  {/each}
</div>

<style>
  .canvas-tools {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .tool-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }
  .tool-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .tool-btn.active {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .tool-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .tool-sep {
    width: 1px;
    height: 18px;
    background: var(--color-border);
    margin: 0 2px;
  }
</style>
