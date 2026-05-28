<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let noteName: string;
  export let notePath: string;
  export let context: string;
  export let collapsed = false;
  export let showCreateLink = false;
  export let onOpen: () => void;
  export let onCreateLink: (() => void) | undefined = undefined;
</script>

<div class="mention-item">
  {#if showCreateLink}
    <div class="mention-header-row">
      <button class="mention-header" on:click={onOpen}>
        <Icon name="file" size={16} />
        <span class="mention-name">{noteName}</span>
        <span class="mention-path">{notePath}</span>
      </button>
      {#if onCreateLink}
        <button class="link-btn" on:click={onCreateLink} title="Create link">
          <Icon name="plus" size={14} />
        </button>
      {/if}
    </div>
  {:else}
    <button class="mention-header" on:click={onOpen}>
      <Icon name="file" size={16} />
      <span class="mention-name">{noteName}</span>
      <span class="mention-path">{notePath}</span>
    </button>
  {/if}
  {#if !collapsed}
    <div class="mention-context">
      {context}
    </div>
  {/if}
</div>

<style>
  .mention-item {
    border-bottom: 1px solid var(--color-border);
  }

  .mention-item:last-child {
    border-bottom: none;
  }

  .mention-header-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .mention-header {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--color-text);
    transition: background 0.15s;
  }

  .mention-header:hover {
    background: var(--color-surface);
  }

  .mention-name {
    font-weight: 500;
    font-size: 0.875rem;
  }

  .mention-path {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .link-btn {
    padding: var(--space-1);
    margin-right: var(--space-2);
    background: var(--color-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;
  }

  .link-btn:hover {
    opacity: 0.8;
  }

  .mention-context {
    padding: var(--space-2) var(--space-3);
    padding-left: calc(var(--space-3) + 16px + var(--space-2));
    font-size: 0.875rem;
    color: var(--color-text-muted);
    white-space: pre-wrap;
    background: var(--color-surface);
  }
</style>
