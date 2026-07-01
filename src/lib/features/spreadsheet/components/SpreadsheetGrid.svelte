<script lang="ts">
  import { onMount } from 'svelte';
  import GridRow from '@/features/spreadsheet/components/GridRow.svelte';
  import {
    activeDocument,
    activeSheetId,
    selection,
    setCell,
    selectRange,
    getCellDisplayValue,
  } from '@/features/spreadsheet/stores/spreadsheetStore';
  import { colIndexToLabel, addressToLabel } from '@/features/spreadsheet/types/spreadsheet';
  import * as formulaEngine from '@/features/spreadsheet/services/formulaEngine';
  import { log } from '@/utils/logger';

  // ─── Config ───────────────────────────────────────────────────────────────
  const DEFAULT_ROW_HEIGHT = 28;
  const DEFAULT_COL_WIDTH = 120;
  const BUFFER_ROWS = 5;
  const HEADER_COL_WIDTH = 48;
  const VIRTUAL_THRESHOLD = 1000;

  // ─── State ────────────────────────────────────────────────────────────────
  let scrollTop = 0;
  let containerHeight = 0;
  let containerEl: HTMLDivElement;
  let editingRow = -1;
  let editingCol = -1;
  let editValue = '';
  let displayValues: string[][] = [];
  let errorMap: Record<string, string | null> = {};
  let selectedRow = -1;
  let selectedCol = -1;

  // ─── Derived from store ───────────────────────────────────────────────────
  $: doc = $activeDocument;
  $: sheetId = $activeSheetId;
  $: sheet = doc?.sheets.find((s) => s.id === sheetId) ?? null;
  $: rows = sheet?.rows ?? [];
  $: totalRows = Math.max(rows.length + 5, 20);
  $: totalCols = Math.max(rows.reduce((m, r) => Math.max(m, r.length), 0) + 3, 10);
  $: rowHeight = (r: number) => sheet?.rowHeights?.[r] ?? DEFAULT_ROW_HEIGHT;
  $: colWidth = (c: number) => sheet?.columnWidths?.[c] ?? DEFAULT_COL_WIDTH;
  $: totalHeight = Array.from({ length: totalRows }, (_, i) => rowHeight(i)).reduce((a, b) => a + b, 0);
  $: shouldVirtualize = totalRows > VIRTUAL_THRESHOLD;

  function getRowOffset(r: number): number {
    let off = 0;
    for (let i = 0; i < r; i++) off += rowHeight(i);
    return off;
  }

  $: firstVisibleRow = (() => {
    if (!shouldVirtualize) return 0;
    let acc = 0;
    for (let i = 0; i < totalRows; i++) {
      acc += rowHeight(i);
      if (acc > scrollTop) return Math.max(0, i - BUFFER_ROWS);
    }
    return 0;
  })();

  $: lastVisibleRow = (() => {
    if (!shouldVirtualize) return totalRows - 1;
    let acc = 0;
    for (let i = 0; i < totalRows; i++) {
      acc += rowHeight(i);
      if (acc > scrollTop + containerHeight) return Math.min(totalRows - 1, i + BUFFER_ROWS);
    }
    return totalRows - 1;
  })();

  $: visibleRows = Array.from({ length: lastVisibleRow - firstVisibleRow + 1 }, (_, i) => firstVisibleRow + i);

  // ─── Display values refresh ───────────────────────────────────────────────
  async function refreshDisplayValues() {
    if (!sheet) return;
    const newValues: string[][] = [];
    for (let r = firstVisibleRow; r <= lastVisibleRow; r++) {
      const rowArr: string[] = [];
      for (let c = 0; c < totalCols; c++) {
        rowArr.push(await getCellDisplayValue(r, c));
      }
      newValues.push(rowArr);
    }
    displayValues = newValues;
  }

  $: if (sheet || firstVisibleRow !== undefined) refreshDisplayValues();

  function getRowDisplayValues(r: number): string[] {
    return displayValues[r - firstVisibleRow] ?? [];
  }

  // ─── Selection ────────────────────────────────────────────────────────────
  $: sel = $selection;

  function isSelected(r: number, c: number): boolean {
    if (!sel) return r === selectedRow && c === selectedCol;
    return r >= Math.min(sel.startRow, sel.endRow) && r <= Math.max(sel.startRow, sel.endRow)
      && c >= Math.min(sel.startCol, sel.endCol) && c <= Math.max(sel.startCol, sel.endCol);
  }

  function isActiveCell(r: number, c: number): boolean {
    return r === selectedRow && c === selectedCol;
  }

  function selectCell(r: number, c: number) {
    selectedRow = r; selectedCol = c;
    editingRow = -1; editingCol = -1;
    selectRange({ sheetId, startRow: r, startCol: c, endRow: r, endCol: c });
  }

  // ─── Edit mode ────────────────────────────────────────────────────────────
  async function enterEditMode(r: number, c: number) {
    if (!sheet) return;
    editingRow = r; editingCol = c;
    const formula = await formulaEngine.getFormula(`sheet_${sheetId}`, r, c);
    editValue = formula ?? (sheet.rows[r]?.[c] != null ? String(sheet.rows[r][c]) : '');
  }

  async function commitEdit() {
    if (editingRow < 0 || editingCol < 0) return;
    await setCell(editingRow, editingCol, editValue === '' ? null : editValue);
    log.debug('SpreadsheetGrid: cell committed', { cell: addressToLabel(editingRow, editingCol) });
    editingRow = -1; editingCol = -1; editValue = '';
    refreshDisplayValues();
  }

  function exitEdit() { editingRow = -1; editingCol = -1; editValue = ''; }

  // ─── Keyboard ─────────────────────────────────────────────────────────────
  function handleKeydown(e: KeyboardEvent) {
    if (editingRow >= 0) {
      if (e.key === 'Enter') { e.preventDefault(); commitEdit().then(() => selectCell(Math.min(selectedRow + 1, totalRows - 1), selectedCol)); }
      else if (e.key === 'Tab') { e.preventDefault(); commitEdit().then(() => { const nc = (selectedCol + 1) % totalCols; selectCell(nc === 0 ? Math.min(selectedRow + 1, totalRows - 1) : selectedRow, nc); }); }
      else if (e.key === 'Escape') exitEdit();
      return;
    }
    if (selectedRow < 0) return;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); selectCell(Math.max(0, selectedRow - 1), selectedCol); break;
      case 'ArrowDown': e.preventDefault(); selectCell(Math.min(totalRows - 1, selectedRow + 1), selectedCol); break;
      case 'ArrowLeft': e.preventDefault(); selectCell(selectedRow, Math.max(0, selectedCol - 1)); break;
      case 'ArrowRight': e.preventDefault(); selectCell(selectedRow, Math.min(totalCols - 1, selectedCol + 1)); break;
      case 'Tab': e.preventDefault(); { const nc = (selectedCol + 1) % totalCols; selectCell(nc === 0 ? Math.min(selectedRow + 1, totalRows - 1) : selectedRow, nc); } break;
      case 'Enter': enterEditMode(selectedRow, selectedCol); break;
      case 'Delete': case 'Backspace': setCell(selectedRow, selectedCol, null).then(() => refreshDisplayValues()); break;
      case 'Escape': selectedRow = -1; selectedCol = -1; selectRange(null); break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) enterEditMode(selectedRow, selectedCol).then(() => { editValue = e.key; });
    }
  }

  function handleGridEditKeydown(detail: { event: KeyboardEvent }) { handleKeydown(detail.event); }

  onMount(() => {
    const ro = new ResizeObserver((entries) => { containerHeight = entries[0].contentRect.height - DEFAULT_ROW_HEIGHT; });
    if (containerEl) ro.observe(containerEl);
    return () => ro.disconnect();
  });
