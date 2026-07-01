<script lang="ts">
  /**
   * PresenterSidebar — Right panel in SlidePresentation (Spec 043).
   *
   * Contains the presenter timer, thumbnail strip, and speaker notes panel.
   * Extracted from SlidePresentation to keep both files under 300 lines.
   *
   * Props:
   *   doc, frameId, notes, elapsedFormatted — data to display
   * Emits:
   *   reset-timer, select-slide, update-notes, collapse — user actions
   */
  import SlideThumbnailStrip from '@/features/canvas/components/slides/SlideThumbnailStrip.svelte';
  import SpeakerNotesPanel from '@/features/canvas/components/slides/SpeakerNotesPanel.svelte';
  import type { CanvasDocument } from '@/features/canvas/types/document';

  export let doc: CanvasDocument;
  export let frameId = '';
  export let notes = '';
  export let elapsedFormatted = '00:00';
  export let onResetTimer: (() => void) | undefined = undefined;
  export let onSelectSlide: ((detail: { frameId: string }) => void) | undefined = undefined;
  export let onUpdateNotes: ((detail: { frameId: string; notes: string }) => void) | undefined = undefined;
  export let onCollapse: (() => void) | undefined = undefined;
</script>

<div class="presenter-sidebar">
  <!-- Timer bar -->
  <div class="timer-bar">
    <span class="timer-display" aria-label="Elapsed time">{elapsedFormatted}</span>
    <button class="icon-btn" on:click={() => onResetTimer?.()} title="Reset timer">
      Reset
    </button>
    <button
      class="icon-btn"
      on:click={() => onCollapse?.()}
      title="Collapse panel"
      aria-label="Collapse presenter panel"
    >
      &rsaquo;
    </button>
  </div>

  <!-- Thumbnail strip -->
  <div class="thumbnail-area">
    <SlideThumbnailStrip
      {doc}
      activeFrameId={frameId}
      onSelectSlide={(d) => onSelectSlide?.(d)}
    />
  </div>

  <!-- Speaker notes -->
  <SpeakerNotesPanel
    {frameId}
    {notes}
    onUpdateNotes={(d) => onUpdateNotes?.(d)}
  />
</div>

<style>
  .presenter-sidebar {
    width: 220px;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    background: var(--background-secondary);
    border-left: 1px solid var(--background-modifier-border);
    overflow: hidden;
  }

  .timer-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: var(--background-primary);
    border-bottom: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
  }

  .timer-display {
    font-size: 14px;
    font-weight: 600;
    font-family: var(--font-monospace);
    color: var(--text-normal);
    flex: 1;
  }

  .icon-btn {
    padding: 2px 8px;
    background: transparent;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 3px);
    color: var(--text-muted);
    font-size: 11px;
    cursor: pointer;
  }

  .icon-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .thumbnail-area {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
</style>
