<script lang="ts">
  /**
   * MediaFileOpener — "Open in Photo/Video Editor" button for file previews.
   *
   * Accepts a vault file path and renders the appropriate edit button based on
   * the file extension. Clicking loads the file into mediaStore and navigates
   * to the media panel by activating the 'media' left-sidebar tab.
   *
   * Photo extensions: .jpg, .jpeg, .png, .webp
   * Video extensions: .mp4, .mov, .webm
   */
  import { loadMediaFile } from '../stores/mediaStore';
  import { setActiveTab } from '@/stores/layout/layout';
  import { log } from '@/utils/logger';

  export let filePath: string;

  const PHOTO_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
  const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm']);

  function getExtension(path: string): string {
    const idx = path.lastIndexOf('.');
    return idx >= 0 ? path.slice(idx).toLowerCase() : '';
  }

  $: ext = getExtension(filePath);
  $: isPhoto = PHOTO_EXTS.has(ext);
  $: isVideo = VIDEO_EXTS.has(ext);
  $: showButton = isPhoto || isVideo;
  $: buttonLabel = isPhoto ? 'Open in Photo Editor' : 'Open in Video Editor';
  $: ariaLabel = isPhoto
    ? `Open ${filePath.split('/').pop() ?? filePath} in Photo Editor`
    : `Open ${filePath.split('/').pop() ?? filePath} in Video Editor`;

  function handleOpen(): void {
    if (!showButton) return;
    loadMediaFile(filePath);
    setActiveTab('left', 'media');
    log.info('MediaFileOpener: opened file in media editor', {
      filePath,
      type: isPhoto ? 'photo' : 'video',
    });
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  }
</script>

{#if showButton}
  <button
    class="open-in-editor-btn"
    class:open-in-editor-btn--photo={isPhoto}
    class:open-in-editor-btn--video={isVideo}
    on:click={handleOpen}
    on:keydown={handleKeydown}
    title={buttonLabel}
    aria-label={ariaLabel}
    type="button"
  >
    <span class="btn-icon" aria-hidden="true">{isPhoto ? '&#9998;' : '&#9654;'}</span>
    <span class="btn-label">{buttonLabel}</span>
  </button>
{/if}

<style>
  .open-in-editor-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    padding: var(--spacing-xs, 4px) var(--spacing-s, 8px);
    min-height: 28px;
    background-color: var(--background-secondary, #f9fafb);
    border: 1px solid var(--background-modifier-border, #e5e7eb);
    border-radius: var(--radius-s, 4px);
    color: var(--text-muted, #6b7280);
    font-size: var(--font-ui-smaller, 11px);
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s,
      color 0.15s;
    white-space: nowrap;
  }

  .open-in-editor-btn:hover {
    background-color: var(--interactive-hover, rgba(0, 0, 0, 0.05));
    border-color: var(--interactive-accent, #3b82f6);
    color: var(--interactive-accent, #3b82f6);
  }

  .open-in-editor-btn:focus-visible {
    outline: 2px solid var(--interactive-accent, #3b82f6);
    outline-offset: 2px;
  }

  .open-in-editor-btn--photo:hover {
    border-color: var(--interactive-accent, #3b82f6);
  }
  .open-in-editor-btn--video:hover {
    border-color: var(--color-purple, #7c3aed);
    color: var(--color-purple, #7c3aed);
  }

  .btn-icon {
    font-size: 13px;
    line-height: 1;
  }
  .btn-label {
    line-height: 1;
  }
</style>
