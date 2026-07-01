<script lang="ts">
  import { currentCanvas } from '@/features/canvas/stores';
  import { buildFlowGraph, resolveFlowTarget, findEntryFrame } from '@/features/canvas/utils/data/flowGraph';
  import type { CanvasElement } from '@/features/canvas/types';

  export let show = false;
  export let onExit: (() => void) | undefined = undefined;

  let currentFrameId: string | null = null;

  $: frames = ($currentCanvas?.elements ?? []).filter(
    (e: CanvasElement) => e.element_type === 'frame' || e.element_type === 'screen'
  );
  $: flowLinks = $currentCanvas?.flowLinks ?? [];
  $: graph = buildFlowGraph(flowLinks, frames);
  $: currentFrame = frames.find((f: CanvasElement) => f.id === currentFrameId) ?? null;

  $: if (show && !currentFrameId) {
    currentFrameId = findEntryFrame(graph, frames);
  }

  export function handleHotspotClick(elementId: string) {
    if (!currentFrameId) return;
    const link = resolveFlowTarget(graph, currentFrameId, elementId);
    if (link) {
      currentFrameId = link.toFrameId;
    }
  }

  function handleFrameClick() {
    if (!currentFrameId) return;
    const link = resolveFlowTarget(graph, currentFrameId);
    if (link) {
      currentFrameId = link.toFrameId;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      exitPreview();
    }
  }

  function exitPreview() {
    show = false;
    currentFrameId = null;
    onExit?.();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show && currentFrame}
  <div class="flow-preview-overlay" on:click={handleFrameClick} role="presentation">
    <div class="preview-header">
      <span class="preview-label">Preview Mode</span>
      <span class="preview-frame-name">{currentFrame.name ?? 'Frame'}</span>
      <button class="preview-exit" on:click|stopPropagation={exitPreview}>
        Exit (Esc)
      </button>
    </div>

    <div class="preview-canvas">
      <div
        class="preview-frame"
        style="width: {currentFrame.width}px; height: {currentFrame.height}px;"
      >
        <div
          class="frame-content"
          style="background: {currentFrame.properties.fill || 'var(--background-primary)'};"
        >
          <span class="frame-placeholder">{currentFrame.name ?? 'Frame'}</span>
        </div>
      </div>
    </div>

    <div class="preview-nav">
      {#each graph.nodes.get(currentFrameId!)?.outgoing ?? [] as link (link.id)}
        <button
          class="nav-dot"
          class:active={false}
          on:click|stopPropagation={() => (currentFrameId = link.toFrameId)}
        >
          {link.label || '→'}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .flow-preview-overlay {
    position: fixed;
    inset: 0;
    background: var(--background-primary);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .preview-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    padding: 12px 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    z-index: 2001;
  }

  .preview-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
  }

  .preview-frame-name {
    font-size: 13px;
    font-weight: 500;
    flex: 1;
  }

  .preview-exit {
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-s);
    color: white;
    font-size: 12px;
    cursor: pointer;
  }

  .preview-exit:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .preview-canvas {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 60px 20px 20px;
  }

  .preview-frame {
    max-width: 100%;
    max-height: 100%;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-m);
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .frame-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .frame-placeholder {
    color: var(--text-muted);
    font-size: 16px;
  }

  .preview-nav {
    position: absolute;
    bottom: 20px;
    display: flex;
    gap: 8px;
  }

  .nav-dot {
    padding: 6px 14px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-m);
    color: white;
    font-size: 12px;
    cursor: pointer;
  }

  .nav-dot:hover {
    background: rgba(0, 0, 0, 0.8);
  }
</style>
