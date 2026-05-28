<script lang="ts">
  import { activeTool, setActiveTool, canvasSettings } from '@/stores/canvas/canvasStore';
  import type { Tool } from '@/types/canvas';
  import Icon from '@/components/icons/Icon.svelte';

  function selectTool(tool: Tool) {
    setActiveTool(tool);
  }

  function toggleGrid() {
    canvasSettings.update((s) => ({ ...s, showGrid: !s.showGrid }));
  }

  function toggleSnap() {
    canvasSettings.update((s) => ({ ...s, snapToGrid: !s.snapToGrid }));
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
    {#each tools as tool}
      <button
        class="tool-button"
        class:active={$activeTool === tool.id}
        on:click={() => selectTool(tool.id)}
        title={tool.label}
        aria-label={tool.label}
      >
        <Icon name={tool.icon} size={18} />
        <span class="tool-label">{tool.label}</span>
      </button>
    {/each}
  </div>

  <div class="divider"></div>

  <div class="tool-group">
    <button
      class="tool-button"
      class:active={$canvasSettings.showGrid}
      on:click={toggleGrid}
      title="Toggle Grid"
      aria-label="Toggle grid"
    >
      <Icon name="grid" size={18} />
      <span class="tool-label">Grid</span>
    </button>

    <button
      class="tool-button"
      class:active={$canvasSettings.snapToGrid}
      on:click={toggleSnap}
      title="Snap to Grid"
      aria-label="Snap to grid"
    >
      <Icon name="maximize" size={18} />
      <span class="tool-label">Snap</span>
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

  .divider {
    width: 1px;
    height: 2rem;
    background: var(--border-color);
  }

  .tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--spacing-s) var(--spacing-s);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    color: var(--text-normal);
    cursor: pointer;
    transition: all var(--transition-fast);
    min-width: 3.5rem;
  }

  .tool-button:hover {
    background: var(--background-modifier-hover);
    border-color: var(--border-color);
  }

  .tool-button.active {
    background: var(--interactive-hover);
    border-color: var(--interactive-accent);
    color: var(--interactive-accent);
  }

  .tool-label {
    font-size: var(--font-smallest);
    font-weight: var(--font-medium);
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
</style>
