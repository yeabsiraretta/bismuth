<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let title: string;
  export let score: number;
  export let pinned = false;
  export let showPin = true;
  export let iconName = 'file-text';

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{
    click: void;
    pin: void;
    dragstart: DragEvent;
  }>();
</script>

<div
  class="connection-item"
  class:pinned
  role="button"
  tabindex="0"
  draggable="true"
  on:click={() => dispatch('click')}
  on:keydown={(e) => e.key === 'Enter' && dispatch('click')}
  on:dragstart={(e) => dispatch('dragstart', e)}
>
  <div class="connection-header">
    <Icon name={pinned ? 'pin' : iconName} size={pinned ? 12 : 14} />
    <span class="connection-title">{title}</span>
    {#if showPin}
      <button
        class="pin-btn"
        on:click|stopPropagation={() => dispatch('pin')}
        title={pinned ? 'Unpin' : 'Pin'}
      >
        <Icon name={pinned ? 'x' : 'pin'} size={10} />
      </button>
    {/if}
  </div>
  <div class="connection-score">
    <div class="score-bar" style:width="{score * 100}%"></div>
    <span class="score-text">{Math.round(score * 100)}%</span>
  </div>
</div>

<style>
  .connection-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-s);
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .connection-item:hover {
    background-color: var(--interactive-hover);
    border-color: var(--interactive-accent);
  }

  .connection-item.pinned {
    border-color: var(--interactive-accent);
    background-color: var(--background-secondary-alt, var(--background-secondary));
  }

  .connection-item[draggable='true'] {
    cursor: grab;
  }

  .connection-item[draggable='true']:active {
    cursor: grabbing;
  }

  .connection-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .connection-title {
    flex: 1;
    font-size: var(--font-ui-small);
    font-weight: 500;
    color: var(--text-normal);
  }

  .connection-score {
    position: relative;
    height: 4px;
    background-color: var(--background-secondary);
    border-radius: 2px;
    overflow: hidden;
  }

  .score-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: var(--interactive-accent);
    transition: width 0.3s ease;
  }

  .score-text {
    position: absolute;
    top: -18px;
    right: 0;
    font-size: 10px;
    color: var(--text-faint);
  }

  .pin-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s ease;
    margin-left: auto;
  }

  .connection-item:hover .pin-btn {
    opacity: 1;
  }

  .pin-btn:hover {
    color: var(--interactive-accent);
    background-color: var(--interactive-hover);
  }
</style>
