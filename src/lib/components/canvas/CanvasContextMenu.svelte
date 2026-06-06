<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { currentCanvas, selectedElements } from '@/stores/canvas/canvasStore';
  import {
    copySelectedElements,
    pasteElements,
    deleteSelectedElements,
    duplicateSelectedElements,
  } from '@/stores/canvas/canvasElements';
  import { enterComponentEditMode } from '@/stores/canvas/componentLibrary';

  export let x = 0;
  export let y = 0;
  export let show = false;

  const dispatch = createEventDispatcher<{
    createComponent: void;
    close: void;
  }>();

  $: hasSelection = $selectedElements.length > 0;
  $: selectedInstance = (() => {
    if ($selectedElements.length !== 1 || !$currentCanvas) return null;
    const el = $currentCanvas.elements.find((e) => e.id === $selectedElements[0]);
    if (el?.element_type === 'component_instance') return el;
    return null;
  })();

  function handleAction(action: string) {
    switch (action) {
      case 'copy':
        copySelectedElements();
        break;
      case 'paste':
        pasteElements();
        break;
      case 'duplicate':
        duplicateSelectedElements();
        break;
      case 'delete':
        deleteSelectedElements();
        break;
      case 'createComponent':
        dispatch('createComponent');
        break;
      case 'editComponent':
        if (selectedInstance) {
          const defId = (selectedInstance.properties as Record<string, unknown>).definitionId as string;
          if (defId) enterComponentEditMode(defId);
        }
        break;
      case 'detachInstance':
        // Detach handled by dispatching - the parent wires the actual detach logic
        dispatch('close');
        break;
    }
    close();
  }

  function close() {
    show = false;
    dispatch('close');
  }

  function handleOutsideClick() {
    close();
  }
</script>

{#if show}
  <div class="context-backdrop" on:click={handleOutsideClick} on:keydown role="presentation"></div>
  <div class="context-menu" style="left: {x}px; top: {y}px" role="menu">
    {#if hasSelection}
      {#if selectedInstance}
        <button class="menu-item" on:click={() => handleAction('editComponent')} role="menuitem">
          Edit Component
        </button>
        <button class="menu-item" on:click={() => handleAction('detachInstance')} role="menuitem">
          Detach Instance
        </button>
        <div class="menu-separator"></div>
      {/if}
      <button class="menu-item" on:click={() => handleAction('createComponent')} role="menuitem">
        Create Component
      </button>
      <div class="menu-separator"></div>
      <button class="menu-item" on:click={() => handleAction('copy')} role="menuitem">
        Copy
      </button>
      <button class="menu-item" on:click={() => handleAction('duplicate')} role="menuitem">
        Duplicate
      </button>
      <button class="menu-item destructive" on:click={() => handleAction('delete')} role="menuitem">
        Delete
      </button>
    {:else}
      <button class="menu-item" on:click={() => handleAction('paste')} role="menuitem">
        Paste
      </button>
    {/if}
  </div>
{/if}

<style>
  .context-backdrop {
    position: fixed;
    inset: 0;
    z-index: 999;
  }

  .context-menu {
    position: fixed;
    z-index: 1000;
    min-width: 160px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    padding: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .menu-item {
    display: block;
    width: 100%;
    padding: 6px 12px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    font-size: 13px;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }

  .menu-item:hover {
    background: var(--background-modifier-hover);
  }

  .menu-item.destructive {
    color: var(--text-error);
  }

  .menu-separator {
    height: 1px;
    background: var(--border-color);
    margin: 4px 0;
  }
</style>
