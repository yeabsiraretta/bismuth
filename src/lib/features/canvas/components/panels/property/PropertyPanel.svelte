<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import PropertyAppearance from '@/features/canvas/components/panels/property/PropertyAppearance.svelte';
  import {
    currentCanvas,
    selectedElements,
    updateElement,
  } from '@/features/canvas/stores';
  import { tokenCollections, activeMode, resolveToken } from '@/features/canvas/stores/design/tokenStore';
  import { getComponentById, enterComponentEditMode } from '@/features/canvas/stores';
  import type { CanvasElement } from '@/features/canvas/types';
  import type { TokenBinding } from '@/features/canvas/types/design/tokens';

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

  // Native component instance info
  $: isInstance = selectedElement?.element_type === 'component_instance';
  $: componentDef = isInstance && selectedElement?.properties.definitionId
    ? getComponentById(selectedElement.properties.definitionId as string)
    : null;

  function handleEditComponent() {
    if (!selectedElement?.properties.definitionId) return;
    enterComponentEditMode(selectedElement.properties.definitionId as string);
  }

  // Token binding display
  $: bindings = (selectedElement?.properties.tokenBindings ?? []) as TokenBinding[];

  function getTokenName(tokenId: string): string {
    for (const collection of $tokenCollections) {
      for (const token of collection.tokens) {
        if (token.id === tokenId) return `${collection.name}/${token.name}`;
      }
    }
    return tokenId;
  }

  function resolveTokenValue(tokenId: string): string {
    const resolved = resolveToken(tokenId, $activeMode);
    if (resolved === null) return '?';
    if (typeof resolved === 'string') return resolved;
    return String(resolved);
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
    <PanelHeader icon="edit-3" title="Properties">
      <svelte:fragment slot="actions">
        <span class="element-type">{selectedElement.element_type}</span>
      </svelte:fragment>
    </PanelHeader>

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
      <PropertyAppearance element={selectedElement} onPropertyChange={handlePropertyChange} />

      <!-- Native component instance info (replaces legacy variant selector) -->
      {#if isInstance && componentDef}
        <div class="property-section">
          <h4 class="section-title">Component</h4>
          <div class="component-info">
            <span class="component-name">{componentDef.name}</span>
            <button class="edit-component-btn" on:click={handleEditComponent} title="Edit component definition">
              <Icon name="edit-2" size={12} /> Edit Definition
            </button>
          </div>
        </div>
      {/if}

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

      <!-- T012: Token Bindings -->
      {#if bindings.length > 0}
        <div class="property-section">
          <h4 class="section-title">Token Bindings</h4>
          {#each bindings as binding (binding.property)}
            <div class="token-binding">
              <span class="binding-prop">{binding.property}</span>
              <span class="binding-token" title={resolveTokenValue(binding.tokenId)}>
                {getTokenName(binding.tokenId)}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .property-panel { display: flex; flex-direction: column; height: 100%; background: var(--background-secondary); border-left: 1px solid var(--border-color); width: 260px; overflow-y: auto; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: var(--spacing-s); color: var(--text-muted); text-align: center; padding: var(--spacing-xl) var(--spacing-m); }
  .empty-state p { margin: 0; font-size: var(--font-smaller); font-weight: var(--font-medium); }
  .hint { font-size: var(--font-smallest); color: var(--text-faint); }
  .element-type { background: var(--interactive-accent); color: var(--text-on-accent); padding: 2px var(--spacing-s); border-radius: var(--radius-s); font-size: var(--font-smallest); font-weight: var(--font-medium); text-transform: capitalize; }
  .property-sections { padding: var(--spacing-s); }
  .property-section { padding: var(--spacing-s) 0; border-bottom: 1px solid var(--border-color); }
  .property-section:last-child { border-bottom: none; }
  .section-title { margin: 0 0 var(--spacing-s) 0; font-size: var(--font-smallest); font-weight: var(--font-semibold); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .property-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-s); }
  .property-field { display: flex; flex-direction: column; gap: 2px; }
  .property-field.full-width { grid-column: 1 / -1; margin-bottom: var(--spacing-s); }
  .field-label { font-size: var(--font-smallest); color: var(--text-muted); font-weight: var(--font-medium); }
  .property-field input[type="number"], .property-field input[type="text"] { width: 100%; padding: var(--spacing-xs) var(--spacing-s); border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-modifier-form-field); color: var(--text-normal); font-size: var(--font-smallest); font-family: var(--font-monospace); }
  .property-field input[type="number"]:focus, .property-field input[type="text"]:focus { outline: none; border-color: var(--interactive-accent); }
  .component-info { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-s); }
  .component-name { font-size: var(--font-smaller); font-weight: var(--font-medium); color: var(--text-normal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .edit-component-btn { display: flex; align-items: center; gap: 2px; padding: 2px var(--spacing-s); font-size: var(--font-smallest); background: var(--background-modifier-hover); border: 1px solid var(--border-color); border-radius: var(--radius-s); cursor: pointer; color: var(--text-muted); white-space: nowrap; }
  .edit-component-btn:hover { background: var(--interactive-accent); color: var(--text-on-accent); border-color: var(--interactive-accent); }
</style>
