<script lang="ts">
  /**
   * TranscriptPanel — displays SRT/VTT transcript cues with click-to-seek,
   * search filtering, and timestamped quote copying.
   */
  import Icon from '@/components/icons/Icon.svelte';
  import {
    activeTranscript,
    playbackState,
    seekTo,
    clearTranscript,
  } from '../../stores/playerStore';
  import { formatTimestamp, createTimestampLink } from '../../services/playerService';
  import { activeSource } from '../../stores/playerStore';
  import type { TranscriptCue } from '../../types/player';

  let searchQuery = '';

  $: transcript = $activeTranscript;
  $: currentTime = $playbackState.currentTime;
  $: source = $activeSource;

  $: filteredCues =
    transcript?.cues.filter(
      (c) => !searchQuery || c.text.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  $: activeCueIdx = findActiveCue(transcript?.cues ?? [], currentTime);

  function findActiveCue(cues: TranscriptCue[], time: number): number {
    for (let i = cues.length - 1; i >= 0; i--) {
      if (time >= cues[i].startTime && time <= cues[i].endTime) return i;
    }
    return -1;
  }

  function handleCueClick(cue: TranscriptCue) {
    seekTo(cue.startTime);
  }

  function handleCopyCue(cue: TranscriptCue) {
    if (!source) return;
    const link = createTimestampLink(source.url, cue.startTime, cue.text);
    navigator.clipboard.writeText(link);
  }

  function handleInsertCue(cue: TranscriptCue) {
    if (!source) return;
    const link = createTimestampLink(source.url, cue.startTime, cue.text);
    window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text: link + '\n' } }));
  }

  let cueListEl: HTMLDivElement | null = null;

  $: if (cueListEl && activeCueIdx >= 0) {
    const activeEl = cueListEl.querySelector(`[data-cue="${activeCueIdx}"]`);
    activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
</script>

{#if transcript}
  <div class="transcript-panel">
    <div class="transcript-header">
      <span class="transcript-title">
        <Icon name="file-text" size={12} />
        Transcript ({transcript.cues.length} cues)
      </span>
      <button
        class="icon-btn"
        on:click={clearTranscript}
        title="Close transcript"
        aria-label="Close transcript"
      >
        <Icon name="x" size={12} />
      </button>
    </div>

    {#if transcript.cues.length > 5}
      <div class="search-bar">
        <Icon name="search" size={12} />
        <input
          bind:value={searchQuery}
          class="search-input"
          type="text"
          placeholder="Search transcript..."
          spellcheck="false"
        />
      </div>
    {/if}

    <div class="cue-list" bind:this={cueListEl}>
      {#each filteredCues as cue, i (cue.index)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="cue-item"
          class:active={activeCueIdx === i && !searchQuery}
          data-cue={i}
          on:click={() => handleCueClick(cue)}
          on:keydown={(e) => {
            if (e.key === 'Enter') handleCueClick(cue);
          }}
          role="button"
          tabindex="0"
          title="Click to seek to {formatTimestamp(cue.startTime)}"
        >
          <span class="cue-time">{formatTimestamp(cue.startTime)}</span>
          <span class="cue-text">{cue.text}</span>
          <div class="cue-actions">
            <button
              class="cue-action-btn"
              on:click|stopPropagation={() => handleCopyCue(cue)}
              title="Copy timestamp link"
              aria-label="Copy"
            >
              <Icon name="copy" size={10} />
            </button>
            <button
              class="cue-action-btn"
              on:click|stopPropagation={() => handleInsertCue(cue)}
              title="Insert into note"
              aria-label="Insert"
            >
              <Icon name="arrow-right" size={10} />
            </button>
          </div>
        </div>
      {/each}
      {#if filteredCues.length === 0}
        <div class="empty-cues">No matching cues</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .transcript-panel {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--background-modifier-border, #45475a);
    border-radius: var(--radius-m, 6px);
    overflow: hidden;
    max-height: 300px;
    background: var(--background-primary, #1e1e2e);
  }
  .transcript-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    background: var(--background-secondary, #181825);
    border-bottom: 1px solid var(--background-modifier-border, #45475a);
  }
  .transcript-title {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-muted, #a6adc8);
  }
  .search-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--background-modifier-border, #45475a);
    color: var(--text-faint, #6c7086);
  }
  .search-input {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-normal, #cdd6f4);
    font-size: 12px;
    outline: none;
  }
  .cue-list {
    flex: 1;
    overflow-y: auto;
  }
  .cue-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 4px 8px;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    color: var(--text-normal, #cdd6f4);
    font-size: 12px;
    line-height: 1.4;
    border-bottom: 1px solid var(--background-modifier-border-focus, rgba(255, 255, 255, 0.03));
    transition: background 0.1s;
  }
  .cue-item:hover {
    background: var(--background-modifier-hover, rgba(255, 255, 255, 0.06));
  }
  .cue-item.active {
    background: var(--interactive-accent, #89b4fa);
    color: var(--text-on-accent, #1e1e2e);
  }
  .cue-item.active .cue-time {
    color: var(--text-on-accent, #1e1e2e);
    opacity: 0.8;
  }
  .cue-time {
    font-size: 10px;
    color: var(--text-faint, #6c7086);
    font-variant-numeric: tabular-nums;
    min-width: 40px;
    flex-shrink: 0;
    padding-top: 1px;
  }
  .cue-text {
    flex: 1;
  }
  .cue-actions {
    display: none;
    gap: 2px;
    flex-shrink: 0;
  }
  .cue-item:hover .cue-actions {
    display: flex;
  }
  .cue-action-btn {
    background: none;
    border: none;
    color: var(--text-faint, #6c7086);
    cursor: pointer;
    padding: 2px;
    border-radius: 2px;
    display: flex;
  }
  .cue-action-btn:hover {
    color: var(--text-normal, #cdd6f4);
    background: rgba(255, 255, 255, 0.1);
  }
  .empty-cues {
    padding: 12px;
    text-align: center;
    font-size: 12px;
    color: var(--text-faint, #6c7086);
  }
  .icon-btn {
    background: none;
    border: none;
    color: var(--text-muted, #a6adc8);
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    display: flex;
  }
  .icon-btn:hover {
    color: var(--text-normal, #cdd6f4);
  }
</style>
