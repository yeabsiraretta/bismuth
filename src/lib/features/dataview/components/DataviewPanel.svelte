<script lang="ts">
  import {
    dataviewPageCount,
    dataviewIndexing,
    runDataviewQuery,
  } from '@/features/dataview/stores/dataviewStore';
  import type {
    DvResult,
    DvTableResult,
    DvListResult,
    DvTaskResult,
  } from '@/features/dataview/types/dataview';
  import Icon from '@/components/icons/Icon.svelte';

  let queryInput = '';
  let result: DvResult | null = null;
  let error: string | null = null;
  let isRunning = false;

  function handleRun() {
    if (!queryInput.trim()) return;
    isRunning = true;
    error = null;
    result = null;
    try {
      result = runDataviewQuery(queryInput);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      isRunning = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  }

  function formatValue(v: unknown): string {
    if (v === null || v === undefined) return '–';
    if (
      typeof v === 'object' &&
      v !== null &&
      'type' in (v as Record<string, unknown>) &&
      (v as Record<string, unknown>)['type'] === 'link'
    ) {
      return `[[${(v as { path: string }).path}]]`;
    }
    if (v instanceof Date) return v.toLocaleDateString();
    if (Array.isArray(v)) return v.map(formatValue).join(', ');
    return String(v);
  }
</script>

<div class="dv-panel">
  <div class="dv-panel-header">
    <Icon name="database" size={16} />
    <span class="dv-panel-title">Dataview</span>
    <span class="dv-panel-count">{$dataviewPageCount} pages indexed</span>
  </div>

  <div class="dv-query-input">
    <textarea
      bind:value={queryInput}
      onkeydown={handleKeydown}
      placeholder={'TABLE rating, genre\nFROM "books"\nSORT rating desc'}
      rows={4}
      class="dv-textarea"
      spellcheck="false"
    ></textarea>
    <button
      class="dv-run-btn"
      onclick={handleRun}
      disabled={isRunning || $dataviewIndexing || !queryInput.trim()}
    >
      {#if isRunning}
        Running…
      {:else}
        <Icon name="play" size={14} /> Run Query
      {/if}
    </button>
  </div>

  {#if error}
    <div class="dv-panel-error">{error}</div>
  {/if}

  {#if result}
    <div class="dv-panel-results">
      {#if result.type === 'table'}
        {@const tableResult = result as DvTableResult}
        <table class="dv-table">
          <thead>
            <tr>
              {#each tableResult.headers as header}
                <th>{header}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each tableResult.rows as row}
              <tr>
                {#each row as cell}
                  <td>{formatValue(cell)}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      {:else if result.type === 'list'}
        {@const listResult = result as DvListResult}
        <ul class="dv-list">
          {#each listResult.items as item}
            <li class="dv-list-item">
              <span class="dv-link">[[{item.page.path}]]</span>
              {#if item.value !== null}
                <span class="dv-list-value"> — {formatValue(item.value)}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else if result.type === 'task'}
        {@const taskResult = result as DvTaskResult}
        <ul class="dv-task-list">
          {#each taskResult.tasks as task}
            <li class="dv-task-item" class:dv-done={task.completed}>
              <input type="checkbox" checked={task.completed} disabled class="dv-task-checkbox" />
              <span class="dv-task-text">{task.text}</span>
            </li>
          {/each}
        </ul>
      {/if}

      <div class="dv-panel-footer">
        {result.totalCount} result{result.totalCount !== 1 ? 's' : ''}
      </div>
    </div>
  {/if}

  <div class="dv-panel-help">
    <details>
      <summary>Query Syntax</summary>
      <div class="dv-help-content">
        <p><strong>TABLE</strong> field1, field2 FROM "folder" WHERE condition SORT field desc</p>
        <p><strong>LIST</strong> FROM #tag</p>
        <p><strong>TASK</strong> FROM "projects"</p>
        <p><strong>Inline fields:</strong> <code>Key:: Value</code>, <code>[Key:: Value]</code></p>
        <p>Press <kbd>Cmd+Enter</kbd> to run.</p>
      </div>
    </details>
  </div>
</div>

<style>
  .dv-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    height: 100%;
    overflow-y: auto;
  }

  .dv-panel-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    font-size: 0.85rem;
  }

  .dv-panel-count {
    margin-left: auto;
    font-weight: 400;
    font-size: 0.75rem;
    color: var(--text-faint);
  }

  .dv-query-input {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .dv-textarea {
    font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
    font-size: 0.8rem;
    line-height: 1.4;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--background-secondary);
    color: var(--text-normal);
    resize: vertical;
    min-height: 60px;
  }

  .dv-textarea:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .dv-run-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .dv-run-btn:hover:not(:disabled) {
    opacity: 0.9;
  }
  .dv-run-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dv-panel-error {
    padding: 8px;
    background: var(--background-modifier-error, rgba(255, 0, 0, 0.1));
    border-radius: 6px;
    color: var(--text-error, #f38ba8);
    font-size: 0.8rem;
  }

  .dv-panel-results {
    overflow-x: auto;
  }

  .dv-panel-footer {
    padding: 4px 0;
    font-size: 0.75rem;
    color: var(--text-faint);
    text-align: right;
  }

  .dv-panel-help {
    margin-top: auto;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .dv-help-content {
    padding: 8px;
    line-height: 1.6;
  }

  .dv-help-content p {
    margin: 2px 0;
  }
  .dv-help-content code {
    background: var(--background-secondary);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.85em;
  }
  .dv-help-content kbd {
    background: var(--background-secondary);
    border: 1px solid var(--border-color);
    border-radius: 3px;
    padding: 1px 4px;
    font-size: 0.85em;
  }

  :global(.dv-table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }

  :global(.dv-table th) {
    text-align: left;
    padding: 6px 8px;
    border-bottom: 2px solid var(--border-color);
    font-weight: 600;
    color: var(--text-muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  :global(.dv-table td) {
    padding: 5px 8px;
    border-bottom: 1px solid var(--border-color);
  }

  :global(.dv-table tr:hover) {
    background: var(--background-modifier-hover);
  }

  :global(.dv-list) {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  :global(.dv-list-item) {
    padding: 4px 8px;
    border-bottom: 1px solid var(--border-color);
    font-size: 0.8rem;
  }

  :global(.dv-link) {
    color: var(--interactive-accent, #89b4fa);
    cursor: pointer;
  }

  :global(.dv-task-list) {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  :global(.dv-task-item) {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--border-color);
    font-size: 0.8rem;
  }

  :global(.dv-task-item.dv-done .dv-task-text) {
    text-decoration: line-through;
    opacity: 0.6;
  }
</style>
