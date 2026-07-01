<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    conversationTabs,
    activeTabId,
    newConversation,
    switchConversation,
    closeConversation,
  } from '../stores/conversationStore';

  function handleNewTab() {
    newConversation();
  }

  function handleCloseTab(e: MouseEvent, id: string) {
    e.stopPropagation();
    closeConversation(id);
  }
</script>

<div class="chat-tab-bar" role="tablist" aria-label="Chat conversations">
  {#each $conversationTabs as tab (tab.id)}
    <div class="chat-tab-wrapper" class:active={tab.id === $activeTabId}>
      <button
        class="chat-tab"
        role="tab"
        aria-selected={tab.id === $activeTabId}
        on:click={() => switchConversation(tab.id)}
        title={tab.title}
      >
        <span class="tab-title">{tab.title}</span>
      </button>
      {#if $conversationTabs.length > 1}
        <button
          class="tab-close"
          on:click={(e) => handleCloseTab(e, tab.id)}
          aria-label="Close {tab.title}"
          title="Close tab"
        >
          <Icon name="x" size={12} />
        </button>
      {/if}
    </div>
  {/each}

  <button
    class="new-tab-btn"
    on:click={handleNewTab}
    aria-label="New conversation"
    title="New conversation"
  >
    <Icon name="plus" size={14} />
  </button>
</div>

<style>
  .chat-tab-bar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px var(--spacing-xs);
    overflow-x: auto;
    flex-shrink: 0;
    border-bottom: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
  }
  .chat-tab-bar::-webkit-scrollbar {
    height: 2px;
  }

  .chat-tab-wrapper {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px 2px 0;
    border-radius: var(--radius-s);
    flex-shrink: 0;
    max-width: 130px;
    transition: background 0.15s;
  }
  .chat-tab-wrapper:hover {
    background: var(--background-modifier-hover);
  }
  .chat-tab-wrapper.active {
    background: var(--background-primary);
  }

  .chat-tab {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller, 12px);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }
  .chat-tab-wrapper:hover .chat-tab {
    color: var(--text-normal);
  }
  .chat-tab-wrapper.active .chat-tab {
    color: var(--text-normal);
    font-weight: var(--font-medium, 500);
  }

  .tab-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: transparent;
    border-radius: var(--radius-s);
    color: var(--text-faint);
    cursor: pointer;
    flex-shrink: 0;
    opacity: 0;
  }
  .chat-tab-wrapper:hover .tab-close {
    opacity: 1;
  }
  .tab-close:hover {
    background: var(--background-modifier-hover);
    color: var(--text-error);
  }

  .new-tab-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: transparent;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
  }
  .new-tab-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
</style>
