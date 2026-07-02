<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { visibleTags, type TagNode } from '@/features/tag';
  import { selectedTag, selectTag } from '../stores/navigatorActions';

  let expandedTags = new Set<string>();
  let sortMode: 'alpha' | 'count' = 'alpha';

  $: sortedTags = sortTagNodes($visibleTags, sortMode);

  function sortTagNodes(nodes: TagNode[], mode: 'alpha' | 'count'): TagNode[] {
    const sorted = [...nodes].sort((a, b) =>
      mode === 'count'
        ? b.count - a.count || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name)
    );
    return sorted.map((n) => ({
      ...n,
      children: sortTagNodes(n.children, mode),
    }));
  }

  function toggleExpand(name: string) {
    if (expandedTags.has(name)) expandedTags.delete(name);
    else expandedTags.add(name);
    expandedTags = expandedTags;
  }

  function handleTagClick(tag: TagNode) {
    selectTag(tag.name);
  }

  function handleKeydown(e: KeyboardEvent, tag: TagNode) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTagClick(tag);
    }
    if (e.key === 'ArrowRight' && !expandedTags.has(tag.name) && tag.children.length > 0) {
      e.preventDefault();
      toggleExpand(tag.name);
    }
    if (e.key === 'ArrowLeft' && expandedTags.has(tag.name)) {
      e.preventDefault();
      toggleExpand(tag.name);
    }
  }

  function getShortName(fullName: string): string {
    const parts = fullName.split('/');
    return parts[parts.length - 1];
  }

  function toggleSortMode() {
    sortMode = sortMode === 'alpha' ? 'count' : 'alpha';
  }
</script>

<div class="tag-tree-container">
  <div class="tag-tree-header">
    <span class="tag-count">{$visibleTags.length} tags</span>
    <button
      class="sort-btn"
      on:click={toggleSortMode}
      title={sortMode === 'alpha' ? 'Sort by count' : 'Sort alphabetically'}
    >
      <Icon name={sortMode === 'alpha' ? 'sort-asc' : 'hash'} size={12} />
    </button>
  </div>

  {#if sortedTags.length === 0}
    <div class="empty-state">
      <Icon name="tag" size={16} />
      <p>No tags found</p>
    </div>
  {:else}
    <div class="tag-list" role="tree" aria-label="Tag hierarchy">
      {#each sortedTags as tag (tag.name)}
        {@const isExpanded = expandedTags.has(tag.name)}
        {@const isSelected = $selectedTag === tag.name}
        {@const hasChildren = tag.children.length > 0}
        <div
          class="tag-item"
          class:selected={isSelected}
          role="treeitem"
          tabindex="0"
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-selected={isSelected}
          on:click={() => handleTagClick(tag)}
          on:keydown={(e) => handleKeydown(e, tag)}
        >
          {#if hasChildren}
            <button
              class="expand-btn"
              on:click|stopPropagation={() => toggleExpand(tag.name)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} />
            </button>
          {:else}
            <span class="expand-spacer"></span>
          {/if}
          <Icon name="hash" size={12} />
          <span class="tag-name">{getShortName(tag.name)}</span>
          <span class="tag-badge">{tag.count}</span>
        </div>

        {#if isExpanded && hasChildren}
          {#each tag.children as child (child.name)}
            {@const childExpanded = expandedTags.has(child.name)}
            {@const childSelected = $selectedTag === child.name}
            {@const childHasKids = child.children.length > 0}
            <div
              class="tag-item nested"
              class:selected={childSelected}
              role="treeitem"
              tabindex="0"
              aria-expanded={childHasKids ? childExpanded : undefined}
              aria-selected={childSelected}
              style="padding-left: 24px"
              on:click={() => handleTagClick(child)}
              on:keydown={(e) => handleKeydown(e, child)}
            >
              {#if childHasKids}
                <button
                  class="expand-btn"
                  on:click|stopPropagation={() => toggleExpand(child.name)}
                  aria-label={childExpanded ? 'Collapse' : 'Expand'}
                >
                  <Icon name={childExpanded ? 'chevron-down' : 'chevron-right'} size={12} />
                </button>
              {:else}
                <span class="expand-spacer"></span>
              {/if}
              <Icon name="hash" size={12} />
              <span class="tag-name">{getShortName(child.name)}</span>
              <span class="tag-badge">{child.count}</span>
            </div>

            {#if childExpanded && childHasKids}
              {#each child.children as grandchild (grandchild.name)}
                <div
                  class="tag-item nested"
                  class:selected={$selectedTag === grandchild.name}
                  role="treeitem"
                  tabindex="0"
                  aria-selected={$selectedTag === grandchild.name}
                  style="padding-left: 40px"
                  on:click={() => handleTagClick(grandchild)}
                  on:keydown={(e) => handleKeydown(e, grandchild)}
                >
                  <span class="expand-spacer"></span>
                  <Icon name="hash" size={12} />
                  <span class="tag-name">{getShortName(grandchild.name)}</span>
                  <span class="tag-badge">{grandchild.count}</span>
                </div>
              {/each}
            {/if}
          {/each}
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .tag-tree-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .tag-tree-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    font-size: 10px;
    color: var(--text-faint);
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
  }

  .sort-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
  }

  .sort-btn:hover {
    background: var(--interactive-hover);
    color: var(--text-normal);
  }

  .tag-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
  }

  .tag-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 4px;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: 12px;
    color: var(--text-normal);
    user-select: none;
  }

  .tag-item:hover {
    background: var(--interactive-hover);
  }

  .tag-item.selected {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    border-radius: var(--radius-s);
    flex-shrink: 0;
  }

  .expand-btn:hover {
    background: var(--background-modifier-hover);
  }

  .expand-spacer {
    width: 16px;
    flex-shrink: 0;
  }

  .tag-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tag-badge {
    font-size: 10px;
    color: var(--text-faint);
    flex-shrink: 0;
    min-width: 16px;
    text-align: right;
  }

  .selected .tag-badge {
    color: var(--text-on-accent);
    opacity: 0.7;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    gap: 8px;
    font-size: 12px;
  }
</style>
