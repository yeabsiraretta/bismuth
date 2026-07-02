<script lang="ts">
  /**
   * SpeakerNotesPanel — Per-slide speaker notes editor (Spec 043, Phase 3).
   *
   * Props:
   *   - frameId: string — ID of the active frame/slide
   *   - notes: string — current speaker notes content
   *   - transitionType: SlideMetadata['transitionType'] — current transition
   *   - transitionDuration: number — current transition duration in ms
   *
   * Emits:
   *   - update-notes: { frameId: string; notes: string; transitionType; transitionDuration }
   */
  import { log } from '@/utils/logger';
  import type { SlideMetadata } from '@/features/canvas/types/document';

  export let frameId = '';
  export let notes = '';
  export let transitionType: SlideMetadata['transitionType'] = 'instant';
  export let transitionDuration = 300;
  export let onUpdateNotes:
    | ((detail: {
        frameId: string;
        notes: string;
        transitionType: SlideMetadata['transitionType'];
        transitionDuration: number;
      }) => void)
    | undefined = undefined;

  let localNotes = notes;
  let localTransitionType = transitionType;
  let localDuration = transitionDuration;

  // Sync incoming props when frameId changes
  $: {
    localNotes = notes;
    localTransitionType = transitionType;
    localDuration = transitionDuration;
  }

  // ─── Word / char counts ───────────────────────────────────────────────────
  $: charCount = localNotes.length;
  $: wordCount = localNotes.trim() === '' ? 0 : localNotes.trim().split(/\s+/).length;

  // ─── Event handlers ───────────────────────────────────────────────────────
  function dispatchUpdate() {
    onUpdateNotes?.({
      frameId,
      notes: localNotes,
      transitionType: localTransitionType,
      transitionDuration: localDuration,
    });
  }

  function handleBlur() {
    if (localNotes !== notes) {
      log.debug('SpeakerNotesPanel: saving notes', { frameId, charCount });
      dispatchUpdate();
    }
  }

  function handleTransitionChange() {
    log.debug('SpeakerNotesPanel: transition changed', { frameId, localTransitionType });
    dispatchUpdate();
  }

  function handleDurationChange() {
    const clamped = Math.max(100, Math.min(1000, localDuration));
    localDuration = clamped;
    log.debug('SpeakerNotesPanel: duration changed', { frameId, localDuration });
    dispatchUpdate();
  }

  function handleInput() {
    // Reactive counts update automatically via $: declarations
  }

  const TRANSITION_OPTIONS: Array<{ value: SlideMetadata['transitionType']; label: string }> = [
    { value: 'instant', label: 'Instant' },
    { value: 'fade', label: 'Fade' },
    { value: 'slide-left', label: 'Slide left' },
    { value: 'slide-right', label: 'Slide right' },
    { value: 'scale', label: 'Scale' },
  ];
</script>

<div class="speaker-notes-panel">
  <div class="panel-header">
    <span class="panel-title">Speaker Notes</span>
    {#if frameId}
      <span class="frame-id-badge" title="Frame ID: {frameId}">
        {frameId.slice(0, 6)}…
      </span>
    {/if}
  </div>

  <textarea
    class="notes-input"
    bind:value={localNotes}
    placeholder="Add speaker notes…"
    aria-label="Speaker notes for current slide"
    on:blur={handleBlur}
    on:input={handleInput}
    rows="6"
  ></textarea>

  <div class="notes-footer">
    <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
    <span>{charCount} {charCount === 1 ? 'char' : 'chars'}</span>
  </div>

  <div class="transition-strip">
    <label class="transition-label" for="transition-type">Transition</label>
    <select
      id="transition-type"
      class="transition-select"
      bind:value={localTransitionType}
      on:change={handleTransitionChange}
      aria-label="Slide transition type"
    >
      {#each TRANSITION_OPTIONS as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    {#if localTransitionType !== 'instant'}
      <input
        type="number"
        class="duration-input"
        bind:value={localDuration}
        min="100"
        max="1000"
        step="50"
        aria-label="Transition duration in milliseconds"
        on:change={handleDurationChange}
      />
      <span class="duration-unit">ms</span>
    {/if}
  </div>
</div>

<style>
  .speaker-notes-panel {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--background-primary);
    border-top: 1px solid var(--background-modifier-border);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
  }

  .panel-title {
    font-size: var(--font-ui-small, 12px);
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .frame-id-badge {
    font-size: 10px;
    color: var(--text-faint);
    font-family: var(--font-monospace);
    background: var(--background-modifier-hover);
    padding: 1px 4px;
    border-radius: var(--radius-s, 3px);
  }

  .notes-input {
    flex: 1;
    width: 100%;
    padding: 8px 10px;
    background: var(--background-primary);
    color: var(--text-normal);
    border: none;
    outline: none;
    font-size: var(--font-ui-small, 12px);
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    box-sizing: border-box;
    line-height: 1.5;
  }

  .notes-input:focus {
    background: var(--background-primary);
    box-shadow: inset 0 0 0 1px var(--interactive-accent);
  }

  .notes-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 3px 10px;
    background: var(--background-secondary);
    border-top: 1px solid var(--background-modifier-border);
    font-size: 10px;
    color: var(--text-faint);
    user-select: none;
  }

  .transition-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--background-secondary);
    border-top: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
  }

  .transition-label {
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .transition-select {
    flex: 1;
    padding: 3px 6px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s, 3px);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 11px;
  }

  .duration-input {
    width: 56px;
    padding: 3px 6px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s, 3px);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 11px;
    text-align: right;
  }

  .duration-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .duration-unit {
    font-size: 10px;
    color: var(--text-faint);
    flex-shrink: 0;
  }
</style>
