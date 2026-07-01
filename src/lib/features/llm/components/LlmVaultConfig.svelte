<script lang="ts">
  /**
   * LlmVaultConfig — per-vault LLM settings: agent toggle, REST API, port, approval policy.
   * All changes are persisted via writeVaultLlmConfig IPC call.
   */
  import { onMount } from 'svelte';
  import { log } from '@/utils/logger';
  import { readVaultLlmConfig, writeVaultLlmConfig } from '../services/llmConfig';
  import McpServerConfig from './McpServerConfig.svelte';
  import type { VaultLlmConfig } from '../types/llm';

  export let vaultRoot: string;

  const DEFAULT_CONFIG: VaultLlmConfig = {
    agentEnabled: false,
    restApiEnabled: false,
    restApiPort: 7654,
    agentWriteRequiresApproval: true,
    mcpServers: [],
    systemPrompt: '',
  };

  let config: VaultLlmConfig = { ...DEFAULT_CONFIG };
  let saveError: string | null = null;
  let saveSuccess = false;

  async function loadConfig(): Promise<void> {
    try {
      const loaded = await readVaultLlmConfig(vaultRoot);
      config = loaded;
    } catch (err) {
      log.error('LlmVaultConfig: failed to load config', err as Error);
      config = { ...DEFAULT_CONFIG };
    }
  }

  async function saveConfig(): Promise<void> {
    saveError = null;
    saveSuccess = false;
    try {
      await writeVaultLlmConfig(vaultRoot, config);
      saveSuccess = true;
      log.info('LlmVaultConfig: saved', { agentEnabled: config.agentEnabled });
      setTimeout(() => {
        saveSuccess = false;
      }, 2000);
    } catch (err) {
      saveError = `Save failed: ${err}`;
      log.error('LlmVaultConfig: save failed', err as Error);
    } finally {
    }
  }

  function validatePort(value: number): boolean {
    return Number.isInteger(value) && value >= 1024 && value <= 65535;
  }

  onMount(() => {
    loadConfig();
  });
</script>

<div class="llm-vault-config">
  <h3 class="config-title">AI Agent Settings</h3>

  {#if config.agentEnabled}
    <div class="warning-banner" role="alert">
      <span class="warning-icon" aria-hidden="true">!</span>
      <span class="warning-text">AI agents can read and propose changes to vault notes</span>
    </div>
  {/if}

  <div class="config-section">
    <div class="toggle-row">
      <label class="toggle-label" for="agent-enabled-toggle">
        <span class="toggle-name">Enable AI Agent</span>
        <span class="toggle-desc">Allow the AI agent to read vault content and propose changes</span
        >
      </label>
      <input
        id="agent-enabled-toggle"
        type="checkbox"
        class="toggle-input"
        bind:checked={config.agentEnabled}
        aria-label="Enable AI Agent"
        on:change={saveConfig}
      />
    </div>

    <div class="toggle-row">
      <label class="toggle-label" for="approval-required-toggle">
        <span class="toggle-name">Require Approval for Changes</span>
        <span class="toggle-desc">Agent changes must be manually approved before applying</span>
      </label>
      <input
        id="approval-required-toggle"
        type="checkbox"
        class="toggle-input"
        bind:checked={config.agentWriteRequiresApproval}
        disabled={!config.agentEnabled}
        aria-label="Agent write requires approval"
        on:change={saveConfig}
      />
    </div>
  </div>

  <div class="config-section">
    <div class="toggle-row">
      <label class="toggle-label" for="rest-api-toggle">
        <span class="toggle-name">Enable REST API</span>
        <span class="toggle-desc">Expose a local REST API for external agent tools</span>
      </label>
      <input
        id="rest-api-toggle"
        type="checkbox"
        class="toggle-input"
        bind:checked={config.restApiEnabled}
        aria-label="Enable REST API"
        on:change={saveConfig}
      />
    </div>

    {#if config.restApiEnabled}
      <div class="port-row">
        <label class="port-label" for="rest-api-port">Port</label>
        <input
          id="rest-api-port"
          type="number"
          class="port-input"
          bind:value={config.restApiPort}
          min="1024"
          max="65535"
          aria-label="REST API port"
          on:change={() => {
            if (validatePort(config.restApiPort)) saveConfig();
          }}
        />
        {#if !validatePort(config.restApiPort)}
          <span class="port-error" role="alert">Must be 1024–65535</span>
        {/if}
      </div>
    {/if}
  </div>

  <div class="config-section">
    <div class="prompt-row">
      <label class="toggle-label" for="system-prompt">
        <span class="toggle-name">System Prompt</span>
        <span class="toggle-desc">Custom instructions prepended to all conversations</span>
      </label>
      <textarea
        id="system-prompt"
        class="prompt-input"
        bind:value={config.systemPrompt}
        placeholder="You are a helpful writing assistant..."
        rows="3"
        on:change={saveConfig}
        aria-label="Custom system prompt"
      ></textarea>
    </div>
  </div>

  <div class="config-section">
    <McpServerConfig />
  </div>

  {#if saveError}
    <div class="save-error" role="alert">{saveError}</div>
  {/if}
  {#if saveSuccess}
    <div class="save-success" role="status">Settings saved</div>
  {/if}
</div>

<style>
  .llm-vault-config {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    padding: var(--spacing-m);
  }
  .config-title {
    font-size: var(--font-ui-medium);
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }
  .warning-banner {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: var(--radius-s);
  }
  .warning-icon {
    font-weight: 700;
    color: #b45309;
    flex-shrink: 0;
    font-size: var(--font-ui-small);
  }
  .warning-text {
    font-size: var(--font-ui-smaller);
    color: #92400e;
    line-height: 1.4;
  }
  .config-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
    padding: var(--spacing-s) 0;
    border-bottom: 1px solid var(--background-modifier-border);
  }
  .config-section:last-of-type {
    border-bottom: none;
  }
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-m);
  }
  .toggle-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    cursor: pointer;
    flex: 1;
  }
  .toggle-name {
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    font-weight: 500;
  }
  .toggle-desc {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    line-height: 1.3;
  }
  .toggle-input {
    width: 36px;
    height: 20px;
    accent-color: var(--interactive-accent);
    cursor: pointer;
    flex-shrink: 0;
  }
  .port-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding-left: var(--spacing-m);
  }
  .port-label {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }
  .port-input {
    width: 90px;
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
  }
  .port-error {
    font-size: var(--font-ui-smaller);
    color: var(--text-error);
  }
  .save-error {
    font-size: var(--font-ui-smaller);
    color: var(--text-error);
    padding: var(--spacing-xs);
    background: var(--background-modifier-error);
    border-radius: var(--radius-s);
  }
  .save-success {
    font-size: var(--font-ui-smaller);
    color: var(--text-success, #065f46);
    padding: var(--spacing-xs);
    background: var(--background-modifier-success, #d1fae5);
    border-radius: var(--radius-s);
  }
  .prompt-row {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  .prompt-input {
    width: 100%;
    padding: var(--spacing-s);
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    font-family: var(--font-monospace, monospace);
    resize: vertical;
    min-height: 60px;
  }
  .prompt-input:focus {
    border-color: var(--interactive-accent);
    outline: none;
  }
</style>
