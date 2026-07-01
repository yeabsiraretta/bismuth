<script lang="ts">
  import { ContextMenu, MenuItem, MenuDivider } from '@/components/ui/menu';
  import { currentCanvas, selectedElements } from '@/features/canvas/stores';
  import {
    copySelectedElements,
    pasteElements,
    deleteSelectedElements,
    duplicateSelectedElements,
  } from '@/features/canvas/stores';
  import { enterComponentEditMode } from '@/features/canvas/stores';

  export let x = 0;
  export let y = 0;
  export let show = false;
  export let onCreateComponent: (() => void) | undefined = undefined;
  export let onCloseMenu: (() => void) | undefined = undefined;

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
        onCreateComponent?.();
        break;
      case 'editComponent':
        if (selectedInstance) {
          const defId = (selectedInstance.properties as Record<string, unknown>).definitionId as string;
          if (defId) enterComponentEditMode(defId);
        }
        break;
      case 'detachInstance':
        onCloseMenu?.();
        break;
    }
    close();
  }

  function close() {
    show = false;
    onCloseMenu?.();
  }
</script>

<ContextMenu {x} {y} {show} onClose={close}>
  {#if hasSelection}
    {#if selectedInstance}
      <MenuItem label="Edit Component" on:click={() => handleAction('editComponent')} />
      <MenuItem label="Detach Instance" on:click={() => handleAction('detachInstance')} />
      <MenuDivider />
    {/if}
    <MenuItem label="Create Component" on:click={() => handleAction('createComponent')} />
    <MenuDivider />
    <MenuItem icon="copy" label="Copy" on:click={() => handleAction('copy')} />
    <MenuItem icon="copy" label="Duplicate" on:click={() => handleAction('duplicate')} />
    <MenuItem icon="trash" label="Delete" destructive on:click={() => handleAction('delete')} />
  {:else}
    <MenuItem icon="clipboard" label="Paste" on:click={() => handleAction('paste')} />
  {/if}
</ContextMenu>
