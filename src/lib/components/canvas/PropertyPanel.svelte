<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    currentCanvas,
    selectedElements,
    updateElement,
  } from '@/stores/canvas/canvasStore';
  import type { CanvasElement } from '@/types/canvas';

  let selectedElement: CanvasElement | null = null;

  $: {
    if ($selectedElements.length === 1 && $currentCanvas) {
      selectedElement = $currentCanvas.elements.find(
        (e) => e.id === $selectedElements[0]
      ) || null;
    } else {
      selectedElement = null;
    }
  }

  function handlePropertyChange(prop: string, value: string | number | boolean) {
    if (!selectedElement) return;
    const updated = {
      ...selectedElement,
      properties: {
        ...selectedElement.properties,
        [prop]: value,
      },
    };
    updateElement(updated);
  }

  function handlePositionChange(axis: 'x' | 'y', value: number) {
    if (!selectedElement) return;
    updateElement({ ...selectedElement, [axis]: value });
  }

  function handleSizeChange(dim: 'width' | 'height', value: number) {
    if (!selectedElement) return;
    updateElement({ ...selectedElement, [dim]: value });
  }

  function handleRotationChange(value: number) {
    if (!selectedElement) return;
    updateElement({ ...selectedElement, rotation: value });
  }
</script>

<div class="property-panel">
  {#if !selectedElement}
    <div class="empty-state">
      <Icon name="edit-3" size={32} color="var(--text-muted)" />
      <p>No element selected</p>
      <span class="hint">Select an element on the canvas to edit its properties</span>
    </div>
  {:else}
    <div class="panel-header">
      <Icon name="edit-3" size={16} />
      <h3>Properties</h3>
      <span class="element-type">{selectedElement.element_type}</span>
    </div>

    <div class="property-sections">
      <!-- Position -->
      <div class="property-section">
        <h4 class="section-title">Position</h4>
        <div class="property-grid">
          <label class="property-field">
            <span class="field-label">X</span>
            <input
              type="number"
              value={Math.round(selectedElement.x)}
              on:change={(e) => handlePositionChange('x', Number(e.currentTarget.value))}
            />
          </label>
          <label class="property-field">
            <span class="field-label">Y</span>
            <input
              type="number"
              value={Math.round(selectedElement.y)}
              on:change={(e) => handlePositionChange('y', Number(e.currentTarget.value))}
            />
          </label>
        </div>
      </div>

      <!-- Size -->
      <div class="property-section">
        <h4 class="section-title">Size</h4>
        <div class="property-grid">
          <label class="property-field">
            <span class="field-label">W</span>
            <input
              type="number"
              value={Math.round(selectedElement.width)}
              on:change={(e) => handleSizeChange('width', Number(e.currentTarget.value))}
              min="1"
            />
          </label>
          <label class="property-field">
            <span class="field-label">H</span>
            <input
              type="number"
              value={Math.round(selectedElement.height)}
              on:change={(e) => handleSizeChange('height', Number(e.currentTarget.value))}
              min="1"
            />
          </label>
        </div>
      </div>

      <!-- Rotation -->
      <div class="property-section">
        <h4 class="section-title">Rotation</h4>
        <label class="property-field full-width">
          <span class="field-label">Deg</span>
          <input
            type="number"
            value={Math.round(selectedElement.rotation)}
            on:change={(e) => handleRotationChange(Number(e.currentTarget.value))}
            min="0"
            max="360"
          />
        </label>
      </div>

      <!-- Fill & Stroke -->
      <div class="property-section">
        <h4 class="section-title">Appearance</h4>
        <label class="property-field full-width">
          <span class="field-label">Fill</span>
          <div class="color-input-wrapper">
            <input
              type="color"
              value={selectedElement.properties.fill || '#3b82f6'}
              on:input={(e) => handlePropertyChange('fill', e.currentTarget.value)}
            />
            <span class="color-value">{selectedElement.properties.fill || '#3b82f6'}</span>
          </div>
        </label>
        <label class="property-field full-width">
          <span class="field-label">Stroke</span>
          <div class="color-input-wrapper">
            <input
              type="color"
              value={selectedElement.properties.stroke || '#1e40af'}
              on:input={(e) => handlePropertyChange('stroke', e.currentTarget.value)}
            />
            <span class="color-value">{selectedElement.properties.stroke || '#1e40af'}</span>
          </div>
        </label>
        <label class="property-field full-width">
          <span class="field-label">Stroke Width</span>
          <input
            type="number"
            value={selectedElement.properties.strokeWidth || 2}
            on:change={(e) => handlePropertyChange('strokeWidth', Number(e.currentTarget.value))}
            min="0"
            max="20"
          />
        </label>
        <label class="property-field full-width">
          <span class="field-label">Opacity</span>
          <input
            type="range"
            value={(selectedElement.properties.opacity || 1) * 100}
            on:input={(e) => handlePropertyChange('opacity', Number(e.currentTarget.value) / 100)}
            min="0"
            max="100"
          />
        </label>
      </div>

      <!-- Text properties (if text element) -->
      {#if selectedElement.element_type === 'text'}
        <div class="property-section">
          <h4 class="section-title">Text</h4>
          <label class="property-field full-width">
            <span class="field-label">Content</span>
            <input
              type="text"
              value={selectedElement.properties.text || ''}
              on:change={(e) => handlePropertyChange('text', e.currentTarget.value)}
            />
          </label>
          <label class="property-field full-width">
            <span class="field-label">Font Size</span>
            <input
              type="number"
              value={selectedElement.properties.fontSize || 16}
              on:change={(e) => handlePropertyChange('fontSize', Number(e.currentTarget.value))}
              min="8"
              max="120"
            />
          </label>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .property-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background-secondary);
    border-left: 1px solid var(--border-color);
    width: 260px;
    overflow-y: auto;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: var(--spacing-s);
    color: var(--text-muted);
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-m);
  }

  .empty-state p {
    margin: 0;
    font-size: var(--font-smaller);
    font-weight: var(--font-medium);
  }

  .hint {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }

  .panel-header h3 {
    margin: 0;
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    flex: 1;
  }

  .element-type {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    padding: 2px var(--spacing-s);
    border-radius: var(--radius-s);
    font-size: var(--font-smallest);
    font-weight: var(--font-medium);
    text-transform: capitalize;
  }

  .property-sections {
    padding: var(--spacing-s);
  }

  .property-section {
    padding: var(--spacing-s) 0;
    border-bottom: 1px solid var(--border-color);
  }

  .property-section:last-child {
    border-bottom: none;
  }

  .section-title {
    margin: 0 0 var(--spacing-s) 0;
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .property-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-s);
  }

  .property-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .property-field.full-width {
    grid-column: 1 / -1;
    margin-bottom: var(--spacing-s);
  }

  .field-label {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    font-weight: var(--font-medium);
  }

  .property-field input[type="number"],
  .property-field input[type="text"] {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
    font-size: var(--font-smallest);
    font-family: var(--font-monospace);
  }

  .property-field input[type="number"]:focus,
  .property-field input[type="text"]:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .property-field input[type="range"] {
    width: 100%;
    accent-color: var(--interactive-accent);
  }

  .color-input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }

  .color-input-wrapper input[type="color"] {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    padding: 2px;
    cursor: pointer;
    background: none;
  }

  .color-value {
    font-size: var(--font-smallest);
    font-family: var(--font-monospace);
    color: var(--text-muted);
  }
</style>
