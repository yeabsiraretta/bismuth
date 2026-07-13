<script lang="ts">
  import { flattenScenes, formatNumber } from '@/hubs/creative/services/writing-service';
  import {
    addGroup,
    addScene,
    advanceSceneStatus,
    nestSceneInGroup,
    openSceneNote,
    removeSceneById,
    sortScenesBy,
    unnestScene,
  } from '@/hubs/creative/stores/writing-store.svelte';
  import type { SceneNode, SceneStatus } from '@/hubs/creative/types/writing-types';
  import {
    BUILTIN_SCENE_TEMPLATES,
    SCENE_STATUS_LABELS,
  } from '@/hubs/creative/types/writing-types';
  import BIcon from '@/ui/b-icon.svelte';

  interface Props {
    scenes: SceneNode[];
    statusColor: (status: SceneStatus) => string;
  }

  let { scenes, statusColor }: Props = $props();

  let newSceneTitle = $state('');
  let newGroupTitle = $state('');
  let showNewScene = $state(false);
  let showNewGroup = $state(false);
  let addingToGroup = $state<string | null>(null);
  let addToGroupTitle = $state('');
  let addToGroupTemplate = $state(0);
  let selectedTemplate = $state(0);

  let flatScenes = $derived(flattenScenes(scenes));

  function handleAddScene() {
    if (!newSceneTitle.trim()) return;
    addScene(newSceneTitle.trim(), BUILTIN_SCENE_TEMPLATES[selectedTemplate]);
    newSceneTitle = '';
    showNewScene = false;
  }

  function handleAddSceneToGroup() {
    if (!addToGroupTitle.trim() || !addingToGroup) return;
    addScene(addToGroupTitle.trim(), BUILTIN_SCENE_TEMPLATES[addToGroupTemplate], addingToGroup);
    addToGroupTitle = '';
    addingToGroup = null;
  }

  function handleAddGroup() {
    if (!newGroupTitle.trim()) return;
    addGroup(newGroupTitle.trim());
    newGroupTitle = '';
    showNewGroup = false;
  }
</script>

