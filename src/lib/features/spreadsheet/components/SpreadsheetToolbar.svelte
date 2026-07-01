<script lang="ts">
  /**
   * SpreadsheetToolbar — Import, Export, and sheet management actions (Spec 042).
   *
   * Actions:
   *   - Import CSV: opens Tauri file dialog → readCsv → populates active sheet
   *   - Export CSV: serialises active sheet → writeCsv via save dialog
   *   - Add Sheet: appends a new blank sheet to the document
   *
   * Uses the unified logger. No direct `invoke()` calls.
   */
  import { pickImportFile, pickSaveDestination } from '@/services/system/dialog';
  import {
    activeDocument,
    activeSheetId,
  } from '@/features/spreadsheet/stores/spreadsheetStore';
  import { importCsv, exportCsv } from '@/features/spreadsheet/services/spreadsheet';
  import { log } from '@/utils/logger';

  export let onImportComplete: ((detail: { rowCount: number }) => void) | undefined = undefined;
  export let onExportComplete: ((detail: { path: string }) => void) | undefined = undefined;
  export let onSheetAdded: ((detail: { sheetId: string }) => void) | undefined = undefined;

  let importing = false;
  let exporting = false;

  // ─── Import ───────────────────────────────────────────────────────────────
  async function handleImport() {
    if (importing) return;
    importing = true;
    log.interaction('ui', 'spreadsheet:toolbar:import-start');
    try {
      const selected = await pickImportFile({
        filters: [{ name: 'CSV', extensions: ['csv', 'tsv'] }],
        multiple: false,
        title: 'Import CSV',
      });
      if (!selected || typeof selected !== 'string') return;

      const rows = await importCsv(selected);

      // Populate the active sheet rows in the store
      activeDocument.update((doc) => {
        if (!doc) return doc;
        const sheetId = $activeSheetId;
        const sheet = doc.sheets.find((s) => s.id === sheetId);
        if (sheet) {
          sheet.rows = rows;
          sheet.formulas = {};
          doc.modifiedAt = Date.now();
        }
        return { ...doc };
      });

      onImportComplete?.({ rowCount: rows.length });
      log.info('SpreadsheetToolbar: import complete', { path: selected, rowCount: rows.length });
    } catch (err) {
      log.error('SpreadsheetToolbar: import failed', err);
    } finally {
      importing = false;
    }
  }

  // ─── Export ───────────────────────────────────────────────────────────────
  async function handleExport() {
    if (exporting) return;
    const doc = $activeDocument;
    if (!doc) return;
    exporting = true;
    log.interaction('ui', 'spreadsheet:toolbar:export-start');
    try {
      const savePath = await pickSaveDestination({
        filters: [{ name: 'CSV', extensions: ['csv'] }],
        defaultPath: `${doc.name}.csv`,
        title: 'Export CSV',
      });
      if (!savePath) return;

      const sheetId = $activeSheetId;
      const sheet = doc.sheets.find((s) => s.id === sheetId);
      if (!sheet) return;

      const stringRows = sheet.rows.map((row) => row.map((cell) => (cell != null ? String(cell) : '')));
      await exportCsv(savePath, stringRows);
      onExportComplete?.({ path: savePath });
      log.info('SpreadsheetToolbar: export complete', { path: savePath });
    } catch (err) {
      log.error('SpreadsheetToolbar: export failed', err);
    } finally {
      exporting = false;
    }
  }

  // ─── Add Sheet ────────────────────────────────────────────────────────────
  function handleAddSheet() {
    activeDocument.update((doc) => {
      if (!doc) return doc;
      const newSheetId = crypto.randomUUID();
      const newSheet = {
        id: newSheetId,
        name: `Sheet${doc.sheets.length + 1}`,
        rows: [],
        formulas: {},
        columnWidths: {},
        rowHeights: {},
      };
      doc.sheets.push(newSheet);
      doc.activeSheetId = newSheetId;
      doc.modifiedAt = Date.now();
      onSheetAdded?.({ sheetId: newSheetId });
      log.info('SpreadsheetToolbar: sheet added', { name: newSheet.name });
      return { ...doc };
    });
    activeSheetId.set($activeDocument?.activeSheetId ?? '');
  }

  $: docName = $activeDocument?.name ?? 'Spreadsheet';
</script>

<div class="spreadsheet-toolbar" role="toolbar" aria-label="Spreadsheet toolbar">
  <span class="toolbar-title">{docName}</span>

  <div class="toolbar-separator" role="separator" aria-orientation="vertical"></div>

  <!-- Import CSV -->
  <button
    class="toolbar-btn"
    on:click={handleImport}
    disabled={importing}
    title="Import CSV file"
    aria-label="Import CSV"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
    {importing ? 'Importing…' : 'Import'}
  </button>

  <!-- Export CSV -->
  <button
    class="toolbar-btn"
    on:click={handleExport}
    disabled={exporting || !$activeDocument}
    title="Export as CSV"
    aria-label="Export CSV"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
    {exporting ? 'Exporting…' : 'Export'}
  </button>

  <div class="toolbar-separator" role="separator" aria-orientation="vertical"></div>

  <!-- Add Sheet -->
  <button
    class="toolbar-btn"
    on:click={handleAddSheet}
    disabled={!$activeDocument}
    title="Add new sheet"
    aria-label="Add sheet"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
    Add Sheet
  </button>
</div>

<style>
  .spreadsheet-toolbar {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    padding: 4px 8px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    height: 36px;
    flex-shrink: 0;
  }

  .toolbar-title {
    font-size: var(--font-ui-small, 12px);
    font-weight: 600;
    color: var(--text-normal);
    margin-right: var(--spacing-xs, 4px);
  }

  .toolbar-separator {
    width: 1px;
    height: 20px;
    background: var(--background-modifier-border);
    margin: 0 var(--spacing-xs, 4px);
  }

  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-s, 3px);
    color: var(--text-muted);
    font-size: var(--font-ui-small, 12px);
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
    white-space: nowrap;
  }

  .toolbar-btn:hover:not(:disabled) {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
    border-color: var(--background-modifier-border);
  }

  .toolbar-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
