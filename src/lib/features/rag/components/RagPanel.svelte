<script lang="ts">
  /**
   * RagPanel — Graph-based AI chat panel with source citations.
   * Retrieves context from vault via vector + graph search, then queries LLM.
   */
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import {
    ragMessages,
    ragLoading,
    ragCitations,
    ragConfig,
    askRag,
    clearRagMessages,
    updateRagConfig,
  } from '../stores/ragStore';
  import type { RagSearchMode } from '../types';

  let inputText = '';
  let messagesEl: HTMLDivElement;

  $: messages = $ragMessages;
  $: loading = $ragLoading;
  $: citations = $ragCitations;
  $: config = $ragConfig;

  $: if (messages.length && messagesEl) {
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  async function handleSubmit(): Promise<void> {
    const query = inputText.trim();
    if (!query || loading) return;
    inputText = '';
    await askRag(query);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function setSearchMode(mode: RagSearchMode): void {
    updateRagConfig({ searchMode: mode });
  }

  function handleCitationClick(path: string): void {
    import('@/appNavigation').then((m) => m.openNote(path)).catch(() => {});
  }
</script>

<div class="rag-panel">
  <PanelHeader icon="brain">
    <svelte:fragment slot="title">
      <span class="rag-title">RAG Chat</span>
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <div class="mode-switcher">
        <button
          class="mode-btn"
          class:active={config.searchMode === 'hybrid'}
          on:click={() => setSearchMode('hybrid')}
          title="Hybrid: Vector + Graph">H</button
        >
        <button
          class="mode-btn"
          class:active={config.searchMode === 'vector'}
          on:click={() => setSearchMode('vector')}
          title="Vector search only">V</button
        >
        <button
          class="mode-btn"
          class:active={config.searchMode === 'graph'}
          on:click={() => setSearchMode('graph')}
          title="Graph traversal">G</button
        >
      </div>
      <button class="action-btn" on:click={clearRagMessages} title="Clear chat">
        <Icon name="trash-2" size={14} />
      </button>
    </svelte:fragment>
  </PanelHeader>

  <div class="messages" bind:this={messagesEl}>
    {#if messages.length === 0}
      <div class="empty-state">
        <Icon name="brain" size={36} />
        <p>Ask a question about your vault.</p>
        <p class="hint">
          Uses {config.searchMode} search across your notes to find relevant context.
        </p>
      </div>
    {:else}
      {#each messages as msg (msg.id)}
        <div class="message {msg.role}">
          <div class="msg-header">
            <Icon name={msg.role === 'user' ? 'user' : 'bot'} size={12} />
            <span class="msg-role">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
          </div>
          <div class="msg-content">{msg.content}</div>
          {#if msg.role === 'assistant' && msg.citations?.length}
            <div class="msg-citations">
              {#each msg.citations as cite (cite.index)}
                <button
                  class="citation-chip"
                  on:click={() => handleCitationClick(cite.notePath)}
                  title="{cite.notePath} ({cite.source}, score: {cite.score.toFixed(2)})"
                >
                  [{cite.index}] {cite.noteTitle}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <form class="input-area" on:submit|preventDefault={handleSubmit}>
    <textarea
      class="rag-input"
      placeholder="Ask about your vault..."
      bind:value={inputText}
      on:keydown={handleKeydown}
      disabled={loading}
      rows="2"
    ></textarea>
    <button
      type="submit"
      class="send-btn"
      disabled={loading || !inputText.trim()}
      aria-label="Send"
    >
      {#if loading}
        <Icon name="loader" size={16} />
      {:else}
        <Icon name="send" size={16} />
      {/if}
    </button>
  </form>
</div>

<style>
  .rag-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .rag-title {
    font-size: 0.85rem;
    font-weight: 600;
  }
  .mode-switcher {
    display: flex;
    gap: 2px;
    margin-right: 4px;
  }
  .mode-btn {
    width: 22px;
    height: 22px;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    background: var(--color-bg);
    color: var(--color-text-muted);
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mode-btn.active {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }
  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    padding: 2px;
    border-radius: 3px;
    display: flex;
  }
  .action-btn:hover {
    background: var(--color-bg-secondary);
  }
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    text-align: center;
    color: var(--color-text-muted);
    gap: 6px;
    padding: 2rem;
  }
  .empty-state p {
    margin: 0;
    font-size: 0.85rem;
  }
  .hint {
    font-size: 0.75rem;
  }
  .message {
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 0.83rem;
    line-height: 1.5;
  }
  .message.user {
    background: var(--color-accent-bg, rgba(88, 166, 255, 0.08));
    align-self: flex-end;
    max-width: 85%;
  }
  .message.assistant {
    background: var(--color-bg-secondary);
    max-width: 95%;
  }
  .message.system {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-align: center;
  }
  .msg-header {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }
  .msg-role {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .msg-content {
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--color-text);
  }
  .msg-citations {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }
  .citation-chip {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    background: var(--color-bg);
    color: var(--color-accent);
    font-size: 0.7rem;
    cursor: pointer;
  }
  .citation-chip:hover {
    background: var(--color-accent);
    color: white;
  }
  .input-area {
    display: flex;
    gap: 4px;
    padding: 8px;
    border-top: 1px solid var(--color-border);
  }
  .rag-input {
    flex: 1;
    resize: none;
    padding: 6px 8px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.83rem;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: inherit;
    min-height: 36px;
  }
  .rag-input:focus {
    border-color: var(--color-accent);
    outline: none;
  }
  .send-btn {
    padding: 6px 10px;
    border: none;
    border-radius: 6px;
    background: var(--color-accent);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
