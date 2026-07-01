<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    readerOpen,
    readerState,
    readerConfig,
    readerPosition,
    readerTokens,
    currentWordToken,
    readerProgress,
    timeRemaining,
    togglePlayPause,
    goBack,
    skipForward,
    adjustWpm,
    toggleFocusMode,
    stopSpeedReader,
  } from '../stores/speedReader';

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        goBack();
        break;
      case 'ArrowRight':
        e.preventDefault();
        skipForward();
        break;
      case 'ArrowUp':
        e.preventDefault();
        adjustWpm(25);
        break;
      case 'ArrowDown':
        e.preventDefault();
        adjustWpm(-25);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFocusMode();
        break;
      case 'Escape':
        e.preventDefault();
        stopSpeedReader();
        break;
    }
  }

  $: word = $currentWordToken;
  $: orpBefore = word ? word.text.slice(0, word.orpIndex) : '';
  $: orpChar = word ? word.text[word.orpIndex] || '' : '';
  $: orpAfter = word ? word.text.slice(word.orpIndex + 1) : '';
  $: progressPct = $readerProgress;
  $: remaining = $timeRemaining;
  $: isPlaying = $readerState === 'playing';
  $: isFinished = $readerState === 'finished';
</script>

<svelte:window on:keydown={$readerOpen ? handleKeydown : undefined} />

{#if $readerOpen}
  <div
    class="speed-reader-overlay"
    class:focus-mode={$readerConfig.focusMode}
    role="dialog"
    aria-label="Speed Reader"
    aria-modal="true"
    tabindex="-1"
    on:keydown={handleKeydown}
  >
    <!-- Close button -->
    {#if !$readerConfig.focusMode}
      <button class="close-btn" on:click={stopSpeedReader} aria-label="Close reader">
        <Icon name="x" size={18} />
      </button>
    {/if}

    <!-- RSVP Display -->
    <div class="rsvp-container">
      {#if isFinished}
        <div class="finished-message">Done</div>
      {:else if word}
        <div class="rsvp-word">
          <span class="orp-before">{orpBefore}</span><span class="orp-char">{orpChar}</span><span class="orp-after">{orpAfter}</span>
        </div>
        <div class="orp-guide">
          <div class="guide-line"></div>
          <div class="guide-marker"></div>
          <div class="guide-line"></div>
        </div>
      {:else}
        <div class="rsvp-word placeholder">Press Space to start</div>
      {/if}
    </div>

    <!-- Controls (hidden in focus mode) -->
    {#if !$readerConfig.focusMode}
      <div class="reader-controls">
        <!-- Progress bar -->
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progressPct}%"></div>
        </div>

        <div class="controls-row">
          <button class="ctrl-btn" on:click={goBack} title="Back 10 words">
            <Icon name="chevron-left" size={16} />
          </button>

          <button class="ctrl-btn play-btn" on:click={togglePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
            <Icon name={isPlaying ? 'pause' : 'play'} size={18} />
          </button>

          <button class="ctrl-btn" on:click={skipForward} title="Forward 10 words">
            <Icon name="chevron-right" size={16} />
          </button>
        </div>

        <div class="info-row">
          <div class="wpm-control">
            <button class="wpm-btn" on:click={() => adjustWpm(-25)}>−</button>
            <span class="wpm-display">{$readerConfig.wpm} WPM</span>
            <button class="wpm-btn" on:click={() => adjustWpm(25)}>+</button>
          </div>

          <span class="position-info">
            {$readerPosition + 1} / {$readerTokens.length}
          </span>

          <span class="time-info">{remaining}s left</span>

          <button class="focus-btn" class:active={$readerConfig.focusMode} on:click={toggleFocusMode} title="Toggle focus mode (F)">
            <Icon name="eye" size={14} />
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .speed-reader-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--background-primary);
    padding: var(--spacing-xl);
  }
  .speed-reader-overlay.focus-mode { cursor: none; }
  .close-btn {
    position: absolute;
    top: var(--spacing-m);
    right: var(--spacing-m);
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--radius-s);
    transition: color var(--transition-fast);
  }
  .close-btn:hover { color: var(--text-normal); }
  .rsvp-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-s);
    flex: 1;
    justify-content: center;
    min-width: 400px;
  }
  .rsvp-word {
    font-size: 3rem;
    font-family: var(--font-mono);
    letter-spacing: 0.02em;
    color: var(--text-normal);
    white-space: nowrap;
    user-select: none;
  }
  .rsvp-word.placeholder { font-size: 1.2rem; color: var(--text-muted); }
  .orp-before { color: var(--text-normal); }
  .orp-char { color: var(--interactive-accent); font-weight: bold; }
  .orp-after { color: var(--text-normal); }
  .orp-guide {
    display: flex;
    align-items: center;
    width: 200px;
    gap: 0;
  }
  .guide-line { flex: 1; height: 1px; background: var(--border-color); }
  .guide-marker { width: 6px; height: 6px; background: var(--interactive-accent); border-radius: 50%; }
  .finished-message {
    font-size: 2rem;
    color: var(--status-added);
    font-weight: var(--font-semibold);
  }
  .reader-controls {
    position: absolute;
    bottom: var(--spacing-xl);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-s);
    width: min(500px, 90vw);
  }
  .progress-bar {
    width: 100%;
    height: 3px;
    background: var(--background-modifier-hover);
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-fill { height: 100%; background: var(--interactive-accent); transition: width 0.1s; }
  .controls-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
  }
  .ctrl-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-color);
    border-radius: 50%;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .ctrl-btn:hover { border-color: var(--interactive-accent); color: var(--text-normal); }
  .play-btn { width: 44px; height: 44px; }
  .info-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
  .wpm-control { display: flex; align-items: center; gap: var(--spacing-xs); }
  .wpm-btn {
    width: 20px; height: 20px;
    border: 1px solid var(--border-color); border-radius: var(--radius-s);
    background: none; color: var(--text-muted); cursor: pointer;
    font-size: 12px; display: flex; align-items: center; justify-content: center;
  }
  .wpm-btn:hover { border-color: var(--interactive-accent); }
  .wpm-display { font-weight: var(--font-medium); min-width: 64px; text-align: center; }
  .position-info { opacity: 0.7; }
  .time-info { opacity: 0.7; }
  .focus-btn {
    display: flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border: none; border-radius: var(--radius-s);
    background: none; color: var(--text-muted); cursor: pointer;
  }
  .focus-btn:hover { color: var(--text-normal); }
  .focus-btn.active { color: var(--interactive-accent); }
</style>
