<script lang="ts">
  import { llmConfig, setProvider, setModel, setOllamaUrl, setMaxTokens } from '@/features/llm';
  import type { LlmProvider } from '@/features/llm';

  export let llmEnabled: boolean;
  export let llmNoteContext: boolean;
  export let llmMaxHistory: number;

  let selectedProvider: LlmProvider = $llmConfig.provider;
  let ollamaUrl: string = $llmConfig.ollamaUrl;
  let ollamaModel: string = $llmConfig.model;
  let maxTokens: number = $llmConfig.maxTokens;

  function handleProviderChange(): void {
    const defaultModel = selectedProvider === 'claude' ? 'claude-sonnet-4-6' : 'llama3.2';
    setProvider(selectedProvider, defaultModel);
    if (selectedProvider === 'ollama') ollamaModel = defaultModel;
  }

  function handleOllamaUrlChange(): void {
    setOllamaUrl(ollamaUrl);
  }

  function handleMaxTokensChange(): void {
    setMaxTokens(maxTokens);
  }
</script>

<div class="settings-section stack stack-md">
  <h3>AI Agent (LLM)</h3>

  <div class="setting-group">
    <h4>Enable</h4>
    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={llmEnabled} />
        Enable AI agent
      </label>
      <span class="setting-hint">Activates the LLM-powered agent panel and note-context tools</span>
    </div>
  </div>

  {#if llmEnabled}
    <div class="setting-group">
      <h4>Provider</h4>
      <div class="setting-item">
        <label for="llm-provider">LLM provider</label>
        <select id="llm-provider" bind:value={selectedProvider} on:change={handleProviderChange}>
          <option value="ollama">Ollama (local)</option>
          <option value="claude">Claude (Anthropic)</option>
        </select>
        <span class="setting-hint">Ollama runs locally with no API key. Claude requires a key in your system keychain.</span>
      </div>
    </div>

    {#if selectedProvider === 'ollama'}
      <div class="setting-group">
        <h4>Ollama</h4>
        <div class="setting-item">
          <label for="ollama-url">Server URL</label>
          <input id="ollama-url" type="text" bind:value={ollamaUrl}
            on:change={handleOllamaUrlChange} placeholder="http://127.0.0.1:11434" />
          <span class="setting-hint">Base URL of your running Ollama instance</span>
        </div>
        <div class="setting-item">
          <label for="ollama-model">Model name</label>
          <input id="ollama-model" type="text" bind:value={ollamaModel}
            on:change={() => setModel(ollamaModel)} placeholder="llama3.2" />
          <span class="setting-hint">Ollama model tag — run <code>ollama list</code> to see installed models</span>
        </div>
      </div>
    {:else}
      <div class="setting-group">
        <h4>Claude API Key</h4>
        <div class="setting-item">
          <span class="setting-hint">API key is stored in your system keychain (never in plain text). To add it:</span>
          <pre class="keychain-cmd">bismuth keychain set anthropic-api-key YOUR_KEY</pre>
        </div>
      </div>
    {/if}

    <div class="setting-group">
      <h4>Response</h4>
      <div class="setting-item">
        <label for="llm-max-tokens">Max tokens</label>
        <input id="llm-max-tokens" type="number" bind:value={maxTokens}
          on:change={handleMaxTokensChange} min="256" max="128000" step="256" />
        <span class="setting-hint">Maximum number of tokens in each LLM response (256–128 000)</span>
      </div>
    </div>

    <div class="setting-group">
      <h4>Context</h4>
      <div class="setting-item">
        <label>
          <input type="checkbox" bind:checked={llmNoteContext} />
          Include current note as context
        </label>
        <span class="setting-hint">Sends the active note content to the agent with each message</span>
      </div>
      <div class="setting-item">
        <label for="llm-max-history">Max history</label>
        <input id="llm-max-history" type="range" bind:value={llmMaxHistory} min="5" max="50" step="5" />
        <span class="setting-value">{llmMaxHistory} messages</span>
        <span class="setting-hint">Number of previous messages sent as context (5–50)</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .keychain-cmd {
    background-color: var(--background-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    padding: var(--spacing-xs) var(--spacing-s);
    font-family: var(--font-monospace);
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    margin: var(--spacing-xs) 0;
  }
</style>
