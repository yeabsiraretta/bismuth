<script lang="ts">
  /**
   * MediaPlayer — HTML5 audio/video player with playback controls,
   * timestamp insertion, screenshot capture, speed control, and pin toggle.
   */
  import { onMount, onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    activeSource, playbackState,
    togglePlay, seekTo, setSpeed, setVolume, toggleMute, togglePin,
    updateTime, updateDuration, setBuffering, addScreenshot,
  } from '../../stores/playerStore';
  import { formatTimestamp, captureVideoFrame, createTimestampLink } from '../../services/playerService';
  import { SPEED_PRESETS } from '../../types/player';

  let mediaEl: HTMLVideoElement | HTMLAudioElement | null = null;
  let animFrame: number | null = null;

  $: source = $activeSource;
  $: state = $playbackState;

  function syncLoop() {
    if (mediaEl && !mediaEl.paused) {
      updateTime(mediaEl.currentTime);
    }
    animFrame = requestAnimationFrame(syncLoop);
  }

  function handleLoadedMetadata() {
    if (!mediaEl) return;
    updateDuration(mediaEl.duration);
    if (source?.startTime) mediaEl.currentTime = source.startTime;
    if (source?.loop) mediaEl.loop = true;
  }

  function handleEnded() {
    if (source?.endTime && mediaEl) {
      if (source.loop && source.startTime !== undefined) {
        mediaEl.currentTime = source.startTime;
        mediaEl.play();
        return;
      }
    }
    updateTime(mediaEl?.duration ?? 0);
    playbackState.update(s => ({ ...s, playing: false }));
  }

  function handleTimeUpdate() {
    if (!mediaEl || !source?.endTime) return;
    if (mediaEl.currentTime >= source.endTime) {
      if (source.loop && source.startTime !== undefined) {
        mediaEl.currentTime = source.startTime;
      } else {
        mediaEl.pause();
        playbackState.update(s => ({ ...s, playing: false }));
      }
    }
  }

  function handleScrub(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    seekTo(v);
    if (mediaEl) mediaEl.currentTime = v;
  }

  function handleVolumeChange(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    setVolume(v);
    if (mediaEl) mediaEl.volume = v;
  }

  function handleSpeedChange(e: Event) {
    const v = parseFloat((e.target as HTMLSelectElement).value);
    setSpeed(v);
    if (mediaEl) mediaEl.playbackRate = v;
  }

  function handleScreenshot() {
    if (!mediaEl || source?.type !== 'video') return;
    const capture = captureVideoFrame(mediaEl as HTMLVideoElement, source.url);
    if (capture) addScreenshot(capture);
  }

  function handleInsertTimestamp() {
    if (!source || !mediaEl) return;
    const link = createTimestampLink(source.url, mediaEl.currentTime);
    window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text: link } }));
  }

  $: if (mediaEl) {
    if (state.playing && mediaEl.paused) mediaEl.play().catch(() => {});
    else if (!state.playing && !mediaEl.paused) mediaEl.pause();
    if (Math.abs(mediaEl.currentTime - state.currentTime) > 1) {
      mediaEl.currentTime = state.currentTime;
    }
    mediaEl.playbackRate = state.speed;
    mediaEl.volume = state.volume;
    mediaEl.muted = state.muted;
  }

  onMount(() => { animFrame = requestAnimationFrame(syncLoop); });
  onDestroy(() => { if (animFrame) cancelAnimationFrame(animFrame); });
</script>

