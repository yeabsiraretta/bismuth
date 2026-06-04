<script lang="ts">
  import { selectedElements, currentCanvas } from '@/stores/canvas/canvasStore';
  import { updateElement } from '@/stores/canvas/canvasElements';
  import { createAutoLayout } from '@/utils/canvasAutoLayout';
  import type { CanvasElement, AutoLayout } from '@/types/canvas';

  $: element = getSelectedFrame($selectedElements, $currentCanvas?.elements ?? []);
  $: autoLayout = element?.properties.autoLayout ?? null;

  function getSelectedFrame(
    ids: string[],
    elements: CanvasElement[]
  ): CanvasElement | null {
    if (ids.length !== 1) return null;
    const el = elements.find((e) => e.id === ids[0]);
    if (!el || (el.element_type !== 'frame' && el.element_type !== 'group')) return null;
    return el;
  }

  function enableAutoLayout() {
    if (!element) return;
    const layout = createAutoLayout('vertical', 8, 16);
    updateElement(element.id, { autoLayout: layout });
  }

  function disableAutoLayout() {
    if (!element) return;
    updateElement(element.id, { autoLayout: undefined });
  }

  function updateLayout(updates: Partial<AutoLayout>) {
    if (!element || !autoLayout) return;
    const newLayout = { ...autoLayout, ...updates };
    updateElement(element.id, { autoLayout: newLayout });
  }

  function updatePadding(side: 'top' | 'right' | 'bottom' | 'left', value: number) {
    if (!autoLayout) return;
    const newPadding = { ...autoLayout.padding, [side]: value };
    updateLayout({ padding: newPadding });
  }

  function setUniformPadding(value: number) {
    updateLayout({ padding: { top: value, right: value, bottom: value, left: value } });
  }
</script>

{#if element}
  <div class="auto-layout-panel">
    <div class="panel-header">
      <span class="panel-title">Auto Layout</span>
      {#if autoLayout}
        <button class="remove-btn" on:click={disableAutoLayout} title="Remove auto layout">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      {:else}
        <button class="add-btn" on:click={enableAutoLayout} title="Add auto layout">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      {/if}
    </div>

    {#if autoLayout}
      <div class="layout-controls">
        <!-- Direction -->
        <div class="control-row">
          <label class="control-label">Direction</label>
          <div class="direction-toggle">
            <button
              class="dir-btn"
              class:active={autoLayout.direction === 'horizontal'}
              on:click={() => updateLayout({ direction: 'horizontal' })}
              title="Horizontal"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button
              class="dir-btn"
              class:active={autoLayout.direction === 'vertical'}
              on:click={() => updateLayout({ direction: 'vertical' })}
              title="Vertical"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Gap -->
        <div class="control-row">
          <label class="control-label">Gap</label>
          <input
            type="number"
            class="control-input"
            value={autoLayout.gap}
            min="0"
            on:change={(e) => updateLayout({ gap: parseInt(e.currentTarget.value) || 0 })}
          />
        </div>

        <!-- Padding -->
        <div class="control-row">
          <label class="control-label">Padding</label>
          <div class="padding-grid">
            <input
              type="number"
              class="pad-input"
              value={autoLayout.padding.top}
              min="0"
              title="Top"
              on:change={(e) => updatePadding('top', parseInt(e.currentTarget.value) || 0)}
            />
            <input
              type="number"
              class="pad-input"
              value={autoLayout.padding.right}
              min="0"
              title="Right"
              on:change={(e) => updatePadding('right', parseInt(e.currentTarget.value) || 0)}
            />
            <input
              type="number"
              class="pad-input"
              value={autoLayout.padding.bottom}
              min="0"
              title="Bottom"
              on:change={(e) => updatePadding('bottom', parseInt(e.currentTarget.value) || 0)}
            />
            <input
              type="number"
              class="pad-input"
              value={autoLayout.padding.left}
              min="0"
              title="Left"
              on:change={(e) => updatePadding('left', parseInt(e.currentTarget.value) || 0)}
            />
          </div>
        </div>

        <!-- Align Items -->
        <div class="control-row">
          <label class="control-label">Align</label>
          <div class="align-buttons">
            {#each ['start', 'center', 'end', 'stretch'] as align}
              <button
                class="align-btn"
                class:active={autoLayout.alignItems === align}
                on:click={() => updateLayout({ alignItems: align })}
                title={align}
              >
                {align[0].toUpperCase()}
              </button>
            {/each}
          </div>
        </div>

        <!-- Justify Content -->
        <div class="control-row">
          <label class="control-label">Justify</label>
          <div class="align-buttons">
            {#each ['start', 'center', 'end', 'space-between'] as justify}
              <button
                class="align-btn"
                class:active={autoLayout.justifyContent === justify}
                on:click={() => updateLayout({ justifyContent: justify })}
                title={justify}
              >
                {justify === 'space-between' ? '⇔' : justify[0].toUpperCase()}
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .auto-layout-panel {
    padding: var(--spacing-s);
    border-top: 1px solid var(--border-color);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-s);
  }

  .panel-title {
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .remove-btn,
  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
  }

  .remove-btn:hover {
    background: var(--background-modifier-error);
    color: var(--text-error);
    border-color: var(--text-error);
  }

  .add-btn:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .layout-controls {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }

  .control-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }

  .control-label {
    flex: 0 0 60px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .control-input {
    width: 56px;
    padding: 2px 6px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 11px;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }

  .control-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .direction-toggle {
    display: flex;
    gap: 2px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    overflow: hidden;
  }

  .dir-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 24px;
    background: var(--background-primary);
    border: none;
    color: var(--text-muted);
    cursor: pointer;
  }

  .dir-btn:hover {
    background: var(--background-modifier-hover);
  }

  .dir-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .padding-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
  }

  .pad-input {
    width: 40px;
    padding: 2px 4px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 10px;
    text-align: center;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }

  .pad-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .align-buttons {
    display: flex;
    gap: 2px;
  }

  .align-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 22px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
  }

  .align-btn:hover {
    background: var(--background-modifier-hover);
  }

  .align-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }
</style>
