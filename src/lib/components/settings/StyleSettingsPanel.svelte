<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  interface CssOverride {
    key: string;
    label: string;
    category: string;
    type: 'color' | 'size' | 'font';
    value: string;
    defaultValue: string;
  }

  let overrides: CssOverride[] = [
    {
      key: '--background-primary',
      label: 'Background Primary',
      category: 'Colors',
      type: 'color',
      value: '',
      defaultValue: '',
    },
    {
      key: '--background-secondary',
      label: 'Background Secondary',
      category: 'Colors',
      type: 'color',
      value: '',
      defaultValue: '',
    },
    {
      key: '--text-normal',
      label: 'Text Normal',
      category: 'Colors',
      type: 'color',
      value: '',
      defaultValue: '',
    },
    {
      key: '--text-muted',
      label: 'Text Muted',
      category: 'Colors',
      type: 'color',
      value: '',
      defaultValue: '',
    },
    {
      key: '--interactive-accent',
      label: 'Accent Color',
      category: 'Colors',
      type: 'color',
      value: '',
      defaultValue: '',
    },
    {
      key: '--border-color',
      label: 'Border Color',
      category: 'Colors',
      type: 'color',
      value: '',
      defaultValue: '',
    },
    {
      key: '--font-size-md',
      label: 'Font Size',
      category: 'Typography',
      type: 'size',
      value: '',
      defaultValue: '14px',
    },
    {
      key: '--font-mono',
      label: 'Monospace Font',
      category: 'Typography',
      type: 'font',
      value: '',
      defaultValue: 'monospace',
    },
  ];

  // Read current values from DOM on mount
  function loadCurrentValues() {
    const root = document.documentElement;
    overrides = overrides.map((o) => ({
      ...o,
      value:
        root.style.getPropertyValue(o.key) || getComputedStyle(root).getPropertyValue(o.key).trim(),
      defaultValue: o.defaultValue || getComputedStyle(root).getPropertyValue(o.key).trim(),
    }));
  }

  function applyOverride(key: string, value: string) {
    document.documentElement.style.setProperty(key, value);
    saveOverrides();
  }

  function resetOverride(key: string) {
    document.documentElement.style.removeProperty(key);
    loadCurrentValues();
    saveOverrides();
  }

  function resetAll() {
    overrides.forEach((o) => document.documentElement.style.removeProperty(o.key));
    localStorage.removeItem('bismuth-style-overrides');
    loadCurrentValues();
  }

  function saveOverrides() {
    const customVars: Record<string, string> = {};
    overrides.forEach((o) => {
      const current = document.documentElement.style.getPropertyValue(o.key);
      if (current) customVars[o.key] = current;
    });
    localStorage.setItem('bismuth-style-overrides', JSON.stringify(customVars));
  }

  /** Load saved overrides from localStorage */
  export function loadSavedOverrides() {
    try {
      const saved = localStorage.getItem('bismuth-style-overrides');
      if (saved) {
        const vars = JSON.parse(saved) as Record<string, string>;
        Object.entries(vars).forEach(([key, value]) => {
          document.documentElement.style.setProperty(key, value);
        });
      }
    } catch {
      // Ignore
    }
    loadCurrentValues();
  }

  $: categories = [...new Set(overrides.map((o) => o.category))];

  import { onMount } from 'svelte';
  onMount(loadSavedOverrides);
</script>

<div class="style-settings">
  <div class="settings-header">
    <h3>Style Settings</h3>
    <button class="reset-all-btn" on:click={resetAll}>
      <Icon name="refresh-cw" size={14} />
      Reset All
    </button>
  </div>

  {#each categories as category}
    <div class="category-group">
      <h4 class="category-title">{category}</h4>
      {#each overrides.filter((o) => o.category === category) as override}
        <div class="override-item">
          <span class="override-label">{override.label}</span>
          <div class="override-controls">
            {#if override.type === 'color'}
              <input
                type="color"
                value={override.value || '#000000'}
                on:input={(e) => applyOverride(override.key, e.currentTarget.value)}
              />
              <span class="override-value">{override.value}</span>
            {:else if override.type === 'size'}
              <input
                type="text"
                class="size-input"
                value={override.value}
                on:change={(e) => applyOverride(override.key, e.currentTarget.value)}
                placeholder={override.defaultValue}
              />
            {:else}
              <input
                type="text"
                class="text-input"
                value={override.value}
                on:change={(e) => applyOverride(override.key, e.currentTarget.value)}
                placeholder={override.defaultValue}
              />
            {/if}
            <button
              class="reset-btn"
              on:click={() => resetOverride(override.key)}
              title="Reset to default"
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .style-settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .settings-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }

  .reset-all-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .reset-all-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .category-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .category-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    margin: 0;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border-color);
  }

  .override-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
  }

  .override-label {
    font-size: 13px;
    color: var(--text-normal);
  }

  .override-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .override-controls input[type='color'] {
    width: 32px;
    height: 24px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
  }

  .override-value {
    font-size: 11px;
    font-family: var(--font-monospace);
    color: var(--text-muted);
    width: 70px;
  }

  .size-input,
  .text-input {
    width: 120px;
    padding: 4px 8px;
    font-size: 12px;
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    outline: none;
  }

  .size-input:focus,
  .text-input:focus {
    border-color: var(--interactive-accent);
  }

  .reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    border-radius: 4px;
    color: var(--text-faint);
    cursor: pointer;
    transition: all 0.15s;
  }

  .reset-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
</style>