{#if source}
  <div class="media-player" class:pinned={state.pinned}>
    <div class="player-header">
      <span class="player-title" title={source.title}>{source.title}</span>
      <div class="header-actions">
        <button class="icon-btn" title={state.pinned ? 'Unpin' : 'Pin'} on:click={togglePin} aria-label="Toggle pin">
          <Icon name={state.pinned ? 'pin-off' : 'pin'} size={14} />
        </button>
      </div>
    </div>

    <div class="player-viewport">
      {#if source.type === 'video'}
        <video
          bind:this={mediaEl}
          src={source.playableUrl}
          on:loadedmetadata={handleLoadedMetadata}
          on:ended={handleEnded}
          on:timeupdate={handleTimeUpdate}
          on:waiting={() => setBuffering(true)}
          on:canplay={() => setBuffering(false)}
          preload="metadata"
          class="video-element"
        >
          <track kind="captions" />
        </video>
      {:else}
        <audio
          bind:this={mediaEl}
          src={source.playableUrl}
          on:loadedmetadata={handleLoadedMetadata}
          on:ended={handleEnded}
          on:timeupdate={handleTimeUpdate}
          on:waiting={() => setBuffering(true)}
          on:canplay={() => setBuffering(false)}
          preload="metadata"
        ></audio>
        <div class="audio-placeholder">
          <Icon name="music" size={48} />
          <span>{source.title}</span>
        </div>
      {/if}
      {#if state.buffering}
        <div class="buffering-overlay"><Icon name="loader" size={24} /></div><!--end-->
      {/if}
    </div>

    <div class="player-controls">
      <div class="scrubber-row">
        <span class="time-display">{formatTimestamp(state.currentTime)}</span>
        <input
          type="range" class="scrubber" min="0" max={state.duration} step="0.1"
          value={state.currentTime} on:input={handleScrub} aria-label="Seek"
        />
        <span class="time-display">{formatTimestamp(state.duration)}</span>
      </div>

      <div class="button-row">
        <button class="ctrl-btn" on:click={() => seekTo(Math.max(0, state.currentTime - 5))} title="Back 5s" aria-label="Back 5 seconds">
          <Icon name="skip-back" size={16} />
        </button>
        <button class="ctrl-btn play-btn" on:click={togglePlay} title={state.playing ? 'Pause' : 'Play'} aria-label={state.playing ? 'Pause' : 'Play'}>
          <Icon name={state.playing ? 'pause' : 'play'} size={20} />
        </button>
        <button class="ctrl-btn" on:click={() => seekTo(Math.min(state.duration, state.currentTime + 5))} title="Forward 5s" aria-label="Forward 5 seconds">
          <Icon name="skip-forward" size={16} />
        </button>

        <div class="spacer" />

        <button class="ctrl-btn" on:click={toggleMute} title={state.muted ? 'Unmute' : 'Mute'} aria-label={state.muted ? 'Unmute' : 'Mute'}>
          <Icon name={state.muted ? 'volume-x' : 'volume-2'} size={14} />
        </button>
        <input type="range" class="volume-slider" min="0" max="1" step="0.05"
          value={state.volume} on:input={handleVolumeChange} aria-label="Volume" />

        <select class="speed-select" value={state.speed} on:change={handleSpeedChange} aria-label="Speed">
          {#each SPEED_PRESETS as s}
            <option value={s}>{s}x</option>
          {/each}
        </select>

        <button class="ctrl-btn" on:click={handleInsertTimestamp} title="Insert timestamp" aria-label="Insert timestamp at cursor">
          <Icon name="clock" size={14} />
        </button>

        {#if source.type === 'video'}
          <button class="ctrl-btn" on:click={handleScreenshot} title="Screenshot" aria-label="Capture screenshot">
            <Icon name="camera" size={14} />
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .media-player { display: flex; flex-direction: column; background: var(--background-primary, #1e1e2e); border: 1px solid var(--background-modifier-border, #45475a); border-radius: var(--radius-m, 6px); overflow: hidden; }
  .media-player.pinned { border-color: var(--interactive-accent, #89b4fa); box-shadow: 0 0 0 1px var(--interactive-accent, #89b4fa); }
  .player-header { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: var(--background-secondary, #181825); border-bottom: 1px solid var(--background-modifier-border, #45475a); }
  .player-title { font-size: 12px; color: var(--text-muted, #a6adc8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .header-actions { display: flex; gap: 4px; }
  .player-viewport { position: relative; background: #000; min-height: 40px; }
  .video-element { display: block; width: 100%; max-height: 300px; object-fit: contain; }
  .audio-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px; color: var(--text-faint, #6c7086); }
  .buffering-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); color: var(--text-normal, #cdd6f4); animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .player-controls { padding: 6px 8px; background: var(--background-secondary, #181825); }
  .scrubber-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .time-display { font-size: 10px; color: var(--text-faint, #6c7086); font-variant-numeric: tabular-nums; min-width: 36px; }
  .scrubber { flex: 1; accent-color: var(--interactive-accent, #89b4fa); height: 4px; cursor: pointer; }
  .button-row { display: flex; align-items: center; gap: 4px; }
  .ctrl-btn { background: none; border: none; color: var(--text-muted, #a6adc8); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
  .ctrl-btn:hover { color: var(--text-normal, #cdd6f4); background: var(--background-modifier-hover, rgba(255,255,255,0.06)); }
  .play-btn { color: var(--interactive-accent, #89b4fa); }
  .spacer { flex: 1; }
  .volume-slider { width: 60px; accent-color: var(--interactive-accent, #89b4fa); height: 3px; cursor: pointer; }
  .speed-select { font-size: 11px; background: var(--background-primary, #1e1e2e); border: 1px solid var(--background-modifier-border, #45475a); border-radius: 3px; color: var(--text-normal, #cdd6f4); padding: 1px 4px; cursor: pointer; }
  .icon-btn { background: none; border: none; color: var(--text-muted, #a6adc8); cursor: pointer; padding: 2px; border-radius: 3px; display: flex; }
  .icon-btn:hover { color: var(--text-normal, #cdd6f4); }
</style>
