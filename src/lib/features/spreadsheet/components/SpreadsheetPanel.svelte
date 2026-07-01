<script lang="ts">
  /**
   * SpreadsheetPanel — Left sidebar panel for the spreadsheet feature (Spec 042).
   *
   * Shows:
   *   - When no spreadsheet is open: empty state with "New Spreadsheet" button
   *   - When a spreadsheet is open: SpreadsheetToolbar + CellEditor + SpreadsheetGrid
   */
  import SpreadsheetGrid from '@/features/spreadsheet/components/SpreadsheetGrid.svelte';
  import CellEditor from '@/features/spreadsheet/components/CellEditor.svelte';
  import SpreadsheetToolbar from '@/features/spreadsheet/components/SpreadsheetToolbar.svelte';
  import {
    activeDocument,
    activeSheetId,
    setCell,
    newDocument,
  } from '@/features/spreadsheet/stores/spreadsheetStore';
  import { log } from '@/utils/logger';

  // ─── Active cell state (shared between CellEditor and SpreadsheetGrid) ───
  let activeRow = -1;
  let activeCol = -1;
  let formulaBarValue = '';
  let isEditing = false;

  $: doc = $activeDocument;

  function handleCreateNew() {
    log.interaction('ui', 'spreadsheet:panel:new-document');
    newDocument('Untitled Spreadsheet');
  }

  async function handleCellEditorCommit(detail: { value: string }) {
    if (activeRow >= 0 && activeCol >= 0) {
      await setCell(activeRow, activeCol, detail.value || null);
    }
    isEditing = false;
  }

  function handleCellEditorCancel() {
    isEditing = false;
    formulaBarValue = '';
  }
</script>

<div class="spreadsheet-panel">
  {#if doc}
    <!-- Toolbar -->
    <SpreadsheetToolbar />

    <!-- Formula bar / cell editor -->
    <CellEditor
      row={activeRow}
      col={activeCol}
      value={formulaBarValue}
      {isEditing}
      onCommit={handleCellEditorCommit}
      onCancel={handleCellEditorCancel}
    />

    <!-- Sheet tabs -->
    {#if doc.sheets.length > 1}
      <div class="sheet-tabs" role="tablist" aria-label="Sheets">
        {#each doc.sheets as sheet (sheet.id)}
          <button
            class="sheet-tab"
            class:active={sheet.id === $activeSheetId}
            role="tab"
            aria-selected={sheet.id === $activeSheetId}
            on:click={() => activeSheetId.set(sheet.id)}
          >
            {sheet.name}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Grid -->
    <div class="grid-container">
      <SpreadsheetGrid />
    </div>
  {:else}
    <!-- Empty state -->
    <div class="empty-state">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-faint)"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
      <p class="empty-title">No spreadsheet open</p>
      <p class="empty-subtitle">Create a new spreadsheet to get started.</p>
      <button class="new-btn" on:click={handleCreateNew}> New Spreadsheet </button>
    </div>
  {/if}
</div>

<style>
  .spreadsheet-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--background-primary);
  }

  .grid-container {
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }

  .sheet-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 8px 0;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    overflow-x: auto;
    flex-shrink: 0;
  }

  .sheet-tab {
    padding: 3px 10px;
    background: transparent;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: var(--radius-s, 3px) var(--radius-s, 3px) 0 0;
    font-size: var(--font-ui-small, 12px);
    color: var(--text-muted);
    cursor: pointer;
    white-space: nowrap;
  }

  .sheet-tab.active {
    background: var(--background-primary);
    color: var(--text-normal);
    border-color: var(--background-modifier-border);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: var(--spacing-s, 8px);
    padding: var(--spacing-l, 24px);
    text-align: center;
  }

  .empty-title {
    font-size: var(--font-ui-medium, 14px);
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }

  .empty-subtitle {
    font-size: var(--font-ui-small, 12px);
    color: var(--text-muted);
    margin: 0;
  }

  .new-btn {
    margin-top: var(--spacing-s, 8px);
    padding: 6px 16px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-m, 6px);
    font-size: var(--font-ui-small, 12px);
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .new-btn:hover {
    opacity: 0.88;
  }
</style>
