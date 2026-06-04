<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import {
    visibleTags,
    tagHierarchy,
    hiddenTags,
    renameTag as renameTagAction,
    mergeTags as mergeTagsAction,
    toggleTagVisibility,
    showTag,
    type TagNode,
  } from '@/stores/tag/tag';

  export let onFilterByTag: ((tagName: string) => void) | undefined = undefined;
  export let onOpenNote: ((path: string) => void) | undefined = undefined;

  let expandedTags: Set<string> = new Set();
  let searchQuery = '';
  let selectedTag: string | null = null;
  let showHidden = false;

  // Context menu state
  let contextMenuVisible = false;
  let contextMenuTag: string | null = null;
  let contextMenuX = 0;
  let contextMenuY = 0;

  $: tags = showHidden ? $tagHierarchy : $visibleTags;
  $: hiddenCount = $hiddenTags.size;

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

  function showContextMenu(e: MouseEvent, tagName: string) {
    e.preventDefault();
    contextMenuTag = tagName;
    contextMenuX = e.clientX;
    contextMenuY = e.clientY;
    contextMenuVisible = true;
  }

  function closeContextMenu() {
    contextMenuVisible = false;
    contextMenuTag = null;
  }

  async function renameTag(oldName: string) {
    const newName = prompt(`Rename tag "${oldName}" to:`, oldName);
    if (newName && newName !== oldName) {
      try {
        const result = await renameTagAction(oldName, newName);
        if (result?.was_merge) {
          console.info(`Tag merged: "${oldName}" into existing "${newName}"`);
        }
      } catch (error) {
        console.error('Failed to rename tag:', error);
      }
    }
    closeContextMenu();
  }

  async function mergeTag(sourceTag: string) {
    const targetTag = prompt(
      `Merge tag "${sourceTag}" into (target tag):`,
      ''
    );
    if (targetTag && targetTag !== sourceTag) {
      const confirmed = confirm(
        `This will merge all occurrences of "${sourceTag}" into "${targetTag}". This cannot be undone. Continue?`
      );
      if (confirmed) {
        try {
          await mergeTagsAction(sourceTag, targetTag);
        } catch (error) {
          console.error('Failed to merge tags:', error);
        }
      }
    }
    closeContextMenu();
  }

  async function createTagPage(tagName: string) {
    try {
      const notePath = `tags/${tagName.replace(/\//g, '-')}.md`;
      const content = `---\ntags: [${tagName}]\naliases: ["#${tagName}"]\n---\n\n# ${tagName}\n\nTag page for #${tagName}.\n`;
      await invoke('create_note', { path: notePath, content });
      onOpenNote?.(notePath);
    } catch (error) {
      console.error('Failed to create tag page:', error);
    }
    closeContextMenu();
  }

  async function openRandomNoteWithTag(tagName: string) {
    try {
      const path = await invoke<string>('get_random_note_with_tag', { tag: tagName });
      onOpenNote?.(path);
    } catch (error) {
      console.error('Failed to get random note:', error);
    }
    closeContextMenu();
  }

  function hideTag(tagName: string) {
    toggleTagVisibility(tagName);
    closeContextMenu();
  }

  function unhideTag(tagName: string) {
    showTag(tagName);
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

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="tag-panel" on:click={closeContextMenu}>
  <div class="panel-header">
    <Icon name="tag" size={16} />
    <h3>Tags</h3>
    {#if hiddenCount > 0}
      <button
        class="toggle-hidden-btn"
        class:active={showHidden}
        on:click={() => (showHidden = !showHidden)}
        title="{showHidden ? 'Hide hidden tags' : `Show ${hiddenCount} hidden tag(s)`}"
      >
        <Icon name={showHidden ? 'eye' : 'eye-off'} size={14} />
      </button>
    {/if}
  </div>

  <div class="search-box">
    <Icon name="search" size={14} />
    <input type="text" placeholder="Search tags..." bind:value={searchQuery} />
  </div>

  <div class="tag-list">
    {#each filteredTags as tag}
      <div class="tag-group">
        <div
          class="tag-item"
          class:selected={selectedTag === tag.name}
          class:hidden-tag={$hiddenTags.has(tag.name)}
          on:contextmenu={(e) => showContextMenu(e, tag.name)}
        >
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
              <div
                class="tag-item child"
                class:selected={selectedTag === childTag.name}
                class:hidden-tag={$hiddenTags.has(childTag.name)}
                on:contextmenu={(e) => showContextMenu(e, childTag.name)}
              >
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

<!-- Context menu -->
{#if contextMenuVisible && contextMenuTag}
  <div
    class="context-menu"
    style="left: {contextMenuX}px; top: {contextMenuY}px;"
  >
    <button class="context-menu-item" on:click={() => renameTag(contextMenuTag)}>
      <Icon name="edit-2" size={14} />
      <span>Rename tag</span>
    </button>
    <button class="context-menu-item" on:click={() => mergeTag(contextMenuTag)}>
      <Icon name="git-merge" size={14} />
      <span>Merge into…</span>
    </button>
    <div class="context-menu-separator"></div>
    <button class="context-menu-item" on:click={() => createTagPage(contextMenuTag)}>
      <Icon name="file-plus" size={14} />
      <span>Create tag page</span>
    </button>
    <button class="context-menu-item" on:click={() => openRandomNoteWithTag(contextMenuTag)}>
      <Icon name="shuffle" size={14} />
      <span>Random note with tag</span>
    </button>
    <div class="context-menu-separator"></div>
    {#if $hiddenTags.has(contextMenuTag)}
      <button class="context-menu-item" on:click={() => unhideTag(contextMenuTag)}>
        <Icon name="eye" size={14} />
        <span>Show in graph</span>
      </button>
    {:else}
      <button class="context-menu-item" on:click={() => hideTag(contextMenuTag)}>
        <Icon name="eye-off" size={14} />
        <span>Hide from graph</span>
      </button>
    {/if}
  </div>
{/if}

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

  .hidden-tag {
    opacity: 0.5;
  }

  .hidden-tag .tag-name {
    text-decoration: line-through;
  }

  .toggle-hidden-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-left: auto;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toggle-hidden-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .toggle-hidden-btn.active {
    color: var(--interactive-accent);
  }

  .context-menu {
    position: fixed;
    z-index: 1000;
    min-width: 180px;
    background-color: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    box-shadow: var(--shadow-m);
    padding: 4px;
  }

  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.1s ease;
  }

  .context-menu-item:hover {
    background-color: var(--interactive-hover);
  }

  .context-menu-separator {
    height: 1px;
    background-color: var(--border-color);
    margin: 4px 8px;
  }
</style>
