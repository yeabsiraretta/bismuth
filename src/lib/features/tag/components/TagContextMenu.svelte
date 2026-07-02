<script lang="ts">
  import { ContextMenu, MenuItem, MenuDivider } from '@/components/ui/menu';
  import { hiddenTags } from '../stores/tag';

  export let visible = false;
  export let tagName: string | null = null;
  export let x = 0;
  export let y = 0;

  export let onRename: (name: string) => void;
  export let onMerge: (name: string) => void;
  export let onCreatePage: (name: string) => void;
  export let onRandomNote: (name: string) => void;
  export let onHide: (name: string) => void;
  export let onUnhide: (name: string) => void;

  function handleClose() {
    visible = false;
  }
</script>

{#if tagName}
  <ContextMenu {x} {y} show={visible} onClose={handleClose}>
    <MenuItem icon="edit-2" label="Rename tag" on:click={() => onRename(tagName)} />
    <MenuItem icon="git-merge" label="Merge into…" on:click={() => onMerge(tagName)} />
    <MenuDivider />
    <MenuItem icon="file-plus" label="Create tag page" on:click={() => onCreatePage(tagName)} />
    <MenuItem icon="shuffle" label="Random note with tag" on:click={() => onRandomNote(tagName)} />
    <MenuDivider />
    {#if $hiddenTags.has(tagName)}
      <MenuItem icon="eye" label="Show in graph" on:click={() => onUnhide(tagName)} />
    {:else}
      <MenuItem icon="eye-off" label="Hide from graph" on:click={() => onHide(tagName)} />
    {/if}
  </ContextMenu>
{/if}