</script>

<div
  class="spreadsheet-grid"
  role="grid"
  tabindex="0"
  aria-label="Spreadsheet grid"
  on:keydown={handleKeydown}
  bind:this={containerEl}
  on:scroll={(e) => { scrollTop = (e.target as HTMLElement).scrollTop; }}
>
  <!-- Column headers (sticky top) -->
  <div class="header-row" style="padding-left: {HEADER_COL_WIDTH}px;">
    {#each Array.from({ length: totalCols }, (_, i) => i) as c (c)}
      <div class="col-header" style="width: {colWidth(c)}px; min-width: {colWidth(c)}px;" role="columnheader" aria-label="Column {colIndexToLabel(c)}">
        {colIndexToLabel(c)}
      </div>
    {/each}
  </div>

  <!-- Grid body -->
  <div class="grid-body" style="height: {shouldVirtualize ? totalHeight : 'auto'}px;">
    {#each visibleRows as r (r)}
      <GridRow
        rowIndex={r}
        colCount={totalCols}
        rowHeightPx={rowHeight(r)}
        headerWidth={HEADER_COL_WIDTH}
        colWidths={colWidth}
        displayValues={getRowDisplayValues(r)}
        {errorMap}
        {editingRow}
        {editingCol}
        {editValue}
        {isSelected}
        {isActiveCell}
        virtualOffset={shouldVirtualize ? getRowOffset(r) : -1}
        onCellClick={(d) => selectCell(d.row, d.col)}
        onCellDblClick={(d) => enterEditMode(d.row, d.col)}
        onEditInput={(d) => { editValue = d.value; }}
        onEditBlur={commitEdit}
        onEditKeydown={handleGridEditKeydown}
      />
    {/each}
  </div>
</div>

<style>
  .spreadsheet-grid {
    display: flex;
    flex-direction: column;
    overflow: auto;
    height: 100%;
    width: 100%;
    outline: none;
    background: var(--background-primary);
    font-family: var(--font-monospace);
    font-size: var(--font-ui-small);
    position: relative;
  }

  .header-row {
    display: flex;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .col-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    border-right: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 500;
    user-select: none;
    flex-shrink: 0;
  }

  .grid-body {
    position: relative;
    flex: 1;
  }
</style>
