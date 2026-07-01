<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getSecret, setSecret, deleteSecret } from '@/services/system/keychain';
  import Icon from '@/components/icons/Icon.svelte';
  import { log } from '@/utils/logger';

  interface SecretSlot {
    key: string;
    label: string;
    hint: string;
  }

  const SECRET_SLOTS: SecretSlot[] = [
    { key: 'llm-api-key', label: 'LLM API Key', hint: 'Used for AI-assisted features' },
  ];

  interface SlotState {
    value: string;
    masked: boolean;
    status: 'idle' | 'saving' | 'saved' | 'error';
    keychainAvailable: boolean;
    errorMsg: string;
  }

  let slotStates: Record<string, SlotState> = {};

  for (const slot of SECRET_SLOTS) {
    slotStates[slot.key] = { value: '', masked: true, status: 'idle', keychainAvailable: true, errorMsg: '' };
  }

  onMount(async () => {
    for (const slot of SECRET_SLOTS) {
      const result = await getSecret(slot.key);
      slotStates[slot.key].keychainAvailable = result.available;
      if (!result.available) {
        slotStates[slot.key].errorMsg = result.error ?? 'Keychain unavailable';
      } else if (result.found && result.value) {
        slotStates[slot.key].value = result.value;
      }
    }
    slotStates = { ...slotStates };
  });

  onDestroy(() => {
    // Clear secret values from component state on unmount
    for (const key of Object.keys(slotStates)) {
      slotStates[key].value = '';
    }
  });

  async function handleSave(key: string) {
    const state = slotStates[key];
    if (!state.value.trim()) return;
    state.status = 'saving';
    slotStates = { ...slotStates };
    try {
      await setSecret(key, state.value);
      state.status = 'saved';
      setTimeout(() => { slotStates[key].status = 'idle'; slotStates = { ...slotStates }; }, 2000);
    } catch (error) {
      state.status = 'error';
      state.errorMsg = String(error);
      log.error('Failed to save secret', error as Error, { key });
    }
    slotStates = { ...slotStates };
  }

  async function handleClear(key: string) {
    try {
      await deleteSecret(key);
      slotStates[key].value = '';
      slotStates[key].status = 'idle';
      slotStates = { ...slotStates };
    } catch (error) {
      log.error('Failed to delete secret', error as Error, { key });
    }
  }
</script>

<div class="settings-section">
  <h3>Security</h3>
  <p class="section-hint">Secrets are stored in your OS keychain and never saved to disk or sent anywhere.</p>

  {#each SECRET_SLOTS as slot (slot.key)}
    {@const state = slotStates[slot.key]}
    <div class="setting-group secret-slot">
      <h4>{slot.label}</h4>
      <p class="setting-hint">{slot.hint}</p>

      {#if !state.keychainAvailable}
        <div class="keychain-error" role="alert">
          <Icon name="alert-triangle" size={16} />
          Keychain unavailable: {state.errorMsg}
        </div>
      {:else}
        <div class="secret-row">
          <input
            type={state.masked ? 'password' : 'text'}
            bind:value={state.value}
            placeholder="Enter secret..."
            class="secret-input"
            aria-label={slot.label}
            disabled={!state.keychainAvailable}
          />
          <button
            class="icon-btn"
            on:click={() => { slotStates[slot.key].masked = !state.masked; slotStates = { ...slotStates }; }}
            aria-label={state.masked ? 'Show secret' : 'Hide secret'}
            title={state.masked ? 'Show' : 'Hide'}
          >
            <Icon name={state.masked ? 'eye' : 'eye-off'} size={16} />
          </button>
          <button
            class="save-btn"
            on:click={() => handleSave(slot.key)}
            disabled={!state.value.trim() || state.status === 'saving'}
            aria-label="Save {slot.label}"
          >
            {state.status === 'saved' ? 'Saved' : state.status === 'saving' ? '...' : 'Save'}
          </button>
          <button
            class="clear-btn"
            on:click={() => handleClear(slot.key)}
            aria-label="Clear {slot.label}"
          >
            Clear
          </button>
        </div>
        {#if state.status === 'error'}
          <p class="error-msg" role="alert">{state.errorMsg}</p>
        {/if}
      {/if}
    </div>
  {/each}
</div>

<style>
  .section-hint {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    margin: 0 0 var(--spacing-m) 0;
  }

  .secret-slot { margin-bottom: var(--spacing-m); }

  .secret-row {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
    margin-top: var(--spacing-xs);
  }

  .secret-input {
    flex: 1;
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    font-family: var(--font-mono);
  }

  .secret-input:focus { outline: 2px solid var(--interactive-accent); outline-offset: -1px; }

  .icon-btn {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    padding: 6px;
    cursor: pointer;
    color: var(--text-muted);
    min-width: 32px;
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn:hover { background: var(--background-modifier-hover); }

  .save-btn, .clear-btn {
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small);
    cursor: pointer;
    min-height: 32px;
    border: 1px solid var(--border-color);
  }

  .save-btn {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .save-btn:disabled { opacity: 0.5; cursor: default; }
  .clear-btn { background: none; color: var(--text-muted); }
  .clear-btn:hover { background: var(--background-modifier-hover); }

  .keychain-error {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-danger, #dc2626);
    font-size: var(--font-ui-small);
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
  }

  .error-msg {
    color: var(--color-danger, #dc2626);
    font-size: var(--font-smallest);
    margin: var(--spacing-xxs) 0 0 0;
  }
</style>
