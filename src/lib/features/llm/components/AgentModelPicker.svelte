<script lang="ts">
  /**
   * AgentModelPicker — select Ollama model or Claude API provider.
   * Reads/writes via the llmConfig store only. No direct invoke().
   */
  import { onMount } from 'svelte';
  import { log } from '@/utils/logger';
  import { listOllamaModels } from '../services/ollama';
  import { llmConfig, setProvider, setModel } from '../stores/agentStore';
  import type { LlmProvider } from '../types/llm';

  /** Whether the Claude API option is shown (only when key is set in keychain). */
  export let claudeKeyAvailable: boolean = false;

  const CLAUDE_MODELS = ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];

  let ollamaModels: string[] = [];
  let isLoading = false;

  $: providers = [
    { value: 'ollama' as LlmProvider, label: 'Ollama (local)' },
    ...(claudeKeyAvailable ? [{ value: 'claude' as LlmProvider, label: 'Claude API' }] : []),
  ];

  async function refreshModels(): Promise<void> {
    isLoading = true;
    try {
      ollamaModels = await listOllamaModels();
      log.info('AgentModelPicker: models refreshed', { count: ollamaModels.length });
      if (ollamaModels.length > 0 && !ollamaModels.includes($llmConfig.model)) {
        setModel(ollamaModels[0]);
      }
    } catch (err) {
      log.error('AgentModelPicker: refresh failed', err as Error);
      ollamaModels = [];
    } finally {
      isLoading = false;
    }
  }

  function handleProviderChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const next = target.value as LlmProvider;
    const defaultModel = next === 'claude' ? CLAUDE_MODELS[0] : (ollamaModels[0] ?? 'llama3.2');
    setProvider(next, defaultModel);
  }

  function handleModelChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    setModel(target.value);
  }

  onMount(() => {
    void refreshModels();
  });
</script>

<div class="model-picker">
  <div class="picker-row">
    <label class="picker-label" for="provider-select">Provider</label>
    <select
      id="provider-select"
      class="picker-select"
      value={$llmConfig.provider}
      on:change={handleProviderChange}
      aria-label="LLM provider"
    >
      {#each providers as p}
        <option value={p.value}>{p.label}</option>
      {/each}
    </select>
  </div>

  {#if $llmConfig.provider === 'ollama'}
    <div class="picker-row">
      <label class="picker-label" for="model-select">Model</label>
      {#if isLoading}
        <span class="picker-loading">Loading...</span>
      {:else if ollamaModels.length === 0}
        <span class="picker-warning" role="alert">Ollama not running</span>
      {:else}
        <select
          id="model-select"
          class="picker-select"
          value={$llmConfig.model}
          on:change={handleModelChange}
          aria-label="Ollama model"
        >
          {#each ollamaModels as model}
            <option value={model}>{model}</option>
          {/each}
        </select>
      {/if}
      <button
        class="refresh-btn"
        on:click={refreshModels}
        disabled={isLoading}
        aria-label="Refresh Ollama models"
        title="Refresh models">Refresh</button
      >
    </div>
  {/if}

  {#if $llmConfig.provider === 'claude'}
    <div class="picker-row">
      <label class="picker-label" for="claude-model-select">Model</label>
      <select
        id="claude-model-select"
        class="picker-select"
        value={$llmConfig.model}
        on:change={handleModelChange}
        aria-label="Claude model"
      >
        {#each CLAUDE_MODELS as model}
          <option value={model}>{model}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>

<style>
  .model-picker {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-s);
    border-bottom: 1px solid var(--background-modifier-border);
  }
  .picker-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }
  .picker-label {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    width: 56px;
    flex-shrink: 0;
  }
  .picker-select {
    flex: 1;
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-ui-smaller);
  }
  .picker-loading {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    font-style: italic;
  }
  .picker-warning {
    font-size: var(--font-ui-smaller);
    color: var(--text-warning, #f59e0b);
    font-weight: 500;
  }
  .refresh-btn {
    padding: 2px var(--spacing-s);
    background: transparent;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    font-size: var(--font-smallest);
  }
  .refresh-btn:hover:not(:disabled) {
    color: var(--text-normal);
  }
  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
