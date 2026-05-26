<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { currentVault } from '@/stores/vault/vault';
  import { IPC_PLACEHOLDERS } from '@/config/presets';

  interface PropertyValue {
    value: any;
    count: number;
  }

  interface Property {
    key: string;
    values: PropertyValue[];
    isExpanded: boolean;
  }

  let properties: Property[] = [];
  let selectedProperty: { key: string; value: any } | null = null;

  $: if ($currentVault) {
    loadProperties();
  }

  async function loadProperties() {
    try {
      if (!$currentVault) return;

      // TODO: Replace with actual IPC command when backend is ready
      // const props = await invoke('get_all_properties', { vaultPath: $currentVault.root_path });

      // Using centralized placeholder data
      const rawProperties = IPC_PLACEHOLDERS.propertyBrowser;

      properties = Object.entries(rawProperties).map(([key, values]) => ({
        key,
        values,
        isExpanded: false,
      }));
    } catch (error) {
      console.error('Failed to load properties, using placeholder data:', error);

      // Fallback to centralized placeholder data
      const rawProperties = IPC_PLACEHOLDERS.propertyBrowser;
      properties = Object.entries(rawProperties).map(([key, values]) => ({
        key,
        values,
        isExpanded: false,
      }));
    }
  }

  function toggleExpand(property: Property) {
    property.isExpanded = !property.isExpanded;
    properties = properties; // Trigger reactivity
  }

  function handlePropertyClick(key: string, value: any) {
    selectedProperty = { key, value };
    // This would filter the file list by property
    console.log('Filter by property:', key, value);
  }

  function isSelected(key: string, value: any): boolean {
    return selectedProperty?.key === key && selectedProperty?.value === value;
  }
</script>

<div class="property-browser">
  {#if properties.length > 0}
    <div class="property-list">
      {#each properties as property}
        <div class="property-group">
          <button class="property-header" on:click={() => toggleExpand(property)}>
            <Icon name={property.isExpanded ? 'chevron-down' : 'chevron-right'} size={14} />
            <span class="property-key">{property.key}</span>
            <span class="property-total"
              >{property.values.reduce((sum, v) => sum + v.count, 0)}</span
            >
          </button>

          {#if property.isExpanded}
            <div class="property-values">
              {#each property.values as item}
                <button
                  class="property-value-item"
                  class:selected={isSelected(property.key, item.value)}
                  on:click={() => handlePropertyClick(property.key, item.value)}
                >
                  <span class="value-name">{item.value}</span>
                  <span class="value-count">{item.count}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="placeholder">
      <Icon name="list" size={48} />
      <p>No properties found</p>
      <span class="hint">Frontmatter properties will appear here</span>
    </div>
  {/if}
</div>

<style>
  .property-browser {
    height: 100%;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .property-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .property-group {
    border: 1px solid var(--background-modifier-border);
    border-radius: 0.375rem;
    overflow: hidden;
  }

  .property-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: var(--background-secondary);
    border: none;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .property-header:hover {
    background-color: var(--background-modifier-hover);
  }

  .property-key {
    flex: 1;
    text-align: left;
    font-size: var(--font-size-sm);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    text-transform: capitalize;
  }

  .property-total {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    padding: 0.125rem 0.5rem;
    background-color: var(--background-modifier-border);
    border-radius: 0.75rem;
  }

  .property-values {
    display: flex;
    flex-direction: column;
    padding: 0.25rem;
    background-color: var(--background-primary);
  }

  .property-value-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: none;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .property-value-item:hover {
    background-color: var(--background-modifier-hover);
  }

  .property-value-item.selected {
    background-color: var(--background-modifier-active-hover);
    color: var(--interactive-accent);
  }

  .value-name {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .value-count {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--text-muted);
    gap: 0.75rem;
  }

  .placeholder p {
    font-size: var(--font-size-md);
    font-weight: var(--font-medium);
    margin: 0;
  }

  .hint {
    font-size: var(--font-size-sm);
    color: var(--text-faint);
  }
</style>
