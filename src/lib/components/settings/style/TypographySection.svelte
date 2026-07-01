<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    TYPOGRAPHY_TOKENS,
    getTokenValue,
    isOverridden,
    setToken,
    resetToken,
  } from './styleSettingsLogic';
  import { styleOverrides } from '@/stores/style/style';

  let values: Record<string, string> = {};

  function loadValues() {
    const v: Record<string, string> = {};
    for (const t of TYPOGRAPHY_TOKENS) {
      v[t.key] = getTokenValue(t.key);
    }
    values = v;
  }

  $: if ($styleOverrides) loadValues();

  function handleChange(key: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    setToken(key, target.value);
    values[key] = target.value;
  }
</script>

<div class="typography-section">
  {#each TYPOGRAPHY_TOKENS as token}
    <div class="token-row">
      <span class="token-label">{token.label}</span>
      <div class="token-controls">
        <input
          type="text"
          value={values[token.key] || ''}
          placeholder={token.defaultValue || ''}
          on:change={(e) => handleChange(token.key, e)}
        />
        {#if isOverridden(token.key)}
          <button
            class="reset-btn"
            on:click={() => {
              resetToken(token.key);
              values[token.key] = getTokenValue(token.key);
            }}
            title="Reset"
          >
            <Icon name="x" size={12} />
          </button>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .typography-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
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

  .token-controls input {
    width: 140px;
    padding: 4px 8px;
    font-size: var(--font-ui-smaller);
    background: var(--background-modifier-form-field, var(--background-secondary));
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    outline: none;
  }

  .token-controls input:focus {
    border-color: var(--interactive-accent);
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
  }

  .reset-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
</style>
