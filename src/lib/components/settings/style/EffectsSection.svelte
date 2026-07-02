<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { styleOverrides } from '@/stores/style/style';
  import { getTokenValue, isOverridden, setToken, resetToken } from './styleSettingsLogic';

  interface EffectToken {
    key: string;
    label: string;
    type: 'opacity' | 'shadow' | 'blur' | 'duration';
    defaultValue: string;
  }

  const EFFECT_TOKENS: EffectToken[] = [
    { key: '--opacity-disabled', label: 'Disabled Opacity', type: 'opacity', defaultValue: '0.4' },
    { key: '--opacity-muted', label: 'Muted Opacity', type: 'opacity', defaultValue: '0.6' },
    { key: '--opacity-overlay', label: 'Overlay Opacity', type: 'opacity', defaultValue: '0.8' },
    {
      key: '--shadow-s',
      label: 'Shadow Small',
      type: 'shadow',
      defaultValue: '0 1px 2px rgba(0,0,0,0.1)',
    },
    {
      key: '--shadow-m',
      label: 'Shadow Medium',
      type: 'shadow',
      defaultValue: '0 4px 8px rgba(0,0,0,0.12)',
    },
    {
      key: '--shadow-l',
      label: 'Shadow Large',
      type: 'shadow',
      defaultValue: '0 8px 24px rgba(0,0,0,0.16)',
    },
    { key: '--blur-s', label: 'Blur Small', type: 'blur', defaultValue: '4px' },
    { key: '--blur-m', label: 'Blur Medium', type: 'blur', defaultValue: '8px' },
    {
      key: '--transition-fast',
      label: 'Transition Fast',
      type: 'duration',
      defaultValue: '0.1s ease',
    },
    {
      key: '--transition-normal',
      label: 'Transition Normal',
      type: 'duration',
      defaultValue: '0.2s ease',
    },
    {
      key: '--transition-slow',
      label: 'Transition Slow',
      type: 'duration',
      defaultValue: '0.3s ease',
    },
  ];

  let values: Record<string, string> = {};

  function loadValues() {
    const v: Record<string, string> = {};
    for (const t of EFFECT_TOKENS) {
      v[t.key] = getTokenValue(t.key) || t.defaultValue;
    }
    values = v;
  }

  $: if ($styleOverrides) loadValues();

  function handleChange(key: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    setToken(key, target.value);
    values[key] = target.value;
  }

  function handleOpacitySlider(key: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const val = target.value;
    setToken(key, val);
    values[key] = val;
  }
</script>

<div class="effects-section">
  <div class="section-group">
    <h5>Opacity</h5>
    {#each EFFECT_TOKENS.filter((t) => t.type === 'opacity') as token}
      <div class="token-row">
        <span class="token-label">{token.label}</span>
        <div class="token-controls">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={values[token.key] || token.defaultValue}
            on:input={(e) => handleOpacitySlider(token.key, e)}
          />
          <span class="token-value">{values[token.key] || token.defaultValue}</span>
          {#if isOverridden(token.key)}
            <button
              class="reset-btn"
              on:click={() => {
                resetToken(token.key);
                values[token.key] = getTokenValue(token.key) || token.defaultValue;
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

  <div class="section-group">
    <h5>Shadows</h5>
    {#each EFFECT_TOKENS.filter((t) => t.type === 'shadow') as token}
      <div class="token-row">
        <span class="token-label">{token.label}</span>
        <div class="token-controls">
          <input
            type="text"
            value={values[token.key] || ''}
            placeholder={token.defaultValue}
            on:change={(e) => handleChange(token.key, e)}
          />
          <div
            class="preview-shadow"
            style="box-shadow: {values[token.key] || token.defaultValue};"
          ></div>
          {#if isOverridden(token.key)}
            <button
              class="reset-btn"
              on:click={() => {
                resetToken(token.key);
                values[token.key] = getTokenValue(token.key) || token.defaultValue;
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

  <div class="section-group">
    <h5>Blur</h5>
    {#each EFFECT_TOKENS.filter((t) => t.type === 'blur') as token}
      <div class="token-row">
        <span class="token-label">{token.label}</span>
        <div class="token-controls">
          <input
            type="text"
            value={values[token.key] || ''}
            placeholder={token.defaultValue}
            on:change={(e) => handleChange(token.key, e)}
          />
          {#if isOverridden(token.key)}
            <button
              class="reset-btn"
              on:click={() => {
                resetToken(token.key);
                values[token.key] = getTokenValue(token.key) || token.defaultValue;
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

  <div class="section-group">
    <h5>Transitions</h5>
    {#each EFFECT_TOKENS.filter((t) => t.type === 'duration') as token}
      <div class="token-row">
        <span class="token-label">{token.label}</span>
        <div class="token-controls">
          <input
            type="text"
            value={values[token.key] || ''}
            placeholder={token.defaultValue}
            on:change={(e) => handleChange(token.key, e)}
          />
          {#if isOverridden(token.key)}
            <button
              class="reset-btn"
              on:click={() => {
                resetToken(token.key);
                values[token.key] = getTokenValue(token.key) || token.defaultValue;
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
</div>

<style>
  .effects-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-l);
  }

  .section-group h5 {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    margin: 0 0 var(--spacing-s) 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .token-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) 0;
    border-bottom: 1px solid var(--border-color);
  }

  .token-row:last-child {
    border-bottom: none;
  }

  .token-label {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    flex-shrink: 0;
    min-width: 120px;
  }

  .token-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    flex: 1;
    justify-content: flex-end;
  }

  .token-controls input[type='text'] {
    width: 180px;
    padding: var(--spacing-xs);
    font-size: var(--font-ui-small);
    font-family: var(--font-monospace);
    background: var(--background-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
  }

  .token-controls input[type='range'] {
    width: 120px;
  }

  .token-value {
    font-size: var(--font-ui-small);
    font-family: var(--font-monospace);
    color: var(--text-muted);
    min-width: 32px;
    text-align: right;
  }

  .preview-shadow {
    width: 24px;
    height: 24px;
    background: var(--background-primary);
    border-radius: var(--radius-s);
  }

  .reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
  }

  .reset-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-error);
  }
</style>
