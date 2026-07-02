<script lang="ts">
  /**
   * LlmPanel — sidebar panel with Chat / Changes / Settings tabs.
   * Chat tab includes multi-tab conversation bar and plan mode toggle.
   * Changes tab shows a badge when there are pending changes.
   */
  import { onMount } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import { pendingChanges } from '../stores/agentStore';
  import { isPlanMode, togglePlanMode, initConversations } from '../stores/conversationStore';
  import AgentPanel from './AgentPanel.svelte';
  import AgentChangeReview from './AgentChangeReview.svelte';
  import LlmVaultConfig from './LlmVaultConfig.svelte';
  import ChatTabBar from './ChatTabBar.svelte';

  export let vaultRoot: string = '';
  export let noteTitle: string | null = null;

  type LlmTab = 'chat' | 'changes' | 'settings';
  let activeTab: LlmTab = 'chat';

  const tabs: { id: LlmTab; label: string }[] = [
    { id: 'chat', label: 'Chat' },
    { id: 'changes', label: 'Changes' },
    { id: 'settings', label: 'Settings' },
  ];

  $: changeCount = $pendingChanges.length;

  onMount(() => {
    initConversations();
  });
</script>

<div class="llm-panel">
  <div class="tab-bar" role="tablist" aria-label="AI agent sections">
    {#each tabs as tab}
      <button
        class="tab-btn {activeTab === tab.id ? 'active' : ''}"
        role="tab"
        aria-selected={activeTab === tab.id}
        on:click={() => (activeTab = tab.id)}
        aria-label="{tab.label}{tab.id === 'changes' && changeCount > 0
          ? ` (${changeCount} pending)`
          : ''}"
      >
        {tab.label}
        {#if tab.id === 'changes' && changeCount > 0}
          <span class="tab-badge" aria-hidden="true">{changeCount}</span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="tab-content">
    {#if activeTab === 'chat'}
      <ChatTabBar />
      <div class="chat-toolbar">
        <button
          class="plan-toggle"
          class:active={$isPlanMode}
          on:click={togglePlanMode}
          aria-label="Toggle plan mode"
          title="Plan mode: agent explores before implementing"
        >
          <Icon name="lightbulb" size={14} />
          <span class="plan-label">{$isPlanMode ? 'Plan' : 'Act'}</span>
        </button>
      </div>
      <AgentPanel {noteTitle} />
    {:else if activeTab === 'changes'}
      <AgentChangeReview {vaultRoot} />
    {:else if activeTab === 'settings'}
      <LlmVaultConfig {vaultRoot} />
    {/if}
  </div>
</div>

<style>
  .llm-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
  }
  .tab-btn {
    flex: 1;
    padding: var(--spacing-s) var(--spacing-xs);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: var(--font-ui-small);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: color 0.15s;
  }
  .tab-btn:hover {
    color: var(--text-normal);
  }
  .tab-btn.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }
  .tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
    border-radius: 8px;
    font-size: var(--font-smallest);
    font-weight: 600;
    padding: 0 4px;
  }
  .tab-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .chat-toolbar {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 4px var(--spacing-xs);
    border-bottom: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
  }
  .plan-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller, 12px);
    cursor: pointer;
    transition: all 0.15s;
  }
  .plan-toggle:hover {
    border-color: var(--interactive-accent);
    color: var(--text-normal);
  }
  .plan-toggle.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
    border-color: var(--interactive-accent);
  }
  .plan-label {
    font-weight: var(--font-medium, 500);
  }
</style>
