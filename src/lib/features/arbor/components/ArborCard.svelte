<script lang="ts">
  import type { ArborBlock } from '../types';
  import {
    arborSelection,
    selectBlock,
    enterEditMode,
    exitEditMode,
    updateBlockContent,
  } from '../stores/arborStore';
  import { arborConfig } from '../stores/arborStore';

  export let block: ArborBlock;
  export let selected: boolean = false;

  let editContent = block.content;

  function handleClick() {
    selectBlock(block.id);
  }

  function handleDblClick() {
    selectBlock(block.id);
    enterEditMode();
  }

  function handleSave() {
    updateBlockContent(block.id, editContent);
    exitEditMode();
  }

  function handleCancel() {
    editContent = block.content;
    exitEditMode();
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }

  $: isEditing = selected && $arborSelection.editing;
  $: snippet =
    block.content.length > $arborConfig.previewSnippetLength
      ? block.content.slice(0, $arborConfig.previewSnippetLength) + '…'
      : block.content;
  $: if (!isEditing) editContent = block.content;
</script>

<div
  class="arbor-card"
  class:selected
  class:editing={isEditing}
  style="width: {$arborConfig.cardWidth}px; min-height: {$arborConfig.cardMinHeight}px;"
  role="treeitem"
  aria-selected={selected}
  tabindex="0"
  on:click={handleClick}
  on:dblclick={handleDblClick}
  on:keydown={(e) => {
    if (e.key === 'Enter') handleDblClick();
  }}
>
  {#if isEditing}
    <!-- svelte-ignore a11y_autofocus -->
    <textarea class="card-editor" bind:value={editContent} on:keydown={handleEditKeydown} autofocus
    ></textarea>
  {:else}
    <div class="card-content">
      {snippet || 'Empty block'}
    </div>
  {/if}
</div>

<style>
  .arbor-card {
    padding: var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    background: var(--background-secondary);
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast);
    overflow: hidden;
    position: relative;
  }
  .arbor-card:hover {
    border-color: var(--interactive-accent);
  }
  .arbor-card.selected {
    border-color: var(--interactive-accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--interactive-accent) 20%, transparent);
  }
  .arbor-card.editing {
    border-color: var(--interactive-accent);
    background: var(--background-primary);
  }
  .card-content {
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
  }
  .card-editor {
    width: 100%;
    min-height: 80px;
    border: none;
    outline: none;
    resize: vertical;
    font-family: var(--font-mono);
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    background: transparent;
    line-height: 1.5;
  }
</style>
