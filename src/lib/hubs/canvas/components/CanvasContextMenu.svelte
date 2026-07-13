<script lang="ts">
  import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';
  import {
    createCard,
    createRect,
    createEllipse,
    createLine,
    createText,
    createNote,
  } from '@/hubs/canvas/types/canvas-types';
  import {
    addElement,
    copySelected,
    cutSelected,
    deleteElements,
    duplicateSelected,
    getSelectedElements,
    hasClipboard,
    pasteClipboard,
    reorderElement,
    selectElement,
    updateElement,
  } from '@/hubs/canvas/stores/canvas-store.svelte';

  let {
    x,
    y,
    worldX,
    worldY,
    targetEl = null,
    onclose,
  }: {
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    targetEl: CanvasElement | null;
    onclose: () => void;
  } = $props();

  let selected = $derived(getSelectedElements());
  let hasClip = $derived(hasClipboard());

  function close() {
    onclose();
  }

  function act(fn: () => void) {
    fn();
    close();
  }

  function addNewElement(kind: string) {
    let el: CanvasElement;
    switch (kind) {
      case 'card':
        el = createCard({ x: worldX, y: worldY, width: 180, height: 120 });
        break;
      case 'note':
        el = createNote({ x: worldX, y: worldY, width: 180, height: 120 });
        break;
      case 'rect':
        el = createRect({ x: worldX, y: worldY, width: 120, height: 80 });
        break;
      case 'ellipse':
        el = createEllipse({ x: worldX, y: worldY, width: 100, height: 100 });
        break;
      case 'line':
        el = createLine({ x: worldX, y: worldY, x2: worldX + 120, y2: worldY });
        break;
      case 'text':
        el = createText({ x: worldX, y: worldY, width: 120, height: 30 });
        break;
      default:
        return;
    }
    addElement(el);
    selectElement(el.id);
    close();
  }
</script>

<svelte:window
  onclick={close}
  onkeydown={(e) => {
    if (e.key === 'Escape') close();
  }}
/>

<div class="ctx-menu" style="left: {x}px; top: {y}px" role="menu">
  {#if targetEl}
    <button class="ctx-item" role="menuitem" onclick={() => act(cutSelected)}>Cut</button>
    <button class="ctx-item" role="menuitem" onclick={() => act(copySelected)}>Copy</button>
    <button
      class="ctx-item"
      role="menuitem"
      onclick={() => act(() => pasteClipboard())}
      disabled={!hasClip}>Paste</button
    >
    <button class="ctx-item" role="menuitem" onclick={() => act(() => duplicateSelected())}
      >Duplicate</button
    >
    <hr class="ctx-sep" />
    <button
      class="ctx-item"
      role="menuitem"
      onclick={() => act(() => reorderElement(targetEl.id, 'front'))}>Bring to Front</button
    >
    <button
      class="ctx-item"
      role="menuitem"
      onclick={() => act(() => reorderElement(targetEl.id, 'forward'))}>Bring Forward</button
    >
    <button
      class="ctx-item"
      role="menuitem"
      onclick={() => act(() => reorderElement(targetEl.id, 'backward'))}>Send Backward</button
    >
    <button
      class="ctx-item"
      role="menuitem"
      onclick={() => act(() => reorderElement(targetEl.id, 'back'))}>Send to Back</button
    >
    <hr class="ctx-sep" />
    <button
      class="ctx-item"
      role="menuitem"
      onclick={() =>
        act(() =>
          updateElement(targetEl.id, { locked: !targetEl.locked } as Partial<CanvasElement>)
        )}
    >
      {targetEl.locked ? 'Unlock' : 'Lock'}
    </button>
    <hr class="ctx-sep" />
    <button
      class="ctx-item danger"
      role="menuitem"
      onclick={() => act(() => deleteElements(selected.map((e) => e.id)))}>Delete</button
    >
  {:else}
    <button
      class="ctx-item"
      role="menuitem"
      onclick={() => act(() => pasteClipboard())}
      disabled={!hasClip}>Paste</button
    >
    <hr class="ctx-sep" />
    <span class="ctx-heading">Add</span>
    <button class="ctx-item" role="menuitem" onclick={() => addNewElement('card')}>Card</button>
    <button class="ctx-item" role="menuitem" onclick={() => addNewElement('note')}
      >Sticky Note</button
    >
    <button class="ctx-item" role="menuitem" onclick={() => addNewElement('rect')}>Rectangle</button
    >
    <button class="ctx-item" role="menuitem" onclick={() => addNewElement('ellipse')}
      >Ellipse</button
    >
    <button class="ctx-item" role="menuitem" onclick={() => addNewElement('line')}>Line</button>
    <button class="ctx-item" role="menuitem" onclick={() => addNewElement('text')}>Text</button>
  {/if}
</div>

<style>
  .ctx-menu {
    position: fixed;
    z-index: var(--z-context-menu, 700);
    min-width: 160px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-m);
    padding: 4px 0;
    font-size: 0.75rem;
  }
  .ctx-item {
    display: block;
    width: 100%;
    padding: 5px 14px;
    text-align: left;
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
  }
  .ctx-item:hover:not(:disabled) {
    background: var(--color-surface-hover);
  }
  .ctx-item:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .ctx-item.danger {
    color: var(--color-error);
  }
  .ctx-sep {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 3px 0;
  }
  .ctx-heading {
    display: block;
    padding: 3px 14px;
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }
</style>
