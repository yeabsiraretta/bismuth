<script lang="ts">
  /**
   * MediaPanel — entry point for media editing and playback.
   * Tab bar: Player / Photo / Video / Convert.
   */
  import { pickImportFile } from '@/services/system/dialog';
  import PhotoEditor from './PhotoEditor.svelte';
  import VideoEditor from './VideoEditor.svelte';
  import ConvertPanel from './convert/ConvertPanel.svelte';
  import MediaPlayer from './player/MediaPlayer.svelte';
  import TranscriptPanel from './player/TranscriptPanel.svelte';
  import { activeMediaPath, loadMediaFile } from '../stores/mediaStore';
  import { openMedia, closeMedia, loadTranscript, hasMedia } from '../stores/playerStore';
  import { AUDIO_EXTENSIONS, VIDEO_EXTENSIONS, SUBTITLE_EXTENSIONS } from '../types/player';
  import { log } from '@/utils/logger';

  type MediaTab = 'player' | 'photo' | 'video' | 'convert';
  let activeTab: MediaTab = 'player';

  const tabs: { id: MediaTab; label: string }[] = [
    { id: 'player', label: 'Player' },
    { id: 'photo', label: 'Photo' },
    { id: 'video', label: 'Video' },
    { id: 'convert', label: 'Convert' },
  ];

  $: filePath = $activeMediaPath;
  $: playerActive = $hasMedia;

  const mediaExts = [...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS] as string[];
  const subtitleExts = [...SUBTITLE_EXTENSIONS] as string[];

  async function openFile(): Promise<void> {
    try {
      const selected = await pickImportFile({
        multiple: false,
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }],
      });
      if (typeof selected === 'string') {
        loadMediaFile(selected);
        log.info('MediaPanel: opened file', { path: selected });
      }
    } catch (err) {
      log.error('MediaPanel: failed to open file dialog', err as Error);
    }
  }

  async function openMediaFile(): Promise<void> {
    try {
      const selected = await pickImportFile({
        multiple: false,
        filters: [{ name: 'Media', extensions: mediaExts }],
      });
      if (typeof selected === 'string') {
        openMedia(selected);
        log.info('MediaPanel: opened media', { path: selected });
      }
    } catch (err) {
      log.error('MediaPanel: failed to open media dialog', err as Error);
    }
  }

  async function openSubtitleFile(): Promise<void> {
    try {
      const selected = await pickImportFile({
        multiple: false,
        filters: [{ name: 'Subtitles', extensions: subtitleExts }],
      });
      if (typeof selected === 'string') {
        const resp = await fetch(`file://${selected}`);
        const text = await resp.text();
        loadTranscript(text, selected);
        log.info('MediaPanel: loaded transcript', { path: selected });
      }
    } catch (err) {
      log.error('MediaPanel: failed to load transcript', err as Error);
    }
  }

  function handleClose(): void {
    activeMediaPath.set(null);
  }
</script>

