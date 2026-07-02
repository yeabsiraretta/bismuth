<script lang="ts">
  /**
   * AgentPanel — chat interface for the LLM agent.
   * Supports streaming, tool call rendering, @mentions, and slash commands.
   * Reads/writes through agentStore and conversationStore.
   */
  import { afterUpdate, onMount } from 'svelte';
  import { log } from '@/utils/logger';
  import { getSecret } from '@/services/system/keychain';
  import { isLoading, llmConfig, addMessage, setLoading } from '../stores/agentStore';
  import {
    activeMessages,
    addMessageToActive,
    updateLastAssistantMessage,
    clearActiveConversation,
    isPlanMode,
  } from '../stores/conversationStore';
  import { chatOllamaStream } from '../services/ollama';
  import { sendClaudeMessageStream } from '../services/claude';
  import { BUILTIN_SLASH_COMMANDS } from '../types/llm';
  import AgentModelPicker from './AgentModelPicker.svelte';
  import type { AgentMessage, SlashCommand } from '../types/llm';

  export let noteTitle: string | null = null;

  let inputText = '';
  let messageListEl: HTMLDivElement | null = null;
  let sendError: string | null = null;
  let claudeKeyAvailable = false;
  let showSlashMenu = false;
  let filteredSlashCommands: SlashCommand[] = [];

  async function checkClaudeKey(): Promise<void> {
    try {
      const result = await getSecret('anthropic-api-key');
      claudeKeyAvailable = result.available && result.found && !!result.value;
    } catch {
      claudeKeyAvailable = false;
    }
  }

  onMount(() => {
    void checkClaudeKey();
  });

  function formatTime(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (showSlashMenu && filteredSlashCommands.length > 0) {
        applySlashCommand(filteredSlashCommands[0]);
      } else {
        void submitMessage();
      }
    }
    if (event.key === 'Escape' && showSlashMenu) {
      showSlashMenu = false;
    }
  }

  function handleInput(): void {
    if (inputText.startsWith('/')) {
      const query = inputText.slice(1).toLowerCase();
      filteredSlashCommands = BUILTIN_SLASH_COMMANDS.filter(
        (c) => c.trigger.toLowerCase().includes(query) || c.label.toLowerCase().includes(query)
      );
      showSlashMenu = filteredSlashCommands.length > 0;
    } else {
      showSlashMenu = false;
    }
  }

  function applySlashCommand(cmd: SlashCommand): void {
    inputText = cmd.promptTemplate.replace('{{selection}}', noteTitle ?? '');
    showSlashMenu = false;
  }

  function parseMentions(text: string): string {
    return text.replace(/@([\w/.\-]+)/g, '<span class="mention">@$1</span>');
  }

  async function submitMessage(): Promise<void> {
    const text = inputText.trim();
    if (!text || $isLoading) return;
    sendError = null;
    inputText = '';
    showSlashMenu = false;

    const userMsg = addMessageToActive({
      role: 'user',
      content: text,
      isPlan: $isPlanMode,
    });
    addMessage(userMsg);
    setLoading(true);

    try {
      const history = [...$activeMessages];

      if ($llmConfig.provider === 'claude') {
        const placeholder = addMessageToActive({ role: 'assistant', content: '' });
        addMessage(placeholder);
        await sendClaudeMessageStream(history, $llmConfig.model, (chunk) => {
          updateLastAssistantMessage(
            ($activeMessages[$activeMessages.length - 1]?.content ?? '') + chunk
          );
        });
      } else {
        const placeholder = addMessageToActive({ role: 'assistant', content: '' });
        addMessage(placeholder);
        for await (const chunk of chatOllamaStream($llmConfig.model, history)) {
          updateLastAssistantMessage(
            ($activeMessages[$activeMessages.length - 1]?.content ?? '') + chunk
          );
        }
      }

      log.info('AgentPanel: stream complete', { provider: $llmConfig.provider });
    } catch (err) {
      sendError = `Agent error: ${err}`;
      log.error('AgentPanel: chat failed', err as Error);
    } finally {
      setLoading(false);
    }
  }

  function handleClearHistory(): void {
    clearActiveConversation();
    sendError = null;
  }

  function getRoleLabel(role: AgentMessage['role']): string {
    if (role === 'user') return 'You';
    if (role === 'assistant') return 'Agent';
    if (role === 'tool') return 'Tool';
    return 'System';
  }

  afterUpdate(() => {
    if (messageListEl) {
      messageListEl.scrollTop = messageListEl.scrollHeight;
    }
  });
