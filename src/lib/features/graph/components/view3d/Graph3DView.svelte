<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import Graph3DSettings from './Graph3DSettings.svelte';
  import type { Graph3DSettings as Graph3DSettingsType } from '../../types/graph3d';
  import { DEFAULT_CAMERA } from '../../types/graph3d';
  import {
    createState, loadGraph3D, render3D, startAnimation3D,
    orbitCamera, zoomCamera, handleNodeClick, handleNodeDoubleClick,
    getHoveredNode, applyFilter3D, type Graph3DState,
  } from './graph3dController';
  import { load3DSession, save3DSession } from '../../stores/graph3dSession';
  import { openNote as navOpenNote } from '@/appNavigation';

  const session = load3DSession();

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let width = 800;
  let height = 600;
  let searchQuery = session.searchQuery;
  let settings: Graph3DSettingsType = { ...session.settings };
  let settingsOpen = false;
  let state: Graph3DState = { ...createState(), camera: { ...session.camera } };
  let isOrbiting = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let hoveredLabel = '';

  function doRender() { state = render3D(ctx!, canvasEl, state, settings, width, height); }
  function syncState(s: Graph3DState) { state = s; }

  async function loadData() {
    state = await loadGraph3D(state, settings, searchQuery);
    doRender();
    state = startAnimation3D(ctx!, canvasEl, state, settings, width, height, syncState);
  }

  // ── Camera interaction ──
  function onMouseDown(e: MouseEvent) {
    if (e.button === 0 || e.button === 2) { isOrbiting = true; lastMouseX = e.clientX; lastMouseY = e.clientY; }
  }
  function onMouseMove(e: MouseEvent) {
    if (isOrbiting) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      state = { ...state, camera: orbitCamera(state.camera, dx * 0.005, dy * 0.005) };
      lastMouseX = e.clientX; lastMouseY = e.clientY;
      doRender();
    } else {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const node = getHoveredNode(state, sx, sy);
      hoveredLabel = node ? node.label : '';
      canvasEl.style.cursor = node ? 'pointer' : 'grab';
    }
  }
  function onMouseUp() { isOrbiting = false; persistSession(); }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    state = { ...state, camera: zoomCamera(state.camera, e.deltaY * 0.5) };
    doRender(); persistSession();
  }

  function onClick(e: MouseEvent) {
    if (isOrbiting) return;
    const rect = canvasEl.getBoundingClientRect();
    const result = handleNodeClick(state, e.clientX - rect.left, e.clientY - rect.top);
    state = result.state;
    doRender(); persistSession();
  }

  function onDblClick(e: MouseEvent) {
    const rect = canvasEl.getBoundingClientRect();
    const node = handleNodeDoubleClick(state, e.clientX - rect.left, e.clientY - rect.top);
    if (node && node.node_type !== 'tag') navOpenNote(node.id);
  }

  function onContextMenu(e: MouseEvent) { e.preventDefault(); }

  function handleResize() {
    if (!canvasEl) return;
    width = canvasEl.parentElement?.clientWidth || 800;
    height = canvasEl.parentElement?.clientHeight || 600;
    canvasEl.width = width; canvasEl.height = height;
    doRender();
  }

  function resetCamera() {
    state = { ...state, camera: { ...DEFAULT_CAMERA } };
    doRender(); persistSession();
  }

  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  function persistSession() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      save3DSession({ camera: state.camera, settings, searchQuery, focusedNodeId: state.focus.focusedNodeId });
    }, 500);
  }

  $: if (state.graphData.nodes.length > 0 && !state.initializing) {
    state = applyFilter3D(state, settings, searchQuery);
    doRender();
  }

  $: if (settings) { persistSession(); }

  onMount(() => {
    ctx = canvasEl.getContext('2d');
    handleResize();
    loadData();
    window.addEventListener('resize', handleResize);
  });
  onDestroy(() => {
    if (saveTimer) clearTimeout(saveTimer);
    persistSession();
    cancelAnimationFrame(state.animFrame);
    window.removeEventListener('resize', handleResize);
  });
</script>

