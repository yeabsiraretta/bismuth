<script lang="ts">
  import { onMount } from 'svelte';
  import BIcon from '@/ui/b-icon.svelte';
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import { getLlm } from '@/hubs/core/stores/settings-store.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import Panel from '@/ui/panel.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import { streamChat, isConfigured, type ChatMessage } from '@/sal/ai-service';
  import {
    type AgentMessage,
    type ToolCallRequest,
    executeToolCall,
    formatToolResult,
    getHelpText,
    loadAvailableTools,
    parseTerminalInput,
    runAgentTurn,
    stripToolCalls,
  } from '@/sal/ai-agent-service';
  import type { McpToolResult } from '@/ipc/api-client';

  type Mode = 'chat' | 'agent';
  let mode: Mode = $state('agent');

  let prompt = $state('');
  let isLoading = $state(false);

  // ── Chat mode state ──
  let chatMessages = $state<ChatMessage[]>([]);

  // ── Agent mode state ──
  let agentMessages = $state<AgentMessage[]>([]);
  let availableTools = $state<Array<{ name: string; description: string }>>([]);

  let messagesEl: HTMLDivElement | undefined = $state();

  onMount(async () => {
    availableTools = await loadAvailableTools();
  });

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function getContext(): string {
    const path = getActiveNotePath();
    if (!path) return '';
    return getCachedContent(path) ?? '';
  }

  // ── Chat mode ──
  async function sendChatMessage() {
    if (!prompt.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: prompt };
    chatMessages = [...chatMessages, userMsg];
    prompt = '';
    isLoading = true;
    scrollToBottom();

    if (!isConfigured()) {
      chatMessages = [
        ...chatMessages,
        {
          role: 'assistant',
          content: 'AI not configured. Go to Settings → AI to enable and add your API key.',
        },
      ];
      isLoading = false;
      return;
    }

    const llm = getLlm();
    const history: ChatMessage[] = [];
    if (llm.llmNoteContext) {
      const ctx = getContext();
      if (ctx)
        history.push({
          role: 'system',
          content: `The user is currently editing a note. Here is its content:\n\n${ctx}`,
        });
    }
    const maxHistory = llm.llmMaxHistory || 20;
    history.push(...chatMessages.slice(-maxHistory));

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    chatMessages = [...chatMessages, assistantMsg];

    await streamChat(history, {
      onToken: (token) => {
        const last = chatMessages[chatMessages.length - 1];
        if (last?.role === 'assistant') {
          last.content += token;
          chatMessages = [...chatMessages];
        }
        scrollToBottom();
      },
      onDone: () => {
        isLoading = false;
      },
      onError: (error) => {
        const last = chatMessages[chatMessages.length - 1];
        if (last?.role === 'assistant' && !last.content) last.content = `Error: ${error}`;
        else chatMessages = [...chatMessages, { role: 'assistant', content: `Error: ${error}` }];
        chatMessages = [...chatMessages];
        isLoading = false;
      },
    });
  }

  // ── Agent mode ──
  async function sendAgentMessage() {
    if (!prompt.trim()) return;
    const input = prompt;
    prompt = '';

    const cmd = parseTerminalInput(input);

    if (cmd.type === 'clear') {
      agentMessages = [];
      return;
    }
    if (cmd.type === 'help') {
      agentMessages = [
        ...agentMessages,
        { role: 'system', content: getHelpText(), timestamp: Date.now() },
      ];
      scrollToBottom();
      return;
    }
    if (cmd.type === 'tools') {
      const toolList =
        availableTools.length > 0
          ? availableTools.map((t) => `• **${t.name}** — ${t.description}`).join('\n')
          : 'No tools loaded. Is the Bismuth API server running?';
      agentMessages = [
        ...agentMessages,
        {
          role: 'system',
          content: `## Available Tools (${availableTools.length})\n\n${toolList}`,
          timestamp: Date.now(),
        },
      ];
      scrollToBottom();
      return;
    }

    // Direct tool invocation
    if (cmd.type === 'tool' && cmd.toolName) {
      const call: ToolCallRequest = { name: cmd.toolName, arguments: cmd.toolArgs ?? {} };
      agentMessages = [
        ...agentMessages,
        {
          role: 'user',
          content: `/${cmd.toolName} ${JSON.stringify(cmd.toolArgs ?? {})}`,
          toolCall: call,
          timestamp: Date.now(),
        },
      ];
      isLoading = true;
      scrollToBottom();

      const result = await executeToolCall(call);
      agentMessages = [
        ...agentMessages,
        {
          role: 'tool',
          content: formatToolResult(result),
          toolCall: call,
          toolResult: result,
          timestamp: Date.now(),
        },
      ];
      isLoading = false;
      scrollToBottom();
      return;
    }

    // Agent chat — AI with tool access
    agentMessages = [...agentMessages, { role: 'user', content: input, timestamp: Date.now() }];
    isLoading = true;
    scrollToBottom();

    const assistantMsg: AgentMessage = { role: 'assistant', content: '', timestamp: Date.now() };
    agentMessages = [...agentMessages, assistantMsg];

    await runAgentTurn(agentMessages.slice(0, -1), availableTools, {
      onToken: (token) => {
        const last = agentMessages[agentMessages.length - 1];
        if (last?.role === 'assistant') {
          last.content += token;
          agentMessages = [...agentMessages];
        }
        scrollToBottom();
      },
      onToolCall: (call) => {
        agentMessages = [
          ...agentMessages,
          {
            role: 'system',
            content: `⚙ Calling **${call.name}**...`,
            toolCall: call,
            timestamp: Date.now(),
          },
        ];
        scrollToBottom();
      },
      onToolResult: (_call: ToolCallRequest, result: McpToolResult) => {
        const text = formatToolResult(result);
        const preview = text.length > 200 ? text.slice(0, 200) + '...' : text;
        agentMessages = [
          ...agentMessages,
          { role: 'tool', content: preview, toolResult: result, timestamp: Date.now() },
        ];
        scrollToBottom();
      },
      onDone: (fullResponse) => {
        const last = agentMessages[agentMessages.length - 1];
        if (last?.role === 'assistant') {
          last.content = stripToolCalls(fullResponse);
          agentMessages = [...agentMessages];
        }
        isLoading = false;
        scrollToBottom();
      },
      onError: (error) => {
        agentMessages = [
          ...agentMessages,
          { role: 'assistant', content: `Error: ${error}`, timestamp: Date.now() },
        ];
        isLoading = false;
        scrollToBottom();
      },
    });
  }

  function handleSend() {
    if (mode === 'chat') sendChatMessage();
    else sendAgentMessage();
  }

  function clearChat() {
    if (mode === 'chat') chatMessages = [];
    else agentMessages = [];
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  let ctxMsg: ChatMessage | AgentMessage | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, msg: ChatMessage | AgentMessage) {
    e.preventDefault();
    ctxMsg = msg;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxMsg = null;
  }