</script>

<div class="agent-panel">
  <div class="panel-header">
    <AgentModelPicker {claudeKeyAvailable} />
    <div class="header-actions">
      {#if noteTitle}
        <span class="note-badge" aria-label="Note context: {noteTitle}">Note: {noteTitle}</span>
      {/if}
      <button
        class="clear-btn"
        on:click={handleClearHistory}
        aria-label="Clear conversation history"
      >
        Clear
      </button>
    </div>
  </div>

  {#if $llmConfig.provider === 'claude' && !claudeKeyAvailable}
    <div class="claude-hint" role="note">
      Configure Claude API key in Settings &gt; LLM to use this provider.
    </div>
  {/if}

  <div class="message-list" bind:this={messageListEl} aria-label="Conversation" aria-live="polite">
    {#if $activeMessages.length === 0}
      <div class="empty-state">
        <p class="empty-text">Start a conversation with your AI agent.</p>
        <p class="empty-hint">Type / for commands, @ to mention files</p>
      </div>
    {:else}
      {#each $activeMessages as message (message.id)}
        <div class="message-item message--{message.role}" class:plan-msg={message.isPlan}>
          <div class="message-header">
            <span class="role-badge role--{message.role}">
              {getRoleLabel(message.role)}
            </span>
            {#if message.isPlan}
              <span class="plan-badge">Plan</span>
            {/if}
            <span class="message-time">{formatTime(message.createdAt)}</span>
          </div>

          {#if message.toolCalls && message.toolCalls.length > 0}
            <div class="tool-calls">
              {#each message.toolCalls as tc}
                <div
                  class="tool-call"
                  class:tool-running={tc.status === 'running'}
                  class:tool-failed={tc.status === 'failed'}
                >
                  <span class="tool-name">{tc.toolName}</span>
                  <span class="tool-status">{tc.status}</span>
                </div>
              {/each}
            </div>
          {/if}

          {#if message.toolResult}
            <div class="tool-result" class:tool-error={message.toolResult.isError}>
              <span class="tool-result-label">{message.toolResult.toolName}</span>
              <pre class="tool-result-output">{message.toolResult.output}</pre>
            </div>
          {/if}

          <div class="message-content">{@html parseMentions(message.content)}</div>
        </div>
      {/each}
    {/if}
    {#if $isLoading}
      <div class="loading-indicator" aria-label="Agent is thinking">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
      </div>
    {/if}
  </div>

  {#if sendError}
    <div class="send-error" role="alert">{sendError}</div>
  {/if}

  {#if showSlashMenu}
    <div class="slash-menu" role="listbox" aria-label="Slash commands">
      {#each filteredSlashCommands as cmd}
        <button
          class="slash-item"
          role="option"
          aria-selected="false"
          on:click={() => applySlashCommand(cmd)}
          aria-label={cmd.label}
        >
          <span class="slash-trigger">{cmd.trigger}</span>
          <span class="slash-desc">{cmd.description}</span>
        </button>
      {/each}
    </div>
  {/if}

  <div class="input-area">
    <textarea
      class="chat-input"
      bind:value={inputText}
      placeholder="Message the agent... (/ commands, @ mentions)"
      rows="3"
      disabled={$isLoading}
      on:keydown={handleKeydown}
      on:input={handleInput}
      aria-label="Chat message input"
    ></textarea>
    <button
      class="send-btn"
      on:click={submitMessage}
      disabled={$isLoading || !inputText.trim()}
      aria-label="Send message">Send</button
    >
  </div>
</div>

<style>
  .agent-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .panel-header {
    flex-shrink: 0;
    border-bottom: 1px solid var(--background-modifier-border);
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-s);
    justify-content: flex-end;
  }
  .note-badge {
    font-size: var(--font-ui-smaller);
    background: var(--background-modifier-border);
    border-radius: var(--radius-s);
    padding: 2px var(--spacing-xs);
    color: var(--text-muted);
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .clear-btn {
    padding: 2px var(--spacing-s);
    background: transparent;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    font-size: var(--font-smallest);
  }
  .clear-btn:hover {
    color: var(--text-normal);
  }
  .claude-hint {
    flex-shrink: 0;
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
  }
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-s);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .empty-text {
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    text-align: center;
  }
  .message-item {
    border-radius: var(--radius-m);
    padding: var(--spacing-s);
    max-width: 90%;
  }
  .message--user {
    background: var(--interactive-accent);
    align-self: flex-end;
  }
  .message--assistant {
    background: var(--background-secondary);
    align-self: flex-start;
  }
  .message--system {
    background: var(--background-modifier-border);
    align-self: center;
    opacity: 0.85;
  }
  .message--tool {
    background: var(--background-secondary);
    align-self: flex-start;
    border-left: 3px solid var(--interactive-accent);
  }
  .plan-msg {
    border: 1px dashed var(--interactive-accent);
  }
  .message-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-s);
    margin-bottom: 4px;
  }
  .role-badge {
    font-size: var(--font-smallest);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .role--user {
    color: var(--text-on-accent, #fff);
  }
  .role--assistant {
    color: var(--text-accent);
  }
  .role--system {
    color: var(--text-muted);
  }
  .role--tool {
    color: var(--interactive-accent);
  }
  .plan-badge {
    font-size: var(--font-smallest);
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
    padding: 1px 6px;
    border-radius: 8px;
    font-weight: 600;
  }
  .message-time {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
  .message-content {
    font-size: var(--font-ui-small);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text-normal);
  }
  .message--user .message-content {
    color: var(--text-on-accent, #fff);
  }

  .tool-calls {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 4px;
  }
  .tool-call {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 2px 6px;
    background: var(--background-primary);
    border-radius: var(--radius-s);
    font-size: var(--font-smallest);
  }
  .tool-name {
    font-weight: 600;
    color: var(--interactive-accent);
    font-family: var(--font-monospace, monospace);
  }
  .tool-status {
    color: var(--text-faint);
  }
  .tool-running {
    border-left: 2px solid var(--text-warning, #f59e0b);
  }
  .tool-failed {
    border-left: 2px solid var(--text-error);
  }
  .tool-result {
    padding: var(--spacing-xs);
    background: var(--background-primary);
    border-radius: var(--radius-s);
    margin-bottom: 4px;
  }
  .tool-error {
    border-left: 2px solid var(--text-error);
  }
  .tool-result-label {
    font-size: var(--font-smallest);
    font-weight: 600;
    color: var(--text-muted);
    font-family: var(--font-monospace, monospace);
  }
  .tool-result-output {
    margin: 4px 0 0;
    padding: 4px;
    font-size: var(--font-smallest);
    font-family: var(--font-monospace, monospace);
    white-space: pre-wrap;
    max-height: 100px;
    overflow-y: auto;
    color: var(--text-normal);
  }
  .loading-indicator {
    display: flex;
    gap: 4px;
    padding: var(--spacing-s);
    align-self: flex-start;
  }
  .loading-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-muted);
    animation: pulse 1.2s infinite;
  }
  .loading-dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  .loading-dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes pulse {
    0%,
    80%,
    100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    40% {
      opacity: 1;
      transform: scale(1);
    }
  }
  .send-error {
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-modifier-error);
    color: var(--text-error);
    font-size: var(--font-ui-smaller);
    border-top: 1px solid var(--background-modifier-border);
  }
  .input-area {
    flex-shrink: 0;
    display: flex;
    gap: var(--spacing-s);
    padding: var(--spacing-s);
    border-top: 1px solid var(--background-modifier-border);
    align-items: flex-end;
  }
  .chat-input {
    flex: 1;
    min-height: 60px;
    padding: var(--spacing-s);
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    resize: none;
    font-family: inherit;
  }
  .chat-input:disabled {
    opacity: 0.6;
  }
  .send-btn {
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: var(--font-ui-small);
    height: 40px;
    flex-shrink: 0;
  }
  .send-btn:hover:not(:disabled) {
    background: var(--interactive-accent-hover);
  }
  .send-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .slash-menu {
    border-top: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    max-height: 180px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .slash-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-s);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }
  .slash-item:hover {
    background: var(--background-modifier-hover);
  }
  .slash-trigger {
    font-weight: 600;
    color: var(--interactive-accent);
    font-family: var(--font-monospace, monospace);
    min-width: 80px;
  }
  .slash-desc {
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
  }

  .empty-hint {
    color: var(--text-faint);
    font-size: var(--font-ui-smaller);
    margin-top: var(--spacing-xs);
  }

  :global(.mention) {
    background: rgba(var(--interactive-accent-rgb, 99, 102, 241), 0.15);
    color: var(--interactive-accent);
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 500;
  }
</style>
