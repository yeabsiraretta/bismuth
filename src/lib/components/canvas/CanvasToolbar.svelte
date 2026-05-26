<script lang="ts">
  import { activeTool, setActiveTool, canvasSettings } from '@/stores/canvas/canvasStore';
  import type { Tool } from '@/types/canvas';

  function selectTool(tool: Tool) {
    setActiveTool(tool);
  }

  function toggleGrid() {
    canvasSettings.update((s) => ({ ...s, showGrid: !s.showGrid }));
  }

  function toggleSnap() {
    canvasSettings.update((s) => ({ ...s, snapToGrid: !s.snapToGrid }));
  }

  const tools: Array<{ id: Tool; label: string; icon: string }> = [
    { id: 'select', label: 'Select', icon: '⬚' },
    { id: 'rectangle', label: 'Rectangle', icon: '▭' },
    { id: 'circle', label: 'Circle', icon: '○' },
    { id: 'text', label: 'Text', icon: 'T' },
    { id: 'pan', label: 'Pan', icon: '✋' },
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
      >
        <span class="tool-icon">{tool.icon}</span>
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
    >
      <span class="tool-icon">#</span>
      <span class="tool-label">Grid</span>
    </button>

    <button
      class="tool-button"
      class:active={$canvasSettings.snapToGrid}
      on:click={toggleSnap}
      title="Snap to Grid"
    >
      <span class="tool-icon">⊞</span>
      <span class="tool-label">Snap</span>
    </button>
  </div>
</div>

<style>
  .canvas-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .tool-group {
    display: flex;
    gap: 0.25rem;
  }

  .divider {
    width: 1px;
    height: 2rem;
    background: #e5e7eb;
  }

  .tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s;
    min-width: 4rem;
  }

  .tool-button:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  .tool-button.active {
    background: #dbeafe;
    border-color: #3b82f6;
    color: #1e40af;
  }

  .tool-icon {
    font-size: 1.25rem;
    line-height: 1;
  }

  .tool-label {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
</style>