<div class="wr-section">
  <div class="wr-section-header">
    <h2 class="wr-section-title">Scenes ({scenes.length})</h2>
    <div class="wr-actions">
      <button
        class="wr-btn wr-btn-sm"
        onclick={() => {
          showNewScene = true;
        }}>+ Scene</button
      >
      <button
        class="wr-btn wr-btn-sm"
        onclick={() => {
          showNewGroup = true;
        }}>+ Chapter</button
      >
      <button class="wr-btn wr-btn-ghost" onclick={() => sortScenesBy('status')}>Sort</button>
    </div>
  </div>

  {#if showNewScene}
    <div class="wr-form">
      <input
        type="text"
        bind:value={newSceneTitle}
        placeholder="Scene title…"
        class="wr-input"
        onkeydown={(e) => {
          if (e.key === 'Enter') handleAddScene();
          if (e.key === 'Escape') showNewScene = false;
        }}
      />
      <select class="wr-select wr-select-sm" bind:value={selectedTemplate}>
        {#each BUILTIN_SCENE_TEMPLATES as t, i (t.name)}
          <option value={i}>{t.name}</option>
        {/each}
      </select>
      <button class="wr-btn wr-btn-sm" onclick={handleAddScene}>Add</button>
      <button
        class="wr-btn wr-btn-ghost"
        onclick={() => {
          showNewScene = false;
        }}>Cancel</button
      >
    </div>
  {/if}

  {#if showNewGroup}
    <div class="wr-form">
      <input
        type="text"
        bind:value={newGroupTitle}
        placeholder="Chapter title…"
        class="wr-input"
        onkeydown={(e) => {
          if (e.key === 'Enter') handleAddGroup();
          if (e.key === 'Escape') showNewGroup = false;
        }}
      />
      <button class="wr-btn wr-btn-sm" onclick={handleAddGroup}>Add</button>
      <button
        class="wr-btn wr-btn-ghost"
        onclick={() => {
          showNewGroup = false;
        }}>Cancel</button
      >
    </div>
  {/if}

  {#if scenes.length === 0}
    <div class="wr-empty">No scenes yet. Add your first scene or chapter above.</div>
  {:else}
    <div class="wr-scene-list">
      {#each flatScenes as scene (scene.id)}
        <div
          class="wr-scene-row"
          class:wr-group={scene.type === 'group'}
          style="padding-left: {scene.indent * 20 + 12}px"
        >
          <span
            class="wr-scene-status"
            style="background: {statusColor(scene.status)}"
            title={SCENE_STATUS_LABELS[scene.status]}
          ></span>
          {#if scene.type === 'file'}
            <button class="wr-scene-title wr-scene-link" onclick={() => openSceneNote(scene.id)}
              >{scene.title}</button
            >
          {:else}
            <span class="wr-scene-title">{scene.title}</span>
          {/if}
          {#if scene.type === 'group'}
            <span class="wr-scene-child-count">{scene.children.length}</span>
          {/if}
          {#if scene.tags.length > 0}
            <span class="wr-scene-tags">{scene.tags.join(', ')}</span>
          {/if}
          <span class="wr-scene-wc">{formatNumber(scene.wordCount)}w</span>
          <button
            class="wr-btn-icon"
            title="Advance status"
            onclick={() => advanceSceneStatus(scene.id)}
          >
            <BIcon name="chevronRight" size={12} />
          </button>
          {#if scene.type === 'group'}
            <button
              class="wr-btn-icon"
              title="Add scene to this chapter"
              onclick={() => {
                addingToGroup = scene.id;
                addToGroupTitle = '';
              }}
            >
              <BIcon name="plus" size={12} />
            </button>
          {/if}
          {#if scene.indent > 0}
            <button
              class="wr-btn-icon"
              title="Move to root level"
              onclick={() => unnestScene(scene.id)}
            >
              <BIcon name="chevronLeft" size={12} />
            </button>
          {/if}
          {#if scene.type === 'file' && scene.indent === 0}
            {@const groups = flatScenes.filter((s) => s.type === 'group')}
            {#if groups.length > 0}
              <select
                class="wr-nest-select"
                title="Move into chapter"
                onchange={(e) => {
                  const v = (e.target as HTMLSelectElement).value;
                  if (v) {
                    nestSceneInGroup(scene.id, v);
                    (e.target as HTMLSelectElement).value = '';
                  }
                }}
              >
                <option value="">Move to…</option>
                {#each groups as g (g.id)}
                  <option value={g.id}>{g.title}</option>
                {/each}
              </select>
            {/if}
          {/if}
          <button
            class="wr-btn-icon wr-btn-danger-icon"
            title="Remove"
            onclick={() => removeSceneById(scene.id)}
          >
            <BIcon name="x" size={12} />
          </button>
        </div>
        {#if addingToGroup === scene.id}
          <div class="wr-form" style="padding-left: {(scene.indent + 1) * 20 + 12}px">
            <input
              type="text"
              bind:value={addToGroupTitle}
              placeholder="Scene title…"
              class="wr-input"
              onkeydown={(e) => {
                if (e.key === 'Enter') handleAddSceneToGroup();
                if (e.key === 'Escape') addingToGroup = null;
              }}
            />
            <select class="wr-select wr-select-sm" bind:value={addToGroupTemplate}>
              {#each BUILTIN_SCENE_TEMPLATES as t, ti (t.name)}
                <option value={ti}>{t.name}</option>
              {/each}
            </select>
            <button class="wr-btn wr-btn-sm" onclick={handleAddSceneToGroup}>Add</button>
            <button
              class="wr-btn wr-btn-ghost"
              onclick={() => {
                addingToGroup = null;
              }}>Cancel</button
            >
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .wr-section {
    margin-bottom: 24px;
  }
  .wr-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .wr-section-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
  .wr-actions {
    display: flex;
    gap: 4px;
  }
  .wr-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.72rem;
    cursor: pointer;
    transition: all var(--transition-base);
  }
  .wr-btn:hover {
    border-color: var(--color-accent);
  }
  .wr-btn-sm {
    padding: 4px 8px;
    font-size: 0.68rem;
  }
  .wr-btn-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--color-text-muted);
  }
  .wr-btn-ghost:hover {
    color: var(--color-text);
  }
  .wr-btn-icon {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-s);
  }
  .wr-btn-icon:hover {
    color: var(--color-text);
    background: var(--color-surface);
  }
  .wr-btn-danger-icon:hover {
    color: var(--color-error);
  }
  .wr-form {
    display: flex;
    gap: 6px;
    align-items: center;
    margin: 8px 0;
    padding: 8px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
  }
  .wr-input {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.72rem;
    font-family: inherit;
  }
  .wr-select {
    padding: 4px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.72rem;
  }
  .wr-select-sm {
    width: auto;
  }
  .wr-scene-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .wr-scene-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    transition: all var(--transition-fast);
  }
  .wr-scene-row:hover {
    border-color: var(--color-accent);
  }
  .wr-scene-row.wr-group {
    background: var(--color-background);
    font-weight: 600;
  }
  .wr-scene-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .wr-scene-title {
    flex: 1;
    font-size: 0.78rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wr-scene-link {
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: var(--color-accent);
    padding: 0;
  }
  .wr-scene-link:hover {
    text-decoration: underline;
  }
  .wr-scene-tags {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
  .wr-scene-wc {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    min-width: 36px;
    text-align: right;
    flex-shrink: 0;
  }
  .wr-scene-child-count {
    font-size: 0.58rem;
    color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
    padding: 1px 5px;
    border-radius: var(--radius-full);
    font-weight: 600;
    flex-shrink: 0;
  }
  .wr-nest-select {
    font-size: 0.6rem;
    padding: 1px 4px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text-muted);
    cursor: pointer;
    max-width: 80px;
  }
  .wr-empty {
    text-align: center;
    padding: 32px;
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }
</style>
