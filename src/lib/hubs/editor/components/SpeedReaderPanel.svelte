<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getEditor } from '@/hubs/core/stores/settings-store.svelte';
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import { fileName as fileBaseName } from '@/ui/panel-actions';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import {
    detectFileKind,
    estimateTime,
    extractText,
    formatTime,
    isReadable,
    prepareWords,
    type SpeedReaderWord,
    wordDelay,
  } from '@/hubs/editor/services/speed-reader-service';
  import Panel from '@/ui/panel.svelte';

  let notePath = $derived(getActiveNotePath());
  let cachedContent = $derived(notePath ? getCachedContent(notePath) : undefined);

  let words: SpeedReaderWord[] = $state([]);
  let loading = $state(false);
  let sourceLabel = $state('');
  let wpm = $state(getEditor().defaultSpeedReaderWpm);
  let playing = $state(false);
  let index = $state(0);
  let timerId: ReturnType<typeof setTimeout> | null = null;

  let currentWord = $derived(words[index] ?? null);
  let progress = $derived(words.length > 0 ? Math.round((index / words.length) * 100) : 0);
  let remaining = $derived(estimateTime(words.length - index, wpm));

  // Auto-load when active note changes
  $effect(() => {
    if (notePath) {
      loadFromPath(notePath, cachedContent);
    }
  });

  async function loadFromPath(path: string, raw?: string) {
    if (!isReadable(path)) {
      words = [];
      sourceLabel = '';
      return;
    }
    loading = true;
    try {
      const text = await extractText(path, raw);
      words = prepareWords(text);
      index = 0;
      const kind = detectFileKind(path);
      const name = fileBaseName(path);
      sourceLabel = `${name} (${kind})`;
    } finally {
      loading = false;
    }
  }

  async function openFilePicker() {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Readable Files',
            extensions: [
              'md',
              'txt',
              'pdf',
              'png',
              'jpg',
              'jpeg',
              'gif',
              'webp',
              'bmp',
              'tiff',
              'csv',
              'json',
              'xml',
              'html',
              'rst',
              'adoc',
              'tex',
            ],
          },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (selected && typeof selected === 'string') {
        await loadFromPath(selected);
      }
    } catch {
      // Not in Tauri environment
    }
  }

  function scheduleNext() {
    if (!playing || index >= words.length - 1) {
      stop();
      return;
    }
    const delay = wordDelay(wpm, words[index].text);
    timerId = setTimeout(() => {
      index++;
      scheduleNext();
    }, delay);
  }

  function start() {
    if (words.length === 0) return;
    if (index >= words.length - 1) index = 0;
    playing = true;
    scheduleNext();
  }

  function stop() {
    playing = false;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function reset() {
    stop();
    index = 0;
  }

  function stepForward() {
    if (index < words.length - 1) index++;
  }

  function stepBack() {
    if (index > 0) index--;
  }

  function adjustWpm(delta: number) {
    const wasPlaying = playing;
    stop();
    wpm = Math.max(50, Math.min(1500, wpm + delta));
    if (wasPlaying) start();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === ' ') {
      e.preventDefault();
      if (playing) stop();
      else start();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepForward();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepBack();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      adjustWpm(25);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      adjustWpm(-25);
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      reset();
    }
  }

  onDestroy(() => {
    if (timerId) clearTimeout(timerId);
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (words.length > 0) handleKeydown(e);
  }}
/>

<Panel title="Speed Reader">
  {#if loading}
    <div class="panel-empty">
      <p>Extracting text…</p>
    </div>
  {:else if words.length === 0}
    <div class="panel-empty">
      <p>No content to read</p>
      <p class="panel-empty-hint">Open a note or load a file (PDF, image, text)</p>
      <button class="sr-open-btn" onclick={openFilePicker}>Open File…</button>
    </div>
  {:else}
    <div class="sr-panel">
      <div class="sr-source">
        <span class="sr-source-label" title={sourceLabel}>{sourceLabel}</span>
        <button class="sr-open-btn-sm" onclick={openFilePicker} title="Open another file"
          >Open</button
        >
      </div>

      <div class="sr-display">
        {#if currentWord}
          <span class="sr-word">
            <span class="sr-before">{currentWord.text.slice(0, currentWord.orpIndex)}</span><span
              class="sr-orp">{currentWord.text[currentWord.orpIndex]}</span
            ><span class="sr-after">{currentWord.text.slice(currentWord.orpIndex + 1)}</span>
          </span>
        {:else}
          <span class="sr-word sr-done">Done</span>
        {/if}
        <div class="sr-guide">
          <div class="sr-tick"></div>
        </div>
      </div>

      <div class="sr-progress-bar">
        <div class="sr-progress-fill" style="width: {progress}%"></div>
      </div>

      <div class="sr-controls">
        <button class="sr-btn" onclick={reset} title="Reset (R)">⟲</button>
        <button class="sr-btn" onclick={stepBack} title="Back (←)">◁</button>
        <button class="sr-btn" onclick={() => adjustWpm(-50)} title="Slower (↓)">−</button>
        <span class="sr-wpm">{wpm}</span>
        <button class="sr-btn" onclick={() => adjustWpm(50)} title="Faster (↑)">+</button>
        <button class="sr-btn" onclick={stepForward} title="Forward (→)">▷</button>
        <button
          class="sr-btn sr-play"
          onclick={() => (playing ? stop() : start())}
          title="Play/Pause (Space)"
        >
          {playing ? '⏸' : '▶'}
        </button>
      </div>

      <div class="sr-meta">
        <span>{index + 1}/{words.length}</span>
        <span>{wpm} wpm</span>
        <span>{formatTime(remaining)}</span>
      </div>
    </div>
  {/if}
</Panel>

<style>
  .sr-panel {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .sr-source {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    overflow: hidden;
  }
  .sr-source-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .sr-open-btn-sm {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.7rem;
    padding: 0 2px;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .sr-open-btn {
    margin-top: 8px;
    padding: 6px 14px;
    font-size: 0.75rem;
    background: var(--color-accent);
    color: var(--color-on-accent, #fff);
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-family: inherit;
  }
  .sr-open-btn:hover {
    opacity: 0.9;
  }
  .sr-display {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 90px;
    padding: 20px 16px;
    background: var(--color-surface);
    border-radius: var(--radius-m);
    border: 1px solid var(--color-border);
  }
  .sr-word {
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-text);
    font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .sr-before,
  .sr-after {
    color: var(--color-text);
  }
  .sr-orp {
    color: var(--color-error);
    font-weight: 800;
  }
  .sr-done {
    color: var(--color-text-muted);
    font-style: italic;
  }
  .sr-guide {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 6px;
  }
  .sr-tick {
    width: 2px;
    height: 6px;
    background: var(--color-accent);
    border-radius: 0 0 1px 1px;
  }
  .sr-progress-bar {
    height: 3px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }
  .sr-progress-fill {
    height: 100%;
    background: var(--color-accent);
    transition: width var(--transition-fast);
  }
  .sr-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .sr-btn {
    padding: 4px 8px;
    font-size: 0.75rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    cursor: pointer;
    color: var(--color-text);
    font-family: inherit;
  }
  .sr-btn:hover {
    background: var(--color-surface-hover);
  }
  .sr-play {
    min-width: 32px;
  }
  .sr-wpm {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--color-text);
    min-width: 36px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .sr-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }
</style>
