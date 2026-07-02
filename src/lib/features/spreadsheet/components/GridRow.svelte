<script lang="ts">
  /**
   * GridRow — A single row in the SpreadsheetGrid (Spec 042).
   *
   * Receives row data and edit state as props, renders cells, and delegates
   * click/dblclick events to the parent grid.
   */
  export let rowIndex: number;
  export let colCount: number;
  export let rowHeightPx: number;
  export let headerWidth: number;
  export let colWidths: (c: number) => number;
  export let displayValues: string[];
  export let errorMap: Record<string, string | null>;
  export let editingRow: number;
  export let editingCol: number;
  export let editValue = '';
  export let isSelected: (r: number, c: number) => boolean;
  export let isActiveCell: (r: number, c: number) => boolean;
  export let virtualOffset = -1; // -1 means non-virtual (use normal flow)
  export let onCellClick: ((detail: { row: number; col: number }) => void) | undefined = undefined;
  export let onCellDblClick: ((detail: { row: number; col: number }) => void) | undefined =
    undefined;
  export let onEditInput: ((detail: { value: string }) => void) | undefined = undefined;
  export let onEditBlur: (() => void) | undefined = undefined;
  export let onEditKeydown: ((detail: { event: KeyboardEvent }) => void) | undefined = undefined;
</script>

<div
  class="grid-row"
  role="row"
  style="
    {virtualOffset >= 0 ? `position: absolute; top: ${virtualOffset}px; width: 100%;` : ''}
    height: {rowHeightPx}px;
  "
>
  <!-- Row header -->
  <div
    class="row-header"
    style="width: {headerWidth}px; height: {rowHeightPx}px;"
    role="rowheader"
    aria-label="Row {rowIndex + 1}"
  >
    {rowIndex + 1}
  </div>

  <!-- Data cells -->
  {#each Array.from({ length: colCount }, (_, i) => i) as c (c)}
    <div
      class="grid-cell"
      class:selected={isSelected(rowIndex, c)}
      class:active-cell={isActiveCell(rowIndex, c)}
      class:error-cell={errorMap[`${rowIndex}:${c}`]}
      role="gridcell"
      aria-selected={isActiveCell(rowIndex, c)}
      aria-rowindex={rowIndex + 1}
      aria-colindex={c + 1}
      title={errorMap[`${rowIndex}:${c}`] ?? undefined}
      style="width: {colWidths(c)}px; min-width: {colWidths(c)}px; height: {rowHeightPx}px;"
      tabindex="0"
      on:click={() => onCellClick?.({ row: rowIndex, col: c })}
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
      }}
      on:dblclick={() => onCellDblClick?.({ row: rowIndex, col: c })}
    >
      {#if editingRow === rowIndex && editingCol === c}
        <!-- svelte-ignore a11y-autofocus -->
        <input
          class="cell-input"
          value={editValue}
          autofocus
          on:input={(e) => onEditInput?.({ value: (e.target as HTMLInputElement).value })}
          on:blur={() => onEditBlur?.()}
          on:keydown={(e) => onEditKeydown?.({ event: e })}
        />
      {:else if errorMap[`${rowIndex}:${c}`]}
        <span class="error-text">#ERR</span>
      {:else}
        {displayValues[c] ?? ''}
      {/if}
    </div>
  {/each}
</div>

<style>
  .grid-row {
    display: flex;
    align-items: stretch;
  }

  .row-header {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--background-secondary);
    border-right: 2px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    font-size: 11px;
    user-select: none;
    position: sticky;
    left: 0;
    z-index: 5;
  }

  .grid-cell {
    display: flex;
    align-items: center;
    padding: 0 6px;
    border-right: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-modifier-border);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: cell;
    color: var(--text-normal);
    flex-shrink: 0;
    box-sizing: border-box;
    font-size: var(--font-ui-small, 12px);
    font-family: var(--font-monospace);
  }

  .grid-cell.selected {
    background: var(--color-selection-bg, rgba(var(--interactive-accent-rgb), 0.12));
  }

  .grid-cell.active-cell {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }

  .grid-cell.error-cell {
    border: 1px solid var(--color-error, #ef4444);
  }

  .error-text {
    color: var(--color-error, #ef4444);
    font-size: 10px;
  }

  .cell-input {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    background: var(--background-primary);
    color: var(--text-normal);
    font-family: inherit;
    font-size: inherit;
    padding: 0;
  }
</style>
