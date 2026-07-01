<script lang="ts">
  import type { Scene } from '../types';

  export let scenes: Scene[] = [];
  export let activeScene: Scene | null = null;
  export let onSelect: (scene: Scene) => void = () => {};
</script>

<div class="scene-list">
  {#each scenes as scene (scene.path)}
    <button
      class="scene-item"
      class:active={activeScene?.path === scene.path}
      on:click={() => onSelect(scene)}
    >
      <span class="scene-order">{scene.order + 1}.</span>
      <span class="scene-title">{scene.title}</span>
      <span class="scene-words">{scene.word_count}</span>
    </button>
    {#if scene.children.length > 0}
      <div class="scene-children">
        <svelte:self scenes={scene.children} {activeScene} {onSelect} />
      </div>
    {/if}
  {/each}
</div>

<style>
  .scene-list { display: flex; flex-direction: column; gap: 1px; }
  .scene-item { display: flex; align-items: center; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-sm); border: none; background: none; cursor: pointer; border-radius: var(--radius-sm); text-align: left; width: 100%; }
  .scene-item:hover { background: var(--bg-hover); }
  .scene-item.active { background: var(--bg-active); }
  .scene-order { color: var(--text-muted); font-size: var(--font-size-sm); min-width: 1.5em; }
  .scene-title { flex: 1; }
  .scene-words { font-size: var(--font-size-sm); color: var(--text-muted); }
  .scene-children { padding-left: var(--spacing-md); }
</style>
