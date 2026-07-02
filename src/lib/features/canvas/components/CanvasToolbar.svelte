<script lang="ts">
  import {
    activeTool,
    setActiveTool,
    canvasSettings,
    toggleGrid,
    toggleSnap,
  } from '@/features/canvas/stores';
  import type { Tool } from '@/features/canvas/types';
  import Icon from '@/components/icons/Icon.svelte';
  import { showToast } from '@/stores/toast/toast';

  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  function handleHover(label: string) {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => showToast(label, 'info', 1500), 400);
  }

  function cancelHover() {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  }

  function selectTool(tool: Tool) {
    setActiveTool(tool);
  }

  const tools: Array<{ id: Tool; label: string; icon: string; group?: string }> = [
    { id: 'select', label: 'Select', icon: 'crosshair', group: 'pointer' },
    { id: 'pan', label: 'Pan', icon: 'move', group: 'pointer' },
    { id: 'frame', label: 'Frame', icon: 'layout', group: 'shapes' },
    { id: 'rectangle', label: 'Rect', icon: 'square', group: 'shapes' },
    { id: 'circle', label: 'Circle', icon: 'circle', group: 'shapes' },
    { id: 'line', label: 'Line', icon: 'minus', group: 'draw' },
    { id: 'arrow', label: 'Arrow', icon: 'arrow-right', group: 'draw' },
    { id: 'pen', label: 'Pen', icon: 'edit-3', group: 'draw' },
    { id: 'text', label: 'Text', icon: 'type', group: 'content' },
    { id: 'image', label: 'Image', icon: 'image', group: 'content' },
    { id: 'screen', label: 'Screen', icon: 'smartphone', group: 'layout' },
    { id: 'component', label: 'Component', icon: 'box', group: 'layout' },
  ];
</script>

<div class="canvas-toolbar">
  <div class="tool-group">
    {#each tools as tool (tool.id)}
      <button
        class="canvas-btn canvas-btn--tool"
        class:active={$activeTool === tool.id}
        onclick={() => selectTool(tool.id)}
        onmouseenter={() => handleHover(tool.label)}
        onmouseleave={cancelHover}
        aria-label={tool.label}
      >
        <Icon name={tool.icon} size={18} />
      </button>
    {/each}
  </div>

  <div class="canvas-divider canvas-divider--m"></div>

  <div class="tool-group">
    <button
      class="canvas-btn canvas-btn--tool"
      class:active={$canvasSettings.showGrid}
      onclick={toggleGrid}
      onmouseenter={() => handleHover('Toggle Grid')}
      onmouseleave={cancelHover}
      aria-label="Toggle grid"
    >
      <Icon name="grid" size={18} />
    </button>

    <button
      class="canvas-btn canvas-btn--tool"
      class:active={$canvasSettings.snapToGrid}
      onclick={toggleSnap}
      onmouseenter={() => handleHover('Snap to Grid')}
      onmouseleave={cancelHover}
      aria-label="Snap to grid"
    >
      <Icon name="maximize" size={18} />
    </button>
  </div>
</div>

<style>
  .canvas-toolbar {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s);
    background: var(--background-primary);
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow-s);
  }

  .tool-group {
    display: flex;
    gap: var(--spacing-xs);
  }
</style>
