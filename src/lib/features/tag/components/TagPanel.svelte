<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import SearchInput from '@/components/ui/forms/SearchInput.svelte';
  import TagContextMenu from './TagContextMenu.svelte';
  import { visibleTags, tagHierarchy, hiddenTags } from '../stores/tag';
  import {
    renameTagOp,
    mergeTagOp,
    createTagPage as createTagPageOp,
    openRandomNoteWithTag as openRandomOp,
    hideTagOp,
    unhideTagOp,
    filterNodes,
  } from './tagOperations';

  export let onFilterByTag: ((tagName: string) => void) | undefined = undefined;
  export let onOpenNote: ((path: string) => void) | undefined = undefined;

  let expandedTags: Set<string> = new Set();
  let searchQuery = '';
  let selectedTag: string | null = null;
  let showHidden = false;

  let contextMenuVisible = false;
  let contextMenuTag: string | null = null;
  let contextMenuX = 0;
  let contextMenuY = 0;

  $: tags = showHidden ? $tagHierarchy : $visibleTags;
  $: hiddenCount = $hiddenTags.size;
  $: filteredTags = filterNodes(tags, searchQuery);

  function toggleTag(tagName: string) {
    if (expandedTags.has(tagName)) { expandedTags.delete(tagName); }
    else { expandedTags.add(tagName); }
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

  function closeContextMenu() { contextMenuVisible = false; contextMenuTag = null; }

  function renameTag(name: string) { renameTagOp(name, closeContextMenu); }
  function mergeTag(name: string) { mergeTagOp(name, closeContextMenu); }
  function createTagPage(name: string) { createTagPageOp(name, onOpenNote, closeContextMenu); }
  function openRandomNoteWithTag(name: string) { openRandomOp(name, onOpenNote, closeContextMenu); }
  function hideTag(name: string) { hideTagOp(name, closeContextMenu); }
  function unhideTag(name: string) { unhideTagOp(name); }
</script>

<div class="tag-panel" on:click={closeContextMenu} on:keydown={() => {}} role="presentation">
  <PanelHeader icon="tag" title="Tags" count={filteredTags.length || undefined}>
    <svelte:fragment slot="actions">
      {#if hiddenCount > 0}
        <button
          class="toggle-hidden-btn"
          class:active={showHidden}
          on:click={() => (showHidden = !showHidden)}
          title={showHidden ? 'Hide hidden tags' : `Show ${hiddenCount} hidden tag(s)`}
        >
          <Icon name={showHidden ? 'eye' : 'eye-off'} size={14} />
        </button>
      {/if}
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">

  <SearchInput bind:value={searchQuery} placeholder="Search tags..." />

    <div class="tag-list">
    {#each filteredTags as tag}
      <div class="tag-group">
        <div
          class="tag-item"
          class:selected={selectedTag === tag.name}
          class:hidden-tag={$hiddenTags.has(tag.name)}
          on:contextmenu={(e) => showContextMenu(e, tag.name)}
          role="group"
        >
          <button class="tag-expand-btn" on:click={() => toggleTag(tag.name)} title="Toggle children">
            {#if tag.children && tag.children.length > 0}
              <Icon
                name={expandedTags.has(tag.name) ? 'chevron-down' : 'chevron-right'}
                size={14}
              />
            {:else}
              <span class="spacer"></span>
            {/if}
          </button>

          <button class="tag-name-btn" on:click={() => selectTag(tag.name)} title="Filter by {tag.name}">
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
                role="group"
              >
                <span class="spacer"></span>
                <button class="tag-name-btn" on:click={() => selectTag(childTag.name)} title="Filter by {childTag.name}">
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
</div>

<TagContextMenu
  visible={contextMenuVisible}
  tagName={contextMenuTag}
  x={contextMenuX}
  y={contextMenuY}
  onRename={renameTag}
  onMerge={mergeTag}
  onCreatePage={createTagPage}
  onRandomNote={openRandomNoteWithTag}
  onHide={hideTag}
  onUnhide={unhideTag}
/>

<style>
  .tag-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .panel-body { flex: 1; overflow-y: auto; padding: var(--spacing-s) var(--spacing-m); }
  .tag-list { flex: 1; overflow-y: auto; }
  .tag-group { margin-bottom: 4px; }
  .tag-item { display: flex; align-items: center; gap: 4px; padding: 4px; border-radius: var(--radius-s); transition: background-color 0.15s ease; }
  .tag-item:hover { background-color: var(--interactive-hover); }
  .tag-item.selected { background-color: var(--interactive-accent); }
  .tag-item.selected .tag-name, .tag-item.selected .tag-count { color: var(--text-on-accent); }
  .tag-item.child { padding-left: 20px; }
  .tag-expand-btn { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: none; border: none; color: var(--text-muted); cursor: pointer; flex-shrink: 0; }
  .spacer { width: 20px; flex-shrink: 0; }
  .tag-name-btn { display: flex; align-items: center; gap: 6px; flex: 1; background: none; border: none; color: var(--text-normal); cursor: pointer; text-align: left; padding: 4px; border-radius: var(--radius-s); }
  .tag-name { flex: 1; font-size: 13px; }
  .tag-count { font-size: 11px; color: var(--text-faint); font-weight: 600; }
  .tag-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s ease; }
  .tag-item:hover .tag-actions { opacity: 1; }
  .tag-action-btn { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: none; border: none; border-radius: var(--radius-s); color: var(--text-muted); cursor: pointer; transition: all 0.15s ease; }
  .tag-action-btn:hover { background-color: var(--interactive-hover); color: var(--text-normal); }
  .tag-children { margin-top: 2px; }
  .hidden-tag { opacity: 0.5; }
  .hidden-tag .tag-name { text-decoration: line-through; }
  .toggle-hidden-btn { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; margin-left: auto; background: none; border: none; border-radius: var(--radius-s); color: var(--text-muted); cursor: pointer; transition: all 0.15s ease; }
  .toggle-hidden-btn:hover { background-color: var(--interactive-hover); color: var(--text-normal); }
  .toggle-hidden-btn.active { color: var(--interactive-accent); }
</style>
