<script lang="ts">
  import {
    currentCanvas,
    selectedElements,
    selectElement,
    clearSelection,
  } from '@/features/canvas/stores';
  import { updateElement } from '@/features/canvas/stores';
  import {
    buildLayerTree,
    flattenTree,
    elementLabel,
    elementIcon,
    type LayerNode,
  } from '@/features/canvas/utils/layerTree';

  let collapsedIds: Set<string> = new Set();
  let editingId: string | null = null;
  let editValue = '';

  $: tree = buildLayerTree($currentCanvas?.elements ?? []);
  $: visibleNodes = flattenTree(tree, collapsedIds);

  function toggle(id: string) {
    const next = new Set(collapsedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    collapsedIds = next;
  }

  function pick(id: string, e: MouseEvent) {
    if (!e.shiftKey && !e.metaKey) clearSelection();
    selectElement(id);
  }

  function flipVisibility(id: string) {
    const el = $currentCanvas?.elements.find((e) => e.id === id);
    if (el) updateElement({ ...el, visible: !el.visible });
  }

  function beginEdit(node: LayerNode) {
    editingId = node.el.id;
    editValue = elementLabel(node.el);
  }

  function commitEdit() {
    if (editingId && editValue.trim()) {
      const el = $currentCanvas?.elements.find((e) => e.id === editingId);
      if (el) updateElement({ ...el, name: editValue.trim() });
    }
    editingId = null;
  }
</script>

<section class="ltree">
  <header class="ltree__head"><span>Layers</span></header>
  <ol class="ltree__list" role="tree">
    {#each visibleNodes as node (node.el.id)}
      {@const sel = $selectedElements.includes(node.el.id)}
      {@const hasKids = node.children.length > 0}
      <li
        class="ltree__row"
        class:ltree__row--sel={sel}
        class:ltree__row--dim={!node.el.visible}
        style="--indent:{node.depth}"
        role="treeitem"
        aria-selected={sel}
      >
        <span class="ltree__indent" style="width:{node.depth * 14}px"></span>

        {#if hasKids}
          <button
            class="ltree__chevron"
            class:ltree__chevron--open={!collapsedIds.has(node.el.id)}
            on:click={() => toggle(node.el.id)}
            aria-label="Toggle">&#9656;</button
          >
        {:else}
          <span class="ltree__chevron ltree__chevron--leaf"></span>
        {/if}

        <span class="ltree__icon">{elementIcon(node.el.element_type)}</span>

        {#if editingId === node.el.id}
          <input
            class="ltree__edit"
            bind:value={editValue}
            on:blur={commitEdit}
            on:keydown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') editingId = null;
            }}
          />
        {:else}
          <button
            class="ltree__name"
            on:click={(e) => pick(node.el.id, e)}
            on:dblclick={() => beginEdit(node)}>{elementLabel(node.el)}</button
          >
        {/if}

        <button
          class="ltree__vis"
          on:click={() => flipVisibility(node.el.id)}
          title={node.el.visible ? 'Hide' : 'Show'}
        >
          {node.el.visible ? '\u25C9' : '\u25CB'}
        </button>
      </li>
    {/each}
    {#if visibleNodes.length === 0}
      <li class="ltree__empty">No elements yet</li>
    {/if}
  </ol>
</section>

<style>
  .ltree {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--border-color);
  }
  .ltree__head {
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
  }
  .ltree__list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    max-height: 280px;
  }
  .ltree__row {
    display: flex;
    align-items: center;
    height: 26px;
    padding-right: 6px;
    gap: 2px;
    transition: background 0.1s;
  }
  .ltree__row:hover {
    background: var(--background-modifier-hover);
  }
  .ltree__row--sel {
    background: var(--interactive-accent) !important;
    color: var(--text-on-accent);
  }
  .ltree__row--sel .ltree__name,
  .ltree__row--sel .ltree__icon {
    color: inherit;
  }
  .ltree__row--dim {
    opacity: 0.45;
  }
  .ltree__indent {
    flex-shrink: 0;
  }
  .ltree__chevron {
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 9px;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.12s;
  }
  .ltree__chevron--open {
    transform: rotate(90deg);
  }
  .ltree__chevron--leaf {
    visibility: hidden;
  }
  .ltree__icon {
    width: 14px;
    text-align: center;
    font-size: 10px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .ltree__name {
    flex: 1;
    background: none;
    border: none;
    padding: 0;
    font-size: 11px;
    color: var(--text-normal);
    text-align: left;
    cursor: default;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ltree__edit {
    flex: 1;
    font-size: 11px;
    padding: 1px 4px;
    border: 1px solid var(--interactive-accent);
    border-radius: 2px;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
    outline: none;
  }
  .ltree__vis {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 10px;
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.1s;
  }
  .ltree__row:hover .ltree__vis {
    opacity: 1;
  }
  .ltree__empty {
    padding: 16px;
    text-align: center;
    font-size: 11px;
    color: var(--text-faint);
  }
</style>