<div class="media-panel">
  <div class="tab-bar" role="tablist" aria-label="Media editor sections">
    {#each tabs as tab}
      <button
        class="tab-btn {activeTab === tab.id ? 'active' : ''}"
        role="tab"
        aria-selected={activeTab === tab.id}
        on:click={() => (activeTab = tab.id)}>{tab.label}</button
      >
    {/each}
  </div>

  <div class="tab-content">
    {#if activeTab === 'photo'}
      {#if filePath}
        <div class="editor-header">
          <span class="file-name" title={filePath}>
            {filePath.split('/').pop() ?? filePath}
          </span>
          <button
            class="close-btn"
            on:click={handleClose}
            title="Close editor"
            aria-label="Close media editor">&#10005;</button
          >
        </div>
        <div class="editor-wrapper">
          <PhotoEditor sourcePath={filePath} />
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">&#128247;</div>
          <h2 class="empty-title">Photo Editor</h2>
          <p class="empty-desc">
            Open an image to apply non-destructive edits. Originals are never modified.
          </p>
          <button class="open-btn" on:click={openFile} aria-label="Open image file">
            Open Image File
          </button>
        </div>
      {/if}
    {:else if activeTab === 'player'}
      {#if playerActive}
        <div class="player-wrapper">
          <MediaPlayer />
          <TranscriptPanel />
          <div class="player-actions">
            <button class="action-btn" on:click={openSubtitleFile} aria-label="Load transcript">
              Load Transcript (.srt/.vtt)
            </button>
            <button class="action-btn secondary" on:click={closeMedia} aria-label="Close player">
              Close
            </button>
          </div>
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">&#9654;</div>
          <h2 class="empty-title">Media Player</h2>
          <p class="empty-desc">
            Play audio and video files with timestamps, transcripts, and screenshots.
          </p>
          <button class="open-btn" on:click={openMediaFile} aria-label="Open media file">
            Open Media File
          </button>
        </div>
      {/if}
    {:else if activeTab === 'video'}
      <VideoEditor />
    {:else if activeTab === 'convert'}
      <ConvertPanel />
    {/if}
  </div>
</div>

<style>
  .media-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background-color: var(--background-primary, #ffffff);
  }
  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--background-modifier-border, #e5e7eb);
    flex-shrink: 0;
  }
  .tab-btn {
    flex: 1;
    padding: var(--spacing-s, 8px) var(--spacing-xs, 4px);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted, #9ca3af);
    cursor: pointer;
    font-size: var(--font-ui-small, 13px);
    transition: color 0.15s;
  }
  .tab-btn:hover {
    color: var(--text-normal, #111827);
  }
  .tab-btn.active {
    color: var(--interactive-accent, #3b82f6);
    border-bottom-color: var(--interactive-accent, #3b82f6);
  }
  .tab-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs, 4px) var(--spacing-m, 12px);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background-color: var(--background-secondary, #f9fafb);
    min-height: 36px;
    flex-shrink: 0;
  }
  .file-name {
    font-size: var(--font-ui-small, 13px);
    color: var(--text-normal, #111827);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted, #9ca3af);
    cursor: pointer;
    font-size: 14px;
    padding: var(--spacing-xs, 4px);
    border-radius: var(--radius-s, 4px);
    margin-left: var(--spacing-s, 8px);
    flex-shrink: 0;
  }
  .close-btn:hover {
    color: var(--text-normal, #111827);
  }
  .editor-wrapper {
    flex: 1;
    overflow: hidden;
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-m, 12px);
    padding: var(--spacing-xxl, 48px) var(--spacing-l, 24px);
    text-align: center;
    flex: 1;
  }
  .empty-icon {
    font-size: 48px;
    opacity: 0.4;
  }
  .empty-title {
    font-size: var(--font-ui-large, 18px);
    font-weight: 600;
    color: var(--text-normal, #111827);
    margin: 0;
  }
  .empty-desc {
    font-size: var(--font-ui-small, 13px);
    color: var(--text-muted, #6b7280);
    max-width: 360px;
    line-height: 1.5;
    margin: 0;
  }
  .open-btn {
    padding: var(--spacing-s, 8px) var(--spacing-l, 24px);
    background-color: var(--interactive-accent, #3b82f6);
    color: var(--text-on-accent, #ffffff);
    border: none;
    border-radius: var(--radius-m, 6px);
    font-size: var(--font-ui-small, 13px);
    font-weight: 500;
    cursor: pointer;
  }
  .open-btn:hover {
    background-color: var(--interactive-accent-hover, #2563eb);
  }
  .player-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s, 8px);
    padding: var(--spacing-s, 8px);
    flex: 1;
    overflow-y: auto;
  }
  .player-actions {
    display: flex;
    gap: var(--spacing-s, 8px);
    padding: var(--spacing-xs, 4px) 0;
  }
  .action-btn {
    flex: 1;
    padding: var(--spacing-xs, 4px) var(--spacing-s, 8px);
    background: var(--interactive-accent, #3b82f6);
    color: var(--text-on-accent, #fff);
    border: none;
    border-radius: var(--radius-s, 4px);
    font-size: var(--font-ui-smaller, 11px);
    cursor: pointer;
  }
  .action-btn:hover {
    background: var(--interactive-accent-hover, #2563eb);
  }
  .action-btn.secondary {
    background: var(--background-modifier-border, #e5e7eb);
    color: var(--text-muted, #6b7280);
  }
  .action-btn.secondary:hover {
    background: var(--background-modifier-hover, #d1d5db);
  }
</style>
