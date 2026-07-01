<script lang="ts">
  /**
   * MediaToolbar — action buttons for photo editing operations.
   * Dispatches named CustomEvents; no direct invoke() calls.
   * Each button is at least 40px tall (min-height enforced in CSS).
   */
  export let disabled: boolean = false;
  export let onCrop: (() => void) | undefined = undefined;
  export let onRotateCw: (() => void) | undefined = undefined;
  export let onRotateCcw: (() => void) | undefined = undefined;
  export let onFlipH: (() => void) | undefined = undefined;
  export let onFlipV: (() => void) | undefined = undefined;
  export let onReset: (() => void) | undefined = undefined;
  export let onExport: (() => void) | undefined = undefined;
  export let onBrightness: ((detail: { value: number }) => void) | undefined = undefined;
  export let onContrast: ((detail: { value: number }) => void) | undefined = undefined;
  export let onUndo: (() => void) | undefined = undefined;
  export let onRedo: (() => void) | undefined = undefined;

  let showAdjust = false;
  let brightnessValue = 1;
  let contrastValue = 1;

  function handleBrightnessInput(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    brightnessValue = v;
    onBrightness?.({ value: v });
  }

  function handleContrastInput(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    contrastValue = v;
    onContrast?.({ value: v });
  }
</script>

<div class="media-toolbar" role="toolbar" aria-label="Photo editing tools">
  <button
    class="tool-btn"
    {disabled}
    on:click={() => onRotateCcw?.()}
    title="Rotate counter-clockwise"
    aria-label="Rotate counter-clockwise"
  >
    <span class="tool-icon" aria-hidden="true">&#8635;</span>
    <span class="tool-label">Rotate CCW</span>
  </button>
  <button
    class="tool-btn"
    {disabled}
    on:click={() => onRotateCw?.()}
    title="Rotate clockwise"
    aria-label="Rotate clockwise"
  >
    <span class="tool-icon" aria-hidden="true">&#8634;</span>
    <span class="tool-label">Rotate CW</span>
  </button>
  <button
    class="tool-btn"
    {disabled}
    on:click={() => onCrop?.()}
    title="Crop"
    aria-label="Crop image"
  >
    <span class="tool-icon" aria-hidden="true">&#9633;</span>
    <span class="tool-label">Crop</span>
  </button>
  <button
    class="tool-btn"
    {disabled}
    on:click={() => onFlipH?.()}
    title="Flip horizontal"
    aria-label="Flip horizontal"
  >
    <span class="tool-icon" aria-hidden="true">&#8646;</span>
    <span class="tool-label">Flip H</span>
  </button>
  <button
    class="tool-btn"
    {disabled}
    on:click={() => onFlipV?.()}
    title="Flip vertical"
    aria-label="Flip vertical"
  >
    <span class="tool-icon" aria-hidden="true">&#8693;</span>
    <span class="tool-label">Flip V</span>
  </button>

  <div class="tool-group">
    <button
      class="tool-btn"
      class:active={showAdjust}
      {disabled}
      on:click={() => (showAdjust = !showAdjust)}
      title="Brightness / Contrast"
      aria-expanded={showAdjust}
    >
      <span class="tool-icon" aria-hidden="true">&#9788;</span>
      <span class="tool-label">Adjust</span>
    </button>
    {#if showAdjust}
      <div class="adjust-popover" role="group" aria-label="Adjustments">
        <label class="adjust-row">
          <span class="adjust-label">Brightness</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={brightnessValue}
            on:input={handleBrightnessInput}
            aria-label="Brightness"
          />
          <span class="adjust-value">{brightnessValue.toFixed(2)}</span>
        </label>
        <label class="adjust-row">
          <span class="adjust-label">Contrast</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={contrastValue}
            on:input={handleContrastInput}
            aria-label="Contrast"
          />
          <span class="adjust-value">{contrastValue.toFixed(2)}</span>
        </label>
      </div>
    {/if}
  </div>

  <div class="toolbar-spacer"></div>

  <button
    class="tool-btn"
    {disabled}
    on:click={() => onUndo?.()}
    title="Undo"
    aria-label="Undo last operation"
  >
    <span class="tool-icon" aria-hidden="true">&#9100;</span>
    <span class="tool-label">Undo</span>
  </button>
  <button
    class="tool-btn"
    {disabled}
    on:click={() => onRedo?.()}
    title="Redo"
    aria-label="Redo last undone operation"
  >
    <span class="tool-icon" aria-hidden="true">&#9101;</span>
    <span class="tool-label">Redo</span>
  </button>
  <button
    class="tool-btn"
    {disabled}
    on:click={() => onReset?.()}
    title="Reset all edits"
    aria-label="Reset all edits"
  >
    <span class="tool-icon" aria-hidden="true">&#10226;</span>
    <span class="tool-label">Reset</span>
  </button>
  <button
    class="tool-btn tool-btn--accent"
    {disabled}
    on:click={() => onExport?.()}
    title="Export to new file"
    aria-label="Export to new file"
  >
    <span class="tool-icon" aria-hidden="true">&#8681;</span>
    <span class="tool-label">Export</span>
  </button>
</div>

<style>
  .media-toolbar {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    padding: var(--spacing-xs, 4px) var(--spacing-s, 8px);
    background-color: var(--background-secondary, #f9fafb);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    flex-wrap: wrap;
    position: relative;
  }
  .tool-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    min-width: 52px;
    padding: var(--spacing-xs, 4px) var(--spacing-s, 8px);
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-s, 4px);
    color: var(--text-muted, #6b7280);
    font-size: var(--font-ui-smaller, 11px);
    cursor: pointer;
    gap: 2px;
    transition:
      background-color 0.15s,
      border-color 0.15s,
      color 0.15s;
  }
  .tool-btn:hover:not(:disabled) {
    background-color: var(--interactive-hover, rgba(0, 0, 0, 0.05));
    border-color: var(--border-color, #d1d5db);
    color: var(--text-normal, #111827);
  }
  .tool-btn.active {
    background-color: var(--background-modifier-active-hover, rgba(59, 130, 246, 0.08));
    border-color: var(--interactive-accent, #3b82f6);
    color: var(--interactive-accent, #3b82f6);
  }
  .tool-btn--accent {
    background-color: var(--interactive-accent, #3b82f6);
    border-color: var(--interactive-accent, #3b82f6);
    color: var(--text-on-accent, #fff);
  }
  .tool-btn--accent:hover:not(:disabled) {
    background-color: var(--interactive-accent-hover, #2563eb);
  }
  .tool-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .tool-icon {
    font-size: 16px;
    line-height: 1;
  }
  .toolbar-spacer {
    flex: 1;
  }
  .tool-group {
    position: relative;
  }
  .adjust-popover {
    position: absolute;
    top: calc(100% + var(--spacing-xs, 4px));
    left: 0;
    z-index: 100;
    background-color: var(--background-primary, #fff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--radius-m, 6px);
    padding: var(--spacing-m, 12px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s, 8px);
  }
  .adjust-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
  }
  .adjust-label {
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-muted, #6b7280);
    width: 72px;
    flex-shrink: 0;
  }
  .adjust-row input[type='range'] {
    flex: 1;
    accent-color: var(--interactive-accent, #3b82f6);
  }
  .adjust-value {
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-normal, #111827);
    width: 32px;
    text-align: right;
    flex-shrink: 0;
  }
</style>
