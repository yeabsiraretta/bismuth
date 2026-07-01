<script lang="ts">
  /**
   * CellEditor — Formula bar displayed above the spreadsheet grid (Spec 042).
   *
   * Shows the active cell address (A1, B2…) alongside an input that displays
   * the raw formula string when editing a formula cell, or the raw value when
   * editing a plain-value cell.
   *
   * Emits:
   *   - commit: { value: string } — user pressed Enter or Tab
   *   - cancel: {}               — user pressed Escape
   */
  import { addressToLabel } from '@/features/spreadsheet/types/spreadsheet';
  import { log } from '@/utils/logger';

  export let row = -1;
  export let col = -1;
  /** Raw formula or value to show in the bar. */
  export let value = '';
  /** Whether the cell is currently in formula mode (value starts with `=`). */
  export let isEditing = false;
  export let onCommit: ((detail: { value: string }) => void) | undefined = undefined;
  export let onCancel: (() => void) | undefined = undefined;

  let inputEl: HTMLInputElement;

  $: cellLabel = row >= 0 && col >= 0 ? addressToLabel(row, col) : '';
  $: isFormula = value.startsWith('=');

  $: if (isEditing && inputEl) {
    inputEl.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      log.debug('CellEditor: commit via Enter', { cell: cellLabel, value });
      onCommit?.({ value });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      log.debug('CellEditor: commit via Tab', { cell: cellLabel, value });
      onCommit?.({ value });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      log.debug('CellEditor: cancel', { cell: cellLabel });
      onCancel?.();
    }
  }

  function handleBlur() {
    if (isEditing) {
      onCommit?.({ value });
    }
  }
</script>

<div class="formula-bar" role="toolbar" aria-label="Formula bar">
  <!-- Cell address indicator -->
  <div class="cell-address" aria-label="Active cell">
    {cellLabel || '—'}
  </div>

  <!-- Formula type indicator -->
  {#if isFormula}
    <span class="formula-indicator" title="Formula mode">fx</span>
  {/if}

  <!-- Formula / value input -->
  <input
    bind:this={inputEl}
    bind:value
    class="formula-input"
    class:formula-mode={isFormula}
    type="text"
    aria-label="Formula bar input"
    placeholder={isEditing ? 'Enter value or formula…' : ''}
    readonly={!isEditing}
    on:keydown={handleKeydown}
    on:blur={handleBlur}
  />
</div>

<style>
  .formula-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 6px);
    padding: 4px 8px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    height: 32px;
    flex-shrink: 0;
  }

  .cell-address {
    min-width: 52px;
    font-size: var(--font-ui-small, 12px);
    font-weight: 600;
    color: var(--text-normal);
    text-align: center;
    padding: 2px 6px;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 3px);
    user-select: none;
  }

  .formula-indicator {
    color: var(--interactive-accent);
    font-style: italic;
    font-size: 12px;
    font-weight: 600;
    padding: 0 4px;
    user-select: none;
  }

  .formula-input {
    flex: 1;
    height: 24px;
    padding: 0 8px;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 3px);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small, 12px);
    font-family: var(--font-monospace);
    outline: none;
  }

  .formula-input:not([readonly]):focus {
    border-color: var(--interactive-accent);
    box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.2);
  }

  .formula-input.formula-mode {
    color: var(--interactive-accent);
  }

  .formula-input[readonly] {
    cursor: default;
    background: var(--background-secondary);
  }
</style>