</script>

<Panel title="AI Assistant">
  {#snippet actions()}
    <button
      class="panel-action mode-toggle"
      class:active={mode === 'agent'}
      onclick={() => {
        mode = mode === 'chat' ? 'agent' : 'chat';
      }}
      title={mode === 'chat' ? 'Switch to Agent mode' : 'Switch to Chat mode'}
    >
      <BIcon name={mode === 'agent' ? 'terminal' : 'messageCircle'} size={14} />
    </button>
    <button class="panel-action" onclick={clearChat} title="Clear chat">
      <BIcon name="trash" size={14} />
    </button>
  {/snippet}

  <div class="ai-panel">
    <div class="mode-bar">
      <button
        class="mode-btn"
        class:active={mode === 'chat'}
        onclick={() => {
          mode = 'chat';
        }}>Chat</button
      >
      <button
        class="mode-btn"
        class:active={mode === 'agent'}
        onclick={() => {
          mode = 'agent';
        }}>Agent</button
      >
      {#if mode === 'agent'}
        <span class="tool-count">{availableTools.length} tools</span>
      {/if}
    </div>

    <div class="chat-messages" bind:this={messagesEl}>
      {#if mode === 'chat'}
        {#if chatMessages.length === 0}
          <div class="panel-empty">
            Ask AI about your notes
            <div class="panel-empty-hint">Uses the context of your active note</div>
          </div>
        {:else}
          {#each chatMessages as msg, i (i)}
            <div
              class="chat-msg"
              class:user={msg.role === 'user'}
              class:assistant={msg.role === 'assistant'}
              oncontextmenu={(e) => handleContext(e, msg)}
              role="article"
            >
              <span class="msg-role">{msg.role === 'user' ? 'You' : 'AI'}</span>
              <p class="msg-content">{msg.content}</p>
            </div>
          {/each}
        {/if}
      {:else}
        {#if agentMessages.length === 0}
          <div class="panel-empty">
            Bismuth Agent
            <div class="panel-empty-hint">Full vault access. Type /help for commands.</div>
          </div>
        {:else}
          {#each agentMessages as msg, i (i)}
            <div
              class="chat-msg"
              class:user={msg.role === 'user'}
              class:assistant={msg.role === 'assistant'}
              class:tool-msg={msg.role === 'tool'}
              class:system-msg={msg.role === 'system'}
              oncontextmenu={(e) => handleContext(e, msg)}
              role="article"
            >
              <span class="msg-role">
                {#if msg.role === 'user'}You
                {:else if msg.role === 'assistant'}Agent
                {:else if msg.role === 'tool'}Tool
                {:else}System
                {/if}
              </span>
              <p class="msg-content">{msg.content}</p>
            </div>
          {/each}
        {/if}
      {/if}
      {#if isLoading}
        <div class="chat-msg assistant">
          <span class="msg-role">{mode === 'agent' ? 'Agent' : 'AI'}</span>
          <p class="msg-content typing">{mode === 'agent' ? 'Working…' : 'Thinking…'}</p>
        </div>
      {/if}
    </div>

    <div class="chat-input-row">
      <textarea
        class="chat-input"
        placeholder={mode === 'agent' ? 'Ask the agent or type /help...' : 'Ask something…'}
        aria-label="AI chat message"
        rows="2"
        bind:value={prompt}
        onkeydown={handleKeydown}></textarea>
      <button
        class="send-btn"
        onclick={handleSend}
        disabled={!prompt.trim() || isLoading}
        aria-label="Send message"
      >
        ↑
      </button>
    </div>
  </div>
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxMsg} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxMsg) navigator.clipboard.writeText(ctxMsg.content);
      closeCtx();
    }}
    role="menuitem">Copy Message</button
  >
</ContextMenu>

<style>
  .ai-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .mode-bar {
    display: flex;
    gap: 2px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--color-border);
    align-items: center;
  }
  .mode-btn {
    padding: 2px 8px;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .mode-btn.active {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .tool-count {
    margin-left: auto;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    opacity: 0.7;
  }
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .chat-msg {
    padding: 6px 8px;
    border-radius: var(--radius-s);
    font-size: 0.75rem;
  }
  .chat-msg.user {
    background: var(--color-accent);
    color: var(--color-background);
    align-self: flex-end;
    max-width: 85%;
  }
  .chat-msg.assistant {
    background: var(--color-surface);
    color: var(--color-text);
    align-self: flex-start;
    max-width: 85%;
  }
  .chat-msg.tool-msg {
    background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
    color: var(--color-text);
    align-self: flex-start;
    max-width: 95%;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    white-space: pre-wrap;
    border-left: 2px solid var(--color-accent);
  }
  .chat-msg.system-msg {
    background: transparent;
    color: var(--color-text-muted);
    align-self: center;
    font-size: 0.65rem;
    font-style: italic;
    max-width: 95%;
  }
  .msg-role {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
  }
  .msg-content {
    margin: 2px 0 0;
    line-height: 1.4;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  .typing {
    opacity: 0.6;
    font-style: italic;
  }
  .chat-input-row {
    display: flex;
    gap: 4px;
    padding: 8px;
    border-top: 1px solid var(--color-border);
  }
  .chat-input {
    flex: 1;
    padding: 6px 8px;
    font-size: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    resize: none;
    font-family: inherit;
  }
  .send-btn {
    padding: 0 10px;
    border: none;
    background: var(--color-accent);
    color: var(--color-background);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
  }
  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
