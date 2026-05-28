<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    visibleTags,
    renameTag as renameTagAction,
    toggleTagVisibility,
    type TagNode,
  } from '@/stores/tag/tag';

  export let onFilterByTag: ((tagName: string) => void) | undefined = undefined;

  let expandedTags: Set<string> = new Set();
  let searchQuery = '';
  let selectedTag: string | null = null;

  $: tags = $visibleTags;

  function toggleTag(tagName: string) {
    if (expandedTags.has(tagName)) {
      expandedTags.delete(tagName);
    } else {
      expandedTags.add(tagName);
    }
    expandedTags = expandedTags;
  }

  function selectTag(tagName: string) {
    selectedTag = tagName;
    onFilterByTag?.(tagName);
  }

  async function renameTag(oldName: string) {
    const newName = prompt(`Rename tag "${oldName}" to:`, oldName);
    if (newName && newName !== oldName) {
      try {
        await renameTagAction(oldName, newName);
      } catch (error) {
        console.error('Failed to rename tag:', error);
      }
    }
  }

  function hideTag(tagName: string) {
    toggleTagVisibility(tagName);
  }

  function filterNodes(nodes: TagNode[], query: string): TagNode[] {
    if (!query) return nodes;
    const lower = query.toLowerCase();
    return nodes.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.children.some((c) => c.name.toLowerCase().includes(lower))
    );
  }

  $: filteredTags = filterNodes(tags, searchQuery);
</script>

<div class="tag-panel">
  <div class="panel-header">
    <Icon name="tag" size={16} />
    <h3>Tags</h3>
  </div>

  <div class="search-box">
    <Icon name="search" size={14} />
    <input type="text" placeholder="Search tags..." bind:value={searchQuery} />
  </div>

  <div class="tag-list">
    {#each filteredTags as tag}
      <div class="tag-group">
        <div class="tag-item" class:selected={selectedTag === tag.name}>
          <button class="tag-expand-btn" on:click={() => toggleTag(tag.name)}>
            {#if tag.children && tag.children.length > 0}
              <Icon
                name={expandedTags.has(tag.name) ? 'chevron-down' : 'chevron-right'}
                size={14}
              />
            {:else}
              <span class="spacer"></span>
            {/if}
          </button>

          <button class="tag-name-btn" on:click={() => selectTag(tag.name)}>
            <Icon name="tag" size={14} />
            <span class="tag-name">{tag.name}</span>
            <span class="tag-count">{tag.count}</span>
          </button>

          <div class="tag-actions">
            <button class="tag-action-btn" on:click={() => renameTag(tag.name)} title="Rename tag">
              <Icon name="edit-2" size={12} />
            </button>
            <button class="tag-action-btn" on:click={() => hideTag(tag.name)} title="Hide tag">
              <Icon name="eye-off" size={12} />
            </button>
          </div>
        </div>

        {#if expandedTags.has(tag.name) && tag.children}
          <div class="tag-children">
            {#each tag.children as childTag}
              <div class="tag-item child" class:selected={selectedTag === childTag.name}>
                <span class="spacer"></span>
                <button class="tag-name-btn" on:click={() => selectTag(childTag.name)}>
                  <Icon name="tag" size={12} />
                  <span class="tag-name">{childTag.name}</span>
                  <span class="tag-count">{childTag.count}</span>
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .tag-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .panel-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    margin-bottom: 12px;
  }

  .search-box input {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-normal);
    font-size: 13px;
    outline: none;
  }

  .search-box input::placeholder {
    color: var(--text-faint);
  }

  .tag-list {
    flex: 1;
    overflow-y: auto;
  }

  .tag-group {
    margin-bottom: 4px;
  }

  .tag-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border-radius: var(--radius-s);
    transition: background-color 0.15s ease;
  }

  .tag-item:hover {
    background-color: var(--interactive-hover);
  }

  .tag-item.selected {
    background-color: var(--interactive-accent);
  }

  .tag-item.selected .tag-name,
  .tag-item.selected .tag-count {
    color: var(--text-on-accent);
  }

  .tag-item.child {
    padding-left: 20px;
  }

  .tag-expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
  }

  .spacer {
    width: 20px;
    flex-shrink: 0;
  }

  .tag-name-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    background: none;
    border: none;
    color: var(--text-normal);
    cursor: pointer;
    text-align: left;
    padding: 4px;
    border-radius: var(--radius-s);
  }

  .tag-name {
    flex: 1;
    font-size: 13px;
  }

  .tag-count {
    font-size: 11px;
    color: var(--text-faint);
    font-weight: 600;
  }

  .tag-actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .tag-item:hover .tag-actions {
    opacity: 1;
  }

  .tag-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tag-action-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .tag-children {
    margin-top: 2px;
  }
</style>
