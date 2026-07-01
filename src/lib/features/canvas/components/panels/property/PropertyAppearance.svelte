<script lang="ts">
  import type { CanvasElement } from '@/features/canvas/types';
  import { sharedStyles } from '@/features/canvas/stores/design/styleLibrary';

  export let element: CanvasElement;
  export let onPropertyChange: (prop: string, value: string | number | boolean) => void;

  // T037: Resolve linked style names for display
  $: fillStyleId = element.properties.fillStyleId as string | undefined;
  $: strokeStyleId = element.properties.strokeStyleId as string | undefined;
  $: fillStyle = fillStyleId ? $sharedStyles.find(s => s.id === fillStyleId) : null;
  $: strokeStyle = strokeStyleId ? $sharedStyles.find(s => s.id === strokeStyleId) : null;
</script>

<div class="property-section">
  <h4 class="section-title">Appearance</h4>
  <label class="property-field full-width">
    <span class="field-label">Fill</span>
    <div class="color-input-wrapper">
      <input
        type="color"
        value={element.properties.fill || '#3b82f6'}
        on:input={(e) => onPropertyChange('fill', e.currentTarget.value)}
      />
      <span class="color-value">{element.properties.fill || '#3b82f6'}</span>
      {#if fillStyle}
        <span class="style-link" title="Linked to shared style">{fillStyle.name}</span>
      {/if}
    </div>
  </label>
  <label class="property-field full-width">
    <span class="field-label">Stroke</span>
    <div class="color-input-wrapper">
      <input
        type="color"
        value={element.properties.stroke || '#1e40af'}
        on:input={(e) => onPropertyChange('stroke', e.currentTarget.value)}
      />
      <span class="color-value">{element.properties.stroke || '#1e40af'}</span>
      {#if strokeStyle}
        <span class="style-link" title="Linked to shared style">{strokeStyle.name}</span>
      {/if}
    </div>
  </label>
  <label class="property-field full-width">
    <span class="field-label">Stroke Width</span>
    <input
      type="number"
      value={element.properties.strokeWidth || 2}
      on:change={(e) => onPropertyChange('strokeWidth', Number(e.currentTarget.value))}
      min="0"
      max="20"
    />
  </label>
  <label class="property-field full-width">
    <span class="field-label">Opacity</span>
    <input
      type="range"
      value={(element.properties.opacity || 1) * 100}
      on:input={(e) => onPropertyChange('opacity', Number(e.currentTarget.value) / 100)}
      min="0"
      max="100"
    />
  </label>
</div>

<style>
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

  .property-field input[type="number"] {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
    font-size: var(--font-smallest);
    font-family: var(--font-monospace);
  }

  .property-field input[type="number"]:focus {
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

  .style-link {
    font-size: var(--font-ui-xs);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    padding: 1px var(--spacing-xs);
    border-radius: var(--radius-xs);
    white-space: nowrap;
  }
</style>
