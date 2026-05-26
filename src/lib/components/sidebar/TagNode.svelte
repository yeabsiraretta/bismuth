<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  interface TagNode {
    name: string;
    count: number;
    children: TagNode[];
    isExpanded: boolean;
  }

  // Props
  export let node: TagNode;
  export let parentPath: string = '';
  export let selectedTag: string | null = null;
  export let ontoggle: (() => void) | undefined = undefined;
  export let onselect: ((path: string) => void) | undefined = undefined;

  // Reactive declarations
  $: fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
  $: isSelected = selectedTag === fullPath;

  function handleToggle(event: MouseEvent) {
    event.stopPropagation();
    ontoggle?.();
  }

  function handleSelect() {
    onselect?.(fullPath);
  }
</script>

{#if node}
  <div class="tag-node">
    <div
      class="tag-item"
      class:selected={isSelected}
      on:click={handleSelect}
      on:keydown={(e) => e.key === 'Enter' && handleSelect()}
      role="button"
      tabindex="0"
    >
      {#if node.children.length > 0}
        <button class="expand-btn" on:click={handleToggle}>
          <Icon name={node.isExpanded ? 'chevron-down' : 'chevron-right'} size={12} />
        </button>
      {:else}
        <span class="expand-spacer"></span>
      {/if}

      <Icon name="tag" size={14} />
      <span class="tag-name">{node.name}</span>
      {#if node.count > 0}
        <span class="tag-count">{node.count}</span>
      {/if}
    </div>

    {#if node.isExpanded && node.children.length > 0}
      <div class="tag-children">
        {#each node.children as child}
          <svelte:self node={child} parentPath={fullPath} {selectedTag} on:toggle on:select />
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .tag-node {
    width: 100%;
  }

  .tag-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    cursor: pointer;
    border-radius: var(--radius-xs);
    transition: background-color var(--transition-fast);
    user-select: none;
  }

  .tag-item:hover {
    background-color: var(--background-modifier-hover);
  }

  .tag-item.selected {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .tag-item:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
  }

  .expand-btn:hover {
    color: var(--text-normal);
  }

  .expand-spacer {
    width: 16px;
  }

  .tag-name {
    flex: 1;
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }

  .tag-item.selected .tag-name {
    color: var(--text-on-accent);
  }

  .tag-count {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    background-color: var(--background-secondary);
    padding: 2px 6px;
    border-radius: var(--radius-s);
  }

  .tag-item.selected .tag-count {
    background-color: rgba(255, 255, 255, 0.2);
    color: var(--text-on-accent);
  }

  .tag-children {
    padding-left: var(--spacing-m);
  }
</style>
