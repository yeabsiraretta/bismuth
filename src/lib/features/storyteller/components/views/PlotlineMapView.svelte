<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { storyPlotlines, removePlotline, removeSceneFromPlotline } from '../../stores/plotlineStore';
  import { filteredEntities } from '../../stores/entityStore';
  import { buildSubwayMap } from '../../services/plotlineService';
  import type { SceneEntity } from '../../types/entity';

  let viewMode: 'subway' | 'list' = 'subway';
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let dragStart = { x: 0, y: 0 };

  $: scenes = ($filteredEntities.filter(e => e.type === 'scene') as unknown as SceneEntity[]);
  $: lanes = buildSubwayMap($storyPlotlines, $filteredEntities);
  $: svgWidth = Math.max(600, (scenes.length + 1) * 120);

  function startPan(e: MouseEvent) {
    dragging = true;
    dragStart = { x: e.clientX - panX, y: e.clientY - panY };
  }
  function onPan(e: MouseEvent) {
    if (dragging) { panX = e.clientX - dragStart.x; panY = e.clientY - dragStart.y; }
  }
  function endPan() { dragging = false; }
</script>

<div class="pm-view">
  <div class="pm-header">
    <h3>Plotlines</h3>
    <div class="pm-toggle">
      <button class:active={viewMode === 'subway'} on:click={() => { viewMode = 'subway'; }}>Subway</button>
      <button class:active={viewMode === 'list'} on:click={() => { viewMode = 'list'; }}>List</button>
    </div>
  </div>

  {#if viewMode === 'subway'}
    <div class="pm-subway" on:mousedown={startPan} on:mousemove={onPan} on:mouseup={endPan} on:mouseleave={endPan} role="application" aria-label="Plotline subway map">
      <svg width={svgWidth} height={lanes.length * 50 + 40} style="transform: translate({panX}px, {panY}px)">
        {#each lanes as lane, i (lane.plotlineId)}
          {@const y = i * 50 + 30}
          <line x1="20" y1={y} x2={svgWidth - 20} y2={y} stroke={lane.color} stroke-width="4" stroke-linecap="round" opacity="0.3" />
          {#each lane.stops as stop, j (stop.sceneId)}
            <circle cx={stop.x} cy={y} r="8" fill={lane.color} />
            <text x={stop.x} y={y + 22} text-anchor="middle" font-size="9" fill="var(--text-muted, #aaa)">{stop.sceneName.slice(0, 12)}</text>
            {#if j > 0}
              {@const prev = lane.stops[j - 1]}
              <line x1={prev.x} y1={y} x2={stop.x} y2={y} stroke={lane.color} stroke-width="3" />
            {/if}
          {/each}
          <text x="10" y={y + 4} font-size="10" fill={lane.color} font-weight="600" text-anchor="end" transform="translate(-8, 0)">{lane.plotlineName.slice(0, 15)}</text>
        {/each}
      </svg>
    </div>
  {:else}
    <div class="pm-list">
      {#each $storyPlotlines as pl (pl.id)}
        <div class="pm-plotline">
          <div class="pm-pl-header">
            <span class="pm-pl-dot" style="background: {pl.color}"></span>
            <span class="pm-pl-name">{pl.name}</span>
            <span class="pm-pl-count">{pl.sceneIds.length} scenes</span>
            <button class="pm-pl-delete" on:click={() => removePlotline(pl.id)} title="Remove">
              <Icon name="x" size={12} />
            </button>
          </div>
          <div class="pm-pl-scenes">
            {#each pl.sceneIds as sceneId}
              {@const scene = scenes.find(s => s.id === sceneId)}
              {#if scene}
                <div class="pm-scene-pill">
                  <span>{scene.name}</span>
                  <button class="pm-pill-x" on:click={() => removeSceneFromPlotline(pl.id, sceneId)}>×</button>
                </div>
              {/if}
            {/each}
            {#if pl.sceneIds.length === 0}
              <span class="pm-pl-empty">No scenes assigned</span>
            {/if}
          </div>
        </div>
      {/each}
      {#if $storyPlotlines.length === 0}
        <div class="pm-empty"><Icon name="git-branch" size={24} /><p>No plotlines. Create one from the Plot Grid or command palette.</p></div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .pm-view { display: flex; flex-direction: column; height: 100%; }
  .pm-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .pm-header h3 { margin: 0; font-size: 14px; }
  .pm-toggle { display: flex; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; overflow: hidden; }
  .pm-toggle button { padding: 3px 10px; border: none; background: none; color: var(--text-muted); cursor: pointer; font-size: 11px; }
  .pm-toggle button.active { background: var(--interactive-accent, #7c3aed); color: #fff; }
  .pm-subway { flex: 1; overflow: hidden; cursor: grab; background: var(--background-primary); }
  .pm-subway:active { cursor: grabbing; }
  .pm-list { flex: 1; overflow-y: auto; padding: 8px 14px; }
  .pm-plotline { margin-bottom: 12px; border: 1px solid var(--background-modifier-border, #333); border-radius: 6px; padding: 8px 10px; }
  .pm-pl-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .pm-pl-dot { width: 10px; height: 10px; border-radius: 50%; }
  .pm-pl-name { flex: 1; font-weight: 500; font-size: 13px; }
  .pm-pl-count { font-size: 10px; opacity: 0.5; }
  .pm-pl-delete { border: none; background: none; color: var(--text-muted); cursor: pointer; opacity: 0; }
  .pm-plotline:hover .pm-pl-delete { opacity: 1; }
  .pm-pl-scenes { display: flex; flex-wrap: wrap; gap: 4px; }
  .pm-scene-pill { display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 10px; background: var(--background-modifier-border, #333); font-size: 11px; }
  .pm-pill-x { border: none; background: none; color: var(--text-muted); cursor: pointer; font-size: 13px; }
  .pm-pl-empty { font-size: 11px; opacity: 0.4; }
  .pm-empty { text-align: center; padding: 40px; opacity: 0.4; }
  .pm-empty p { margin-top: 8px; font-size: 12px; }
</style>
