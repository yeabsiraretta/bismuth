<script lang="ts">
  import type { AutoLayout } from '@/features/canvas/types';

  export let autoLayout: AutoLayout;
  export let onUpdateLayout: (updates: Partial<AutoLayout>) => void;
  export let onUpdatePadding: (side: 'top' | 'right' | 'bottom' | 'left', value: number) => void;
</script>

<div class="layout-controls">
  <!-- Direction -->
  <div class="control-row">
    <span class="control-label">Direction</span>
    <div class="direction-toggle">
      <button
        class="dir-btn"
        class:active={autoLayout.direction === 'horizontal'}
        on:click={() => onUpdateLayout({ direction: 'horizontal' })}
        title="Horizontal"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
      <button
        class="dir-btn"
        class:active={autoLayout.direction === 'vertical'}
        on:click={() => onUpdateLayout({ direction: 'vertical' })}
        title="Vertical"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Gap -->
  <div class="control-row">
    <label class="control-label" for="auto-layout-gap">Gap</label>
    <input
      id="auto-layout-gap"
      type="number"
      class="control-input"
      value={autoLayout.gap}
      min="0"
      on:change={(e) => onUpdateLayout({ gap: parseInt(e.currentTarget.value) || 0 })}
    />
  </div>

  <!-- Padding -->
  <div class="control-row">
    <span class="control-label">Padding</span>
    <div class="padding-grid">
      <input
        type="number"
        class="pad-input"
        value={autoLayout.padding.top}
        min="0"
        title="Top"
        on:change={(e) => onUpdatePadding('top', parseInt(e.currentTarget.value) || 0)}
      />
      <input
        type="number"
        class="pad-input"
        value={autoLayout.padding.right}
        min="0"
        title="Right"
        on:change={(e) => onUpdatePadding('right', parseInt(e.currentTarget.value) || 0)}
      />
      <input
        type="number"
        class="pad-input"
        value={autoLayout.padding.bottom}
        min="0"
        title="Bottom"
        on:change={(e) => onUpdatePadding('bottom', parseInt(e.currentTarget.value) || 0)}
      />
      <input
        type="number"
        class="pad-input"
        value={autoLayout.padding.left}
        min="0"
        title="Left"
        on:change={(e) => onUpdatePadding('left', parseInt(e.currentTarget.value) || 0)}
      />
    </div>
  </div>

  <!-- Align Items -->
  <div class="control-row">
    <span class="control-label">Align</span>
    <div class="align-buttons">
      {#each ['start', 'center', 'end', 'stretch'] as align}
        <button
          class="align-btn"
          class:active={autoLayout.alignItems === align}
          on:click={() => onUpdateLayout({ alignItems: align as AutoLayout['alignItems'] })}
          title={align}
        >
          {align[0].toUpperCase()}
        </button>
      {/each}
    </div>
  </div>

  <!-- Justify Content -->
  <div class="control-row">
    <span class="control-label">Justify</span>
    <div class="align-buttons">
      {#each ['start', 'center', 'end', 'space-between'] as justify}
        <button
          class="align-btn"
          class:active={autoLayout.justifyContent === justify}
          on:click={() =>
            onUpdateLayout({ justifyContent: justify as AutoLayout['justifyContent'] })}
          title={justify}
        >
          {justify === 'space-between' ? '⇔' : justify[0].toUpperCase()}
        </button>
      {/each}
    </div>
  </div>

  <!-- T046: Wrap Toggle -->
  <div class="control-row">
    <span class="control-label">Wrap</span>
    <label class="toggle-wrapper">
      <input
        type="checkbox"
        checked={autoLayout.wrap ?? false}
        on:change={(e) => onUpdateLayout({ wrap: e.currentTarget.checked })}
      />
      <span class="toggle-label">Wrap children</span>
    </label>
  </div>

  <!-- T046: Counter-axis Spacing (visible when wrap enabled) -->
  {#if autoLayout.wrap}
    <div class="control-row">
      <label class="control-label" for="counter-axis-spacing">Row Gap</label>
      <input
        id="counter-axis-spacing"
        type="number"
        class="control-input"
        value={autoLayout.counterAxisSpacing ?? 0}
        min="0"
        on:change={(e) =>
          onUpdateLayout({ counterAxisSpacing: parseInt(e.currentTarget.value) || 0 })}
      />
    </div>
  {/if}
</div>

<style>
  .layout-controls {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }

  .control-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }

  .control-label {
    flex: 0 0 60px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .control-input {
    width: 56px;
    padding: 2px 6px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 11px;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }

  .control-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .direction-toggle {
    display: flex;
    gap: 2px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    overflow: hidden;
  }

  .dir-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 24px;
    background: var(--background-primary);
    border: none;
    color: var(--text-muted);
    cursor: pointer;
  }

  .dir-btn:hover {
    background: var(--background-modifier-hover);
  }

  .dir-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .padding-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
  }

  .pad-input {
    width: 40px;
    padding: 2px 4px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 10px;
    text-align: center;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }

  .pad-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .align-buttons {
    display: flex;
    gap: 2px;
  }

  .align-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 22px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
  }

  .align-btn:hover {
    background: var(--background-modifier-hover);
  }

  .align-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .toggle-label {
    font-size: 11px;
    color: var(--text-muted);
  }
</style>
