<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { COLOR_TOKENS, getTokenValue, isOverridden, setToken, resetToken } from './styleSettingsLogic';
  import { styleOverrides } from '@/stores/style/style';

  let values: Record<string, string> = {};

  function loadValues() {
    const v: Record<string, string> = {};
    for (const t of COLOR_TOKENS) {
      v[t.key] = getTokenValue(t.key);
    }
    values = v;
  }

  $: if ($styleOverrides) loadValues();

  function handleColorChange(key: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    setToken(key, target.value);
    values[key] = target.value;
  }

  function handleReset(key: string) {
    resetToken(key);
    values[key] = getTokenValue(key);
  }

  const categories = ['background', 'text', 'accent', 'border'] as const;
  const categoryLabels: Record<string, string> = {
    background: 'Background',
    text: 'Text',
    accent: 'Accent',
    border: 'Border',
  };
</script>

<div class="color-section">
  {#each categories as cat}
    <div class="token-group">
      <h5 class="group-title">{categoryLabels[cat]}</h5>
      {#each COLOR_TOKENS.filter((t) => t.category === cat) as token}
        <div class="token-row">
          <span class="token-label">{token.label}</span>
          <div class="token-controls">
            <input
              type="color"
              value={values[token.key] || '#000000'}
              on:input={(e) => handleColorChange(token.key, e)}
            />
            <span class="token-value">{values[token.key] || ''}</span>
            {#if isOverridden(token.key)}
              <button class="reset-btn" on:click={() => handleReset(token.key)} title="Reset to default">
                <Icon name="x" size={12} />
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .color-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-l);
  }

  .token-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .group-title {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
    padding-bottom: var(--spacing-xs);
    border-bottom: 1px solid var(--border-color);
  }

  .token-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) 0;
  }

  .token-label {
    font-size: var(--font-ui-menu);
    color: var(--text-normal);
  }

  .token-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }

  .token-controls input[type='color'] {
    width: 28px;
    height: 22px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    cursor: pointer;
    padding: 0;
  }

  .token-value {
    font-size: var(--font-ui-badge);
    font-family: var(--font-mono);
    color: var(--text-muted);
    min-width: 60px;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-faint);
    cursor: pointer;
    transition: all 0.15s;
  }

  .reset-btn:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }
</style>
