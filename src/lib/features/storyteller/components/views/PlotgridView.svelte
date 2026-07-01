<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { storyPlotlines, plotgridCells, setPlotgridCell, addPlotline, removePlotline } from '../../stores/plotlineStore';
  import { filteredEntities } from '../../stores/entityStore';
  import { getPlotgridCellKey } from '../../services/plotlineService';
  import type { SceneEntity } from '../../types/entity';

  let editingCellKey: string | null = null;
  let editText = '';
  let newPlotlineName = '';

  $: scenes = ($filteredEntities.filter(e => e.type === 'scene') as unknown as SceneEntity[]);

  function startEdit(key: string, current: string) {
    editingCellKey = key;
    editText = current;
  }

  function saveEdit(sceneId: string, plotlineId: string) {
    if (editingCellKey) {
      setPlotgridCell(sceneId, plotlineId, {
        sceneId, plotlineId, text: editText, color: null, linkedNoteId: null,
      });
      editingCellKey = null;
    }
  }

  function handleAddPlotline() {
    if (!newPlotlineName.trim()) return;
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    addPlotline(newPlotlineName.trim(), colors[$storyPlotlines.length % colors.length]);
    newPlotlineName = '';
  }

  function getCellText(sceneId: string, plotlineId: string): string {
    return $plotgridCells[getPlotgridCellKey(sceneId, plotlineId)]?.text ?? '';
  }

  const STATUS_COLORS: Record<string, string> = {
    outline: '#6b7280', draft: '#3b82f6', revision: '#f59e0b', final: '#10b981', cut: '#ef4444',
  };
</script>

<div class="pg-view">
  <div class="pg-header">
    <h3>Plot Grid</h3>
    <div class="pg-add">
      <input class="pg-input" bind:value={newPlotlineName} placeholder="Add plotline…" on:keydown={(e) => e.key === 'Enter' && handleAddPlotline()} />
      <button class="pg-btn" on:click={handleAddPlotline}><Icon name="plus" size={13} /></button>
    </div>
  </div>

  <div class="pg-grid-wrap">
    {#if $storyPlotlines.length > 0 && scenes.length > 0}
      <table class="pg-table">
        <thead>
          <tr>
            <th class="pg-corner">Scene</th>
            {#each $storyPlotlines as pl (pl.id)}
              <th class="pg-col-header" style="border-bottom: 3px solid {pl.color}">
                <span>{pl.name}</span>
                <button class="pg-col-delete" on:click={() => removePlotline(pl.id)} title="Remove">
                  <Icon name="x" size={10} />
                </button>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each scenes as scene (scene.id)}
            <tr>
              <td class="pg-row-header">
                <span class="pg-status-dot" style="background: {STATUS_COLORS[scene.status] ?? '#666'}"></span>
                <span class="pg-scene-name">{scene.name}</span>
              </td>
              {#each $storyPlotlines as pl (pl.id)}
                {@const key = getPlotgridCellKey(scene.id, pl.id)}
                {@const text = getCellText(scene.id, pl.id)}
                <td class="pg-cell" on:dblclick={() => startEdit(key, text)}>
                  {#if editingCellKey === key}
                    <textarea class="pg-cell-edit" bind:value={editText} on:blur={() => saveEdit(scene.id, pl.id)} on:keydown={(e) => e.key === 'Escape' && (editingCellKey = null)}></textarea>
                  {:else}
                    <span class="pg-cell-text">{text || ''}</span>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <div class="pg-empty">
        {#if $storyPlotlines.length === 0}
          <p>Add plotlines above to create your grid columns.</p>
        {:else}
          <p>Create scene entities to populate the grid rows.</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .pg-view { display: flex; flex-direction: column; height: 100%; }
  .pg-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .pg-header h3 { margin: 0; font-size: 14px; }
  .pg-add { display: flex; gap: 4px; }
  .pg-input { padding: 4px 8px; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; background: var(--background-primary); color: var(--text-normal); font-size: 12px; width: 130px; }
  .pg-btn { border: none; background: none; color: var(--text-normal); cursor: pointer; padding: 4px; }
  .pg-grid-wrap { flex: 1; overflow: auto; }
  .pg-table { border-collapse: collapse; width: 100%; min-width: 500px; }
  .pg-corner { position: sticky; left: 0; top: 0; z-index: 2; background: var(--background-secondary, #252525); padding: 8px; font-size: 12px; text-align: left; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .pg-col-header { position: sticky; top: 0; z-index: 1; background: var(--background-secondary, #252525); padding: 6px 10px; font-size: 12px; text-align: center; white-space: nowrap; }
  .pg-col-delete { border: none; background: none; color: var(--text-muted); cursor: pointer; opacity: 0; margin-left: 4px; }
  .pg-col-header:hover .pg-col-delete { opacity: 1; }
  .pg-row-header { position: sticky; left: 0; background: var(--background-secondary, #252525); padding: 6px 10px; font-size: 12px; white-space: nowrap; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--background-modifier-border, #2a2a2a); z-index: 1; }
  .pg-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .pg-scene-name { overflow: hidden; text-overflow: ellipsis; }
  .pg-cell { padding: 4px; border: 1px solid var(--background-modifier-border, #2a2a2a); min-width: 120px; min-height: 36px; cursor: pointer; vertical-align: top; }
  .pg-cell:hover { background: var(--background-modifier-hover, #2a2a2a); }
  .pg-cell-text { font-size: 11px; white-space: pre-wrap; word-break: break-word; }
  .pg-cell-edit { width: 100%; min-height: 60px; padding: 4px; border: 1px solid var(--interactive-accent, #7c3aed); border-radius: 3px; background: var(--background-primary); color: var(--text-normal); font-size: 11px; resize: vertical; }
  .pg-empty { text-align: center; padding: 40px; opacity: 0.5; font-size: 12px; }
</style>
