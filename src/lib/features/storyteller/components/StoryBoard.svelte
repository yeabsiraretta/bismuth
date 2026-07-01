<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { allEntities } from '../stores/entityStore';
  import { activeStoryId } from '../stores/storyStore';
  import { editEntity } from '../stores/entityStore';
  import type { SceneEntity, SceneStatus } from '../types/entity';

  const STATUS_COLUMNS: { status: SceneStatus; label: string; color: string }[] = [
    { status: 'outline', label: 'Outline', color: '#6b7280' },
    { status: 'draft', label: 'Draft', color: '#3b82f6' },
    { status: 'revision', label: 'Revision', color: '#f59e0b' },
    { status: 'final', label: 'Final', color: '#10b981' },
    { status: 'cut', label: 'Cut', color: '#ef4444' },
  ];

  $: scenes = ($allEntities.filter(e => e.storyId === $activeStoryId && e.type === 'scene') as unknown as SceneEntity[]);
  $: scenesByStatus = STATUS_COLUMNS.map(col => ({
    ...col,
    scenes: scenes.filter(s => (s.status ?? 'outline') === col.status),
  }));
  $: totalWords = scenes.reduce((sum, s) => sum + (s.wordCount ?? 0), 0);

  function moveScene(sceneId: string, newStatus: SceneStatus) {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    editEntity({ ...scene, status: newStatus } as unknown as import('../types/entity').StorytellerEntity);
  }

  let dragId: string | null = null;

  function handleDragStart(id: string) { dragId = id; }

  function handleDrop(status: SceneStatus) {
    if (dragId) { moveScene(dragId, status); dragId = null; }
  }
</script>

<div class="sb-board">
  <div class="sb-header">
    <h3>Story Board</h3>
    <div class="sb-stats">
      <span>{scenes.length} scenes</span>
      <span>{totalWords.toLocaleString()} words</span>
    </div>
  </div>

  <div class="sb-columns">
    {#each scenesByStatus as col (col.status)}
      <div class="sb-column" role="listbox" aria-label="{col.label} column"
        on:dragover|preventDefault
        on:drop|preventDefault={() => handleDrop(col.status)}>
        <div class="sb-col-header" style="border-color: {col.color}">
          <span class="sb-col-title">{col.label}</span>
          <span class="sb-col-count">{col.scenes.length}</span>
        </div>
        <div class="sb-col-body">
          {#each col.scenes as scene (scene.id)}
            <div class="sb-card" role="option" aria-selected="false" draggable="true" on:dragstart={() => handleDragStart(scene.id)}>
              <div class="sb-card-title">{scene.name}</div>
              {#if scene.pov}
                <div class="sb-card-pov"><Icon name="user" size={10} /> {scene.pov}</div>
              {/if}
              {#if scene.wordCount}
                <div class="sb-card-words">{scene.wordCount.toLocaleString()} words</div>
              {/if}
              {#if scene.synopsis}
                <div class="sb-card-synopsis">{scene.synopsis.slice(0, 80)}{scene.synopsis.length > 80 ? '…' : ''}</div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if scenes.length === 0}
    <div class="sb-empty">
      <Icon name="layout" size={28} />
      <p>Create scene entities in the Entity panel to populate the story board.</p>
    </div>
  {/if}
</div>

<style>
  .sb-board { display: flex; flex-direction: column; height: 100%; }
  .sb-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .sb-header h3 { margin: 0; font-size: 14px; }
  .sb-stats { display: flex; gap: 12px; font-size: 11px; opacity: 0.6; }
  .sb-columns { display: flex; flex: 1; gap: 8px; padding: 10px; overflow-x: auto; }
  .sb-column { flex: 1; min-width: 160px; display: flex; flex-direction: column; background: var(--background-secondary, #252525); border-radius: 6px; overflow: hidden; }
  .sb-col-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-top: 3px solid; font-size: 12px; font-weight: 600; }
  .sb-col-count { font-size: 10px; font-weight: 400; opacity: 0.5; background: var(--background-modifier-border, #444); padding: 1px 6px; border-radius: 8px; }
  .sb-col-body { flex: 1; padding: 6px; display: flex; flex-direction: column; gap: 6px; overflow-y: auto; }
  .sb-card { padding: 8px 10px; border: 1px solid var(--background-modifier-border, #3a3a3a); border-radius: 5px; background: var(--background-primary, #1e1e1e); cursor: grab; }
  .sb-card:hover { border-color: var(--interactive-accent, #7c3aed); }
  .sb-card:active { cursor: grabbing; opacity: 0.8; }
  .sb-card-title { font-size: 12px; font-weight: 500; margin-bottom: 4px; }
  .sb-card-pov { display: flex; align-items: center; gap: 3px; font-size: 10px; opacity: 0.6; }
  .sb-card-words { font-size: 10px; opacity: 0.5; }
  .sb-card-synopsis { font-size: 10px; opacity: 0.6; margin-top: 4px; line-height: 1.4; }
  .sb-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; opacity: 0.4; gap: 8px; padding: 20px; text-align: center; font-size: 12px; }
</style>