<div class="g3d-view">
  <div class="g3d-canvas-container">
    <canvas
      bind:this={canvasEl}
      on:mousedown={onMouseDown}
      on:mousemove={onMouseMove}
      on:mouseup={onMouseUp}
      on:wheel|preventDefault={onWheel}
      on:click={onClick}
      on:dblclick={onDblClick}
      on:contextmenu={onContextMenu}
      {width} {height}
    ></canvas>

    <div class="g3d-search-bar">
      <Icon name="search" size={14} />
      <input type="text" placeholder="Search nodes..." bind:value={searchQuery} class="g3d-search-input" />
    </div>

    <div class="g3d-toolbar">
      <button class="g3d-btn" on:click={() => { settingsOpen = !settingsOpen; }} class:active={settingsOpen} title="Settings">
        <Icon name="settings" size={14} /><span>Settings</span>
      </button>
      <button class="g3d-btn" on:click={() => { settings = { ...settings, animate: !settings.animate }; if (settings.animate) state = startAnimation3D(ctx!, canvasEl, state, settings, width, height, syncState); }} class:active={settings.animate} title={settings.animate ? 'Pause' : 'Animate'}>
        <Icon name="zap" size={14} /><span>{settings.animate ? 'Pause' : 'Animate'}</span>
      </button>
      <button class="g3d-btn" on:click={resetCamera} title="Reset camera">
        <Icon name="minimize-2" size={14} />
      </button>
      <button class="g3d-btn" on:click={loadData} title="Reload graph">
        <Icon name="refresh-cw" size={14} />
      </button>
    </div>

    {#if settingsOpen}
      <div class="g3d-panel">
        <div class="g3d-panel-header">
          <span>3D Graph Settings</span>
          <button class="g3d-panel-close" on:click={() => (settingsOpen = false)}><Icon name="x" size={14} /></button>
        </div>
        <Graph3DSettings bind:settings />
      </div>
    {/if}

    {#if hoveredLabel}
      <div class="g3d-tooltip">{hoveredLabel}</div>
    {/if}

    {#if state.focus.focusedNodeId}
      <div class="g3d-focus-info">
        <Icon name="target" size={12} />
        <span>Focused: {state.nodes.find(n => n.id === state.focus.focusedNodeId)?.label ?? state.focus.focusedNodeId}</span>
        <button class="g3d-unfocus" on:click={() => { state = { ...state, focus: { focusedNodeId: null, highlightedNeighborIds: new Set() } }; doRender(); }}>
          <Icon name="x" size={11} /> Clear
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .g3d-view { display: flex; flex-direction: column; height: 100%; width: 100%; }
  .g3d-canvas-container { position: relative; flex: 1; overflow: hidden; }
  .g3d-canvas-container canvas { display: block; width: 100%; height: 100%; }
  .g3d-search-bar { position: absolute; top: 10px; left: 10px; display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: rgba(30,30,50,0.85); border: 1px solid var(--background-modifier-border, #444); border-radius: 6px; }
  .g3d-search-input { border: none; background: transparent; color: var(--text-normal, #ddd); font-size: 12px; outline: none; width: 180px; }
  .g3d-toolbar { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; }
  .g3d-btn { display: flex; align-items: center; gap: 4px; padding: 5px 8px; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; background: rgba(30,30,50,0.85); color: var(--text-normal, #ddd); cursor: pointer; font-size: 11px; }
  .g3d-btn:hover { background: rgba(60,60,80,0.9); }
  .g3d-btn.active { background: var(--interactive-accent, #7c3aed); border-color: transparent; color: #fff; }
  .g3d-btn span { display: none; }
  @media (min-width: 600px) { .g3d-btn span { display: inline; } }
  .g3d-panel { position: absolute; top: 46px; right: 10px; width: 260px; max-height: calc(100% - 60px); background: rgba(25,25,40,0.95); border: 1px solid var(--background-modifier-border, #444); border-radius: 8px; overflow-y: auto; }
  .g3d-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid var(--background-modifier-border, #333); font-size: 12px; font-weight: 600; }
  .g3d-panel-close { border: none; background: none; color: var(--text-muted); cursor: pointer; }
  .g3d-tooltip { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); padding: 4px 12px; background: rgba(0,0,0,0.75); color: #fff; border-radius: 4px; font-size: 12px; pointer-events: none; white-space: nowrap; }
  .g3d-focus-info { position: absolute; bottom: 10px; left: 10px; display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: rgba(30,30,50,0.85); border: 1px solid var(--background-modifier-border, #444); border-radius: 6px; font-size: 11px; }
  .g3d-unfocus { display: flex; align-items: center; gap: 2px; border: none; background: none; color: var(--text-muted); cursor: pointer; font-size: 11px; margin-left: 4px; }
</style>
