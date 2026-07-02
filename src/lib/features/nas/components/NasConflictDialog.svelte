<script lang="ts">
  /**
   * NasConflictDialog — conflict resolution modal for NAS sync conflicts.
   *
   * Shows when $nasStore.conflicts.length > 0.
   * All actions call nasStore.resolveConflict() — no direct service calls.
   */
  import { conflicts, resolveConflict } from '../stores/nasStore';
  import { log } from '@/utils/logger';
  import type { ConflictRecord } from '../types/nas';
  import { diffLines } from './conflictDiff';

  export let onClose: (() => void) | undefined = undefined;

  $: conflictList = $conflicts;

  // Expanded diff state per conflict
  let expandedDiffs = new Set<string>();

  function toggleDiff(filePath: string) {
    if (expandedDiffs.has(filePath)) {
      expandedDiffs.delete(filePath);
    } else {
      expandedDiffs.add(filePath);
    }
    expandedDiffs = new Set(expandedDiffs);
  }

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ─── Resolve individual ───────────────────────────────────────────────────

  async function handleKeepLocal(conflict: ConflictRecord) {
    try {
      await resolveConflict(conflict.filePath, 'local');
      log.info('[NasConflictDialog] kept local', { path: conflict.filePath });
    } catch (err) {
      log.error('[NasConflictDialog] resolveConflict failed', err as Error);
    }
  }

  async function handleKeepRemote(conflict: ConflictRecord) {
    try {
      await resolveConflict(conflict.filePath, 'remote');
      log.info('[NasConflictDialog] kept remote', { path: conflict.filePath });
    } catch (err) {
      log.error('[NasConflictDialog] resolveConflict failed', err as Error);
    }
  }

  // ─── Bulk resolve ─────────────────────────────────────────────────────────

  async function resolveAll(resolution: 'local' | 'remote') {
    const all = [...conflictList];
    for (const c of all) {
      try {
        await resolveConflict(c.filePath, resolution);
      } catch (err) {
        log.error('[NasConflictDialog] bulk resolve failed', err as Error);
      }
    }
  }

  // ─── Keyboard close ───────────────────────────────────────────────────────

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose?.();
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  class="dialog-overlay"
  role="dialog"
  aria-modal="true"
  aria-label="Resolve sync conflicts"
  tabindex="-1"
  on:keydown={handleKeydown}
>
  <div class="dialog">
    <div class="dialog-header">
      <h2 class="dialog-title">Sync Conflicts ({conflictList.length})</h2>
      <button class="close-btn" on:click={() => onClose?.()} aria-label="Close">&#10005;</button>
    </div>

    <div class="conflict-list">
      {#each conflictList as conflict (conflict.filePath)}
        <div class="conflict-item">
          <div class="conflict-row">
            <span class="conflict-path" title={conflict.filePath}>
              {conflict.filePath.split('/').pop() ?? conflict.filePath}
            </span>
            <span class="mtime-info">
              Local: {formatTime(conflict.localMtime)} &middot; Remote: {formatTime(
                conflict.remoteMtime
              )}
            </span>
          </div>

          <div class="conflict-actions">
            <button class="btn btn--local" on:click={() => handleKeepLocal(conflict)}>
              Keep Local
            </button>
            <button class="btn btn--remote" on:click={() => handleKeepRemote(conflict)}>
              Keep Remote
            </button>
            <button class="btn btn--ghost" on:click={() => toggleDiff(conflict.filePath)}>
              {expandedDiffs.has(conflict.filePath) ? 'Hide Diff' : 'Show Diff'}
            </button>
          </div>

          {#if expandedDiffs.has(conflict.filePath)}
            <div class="diff-view" aria-label="Diff for {conflict.filePath}">
              {#each diffLines(conflict.localContent, conflict.remoteContent) as line}
                <div
                  class="diff-line diff-line--{line.op}"
                  aria-label="{line.op === 'add'
                    ? 'Added'
                    : line.op === 'remove'
                      ? 'Removed'
                      : 'Unchanged'}: {line.text}"
                >
                  <span class="diff-sigil" aria-hidden="true">
                    {line.op === 'add' ? '+' : line.op === 'remove' ? '-' : ' '}
                  </span>
                  <span class="diff-text">{line.text}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if conflictList.length > 1}
      <div class="bulk-actions">
        <button class="btn btn--local" on:click={() => resolveAll('local')}>
          Resolve All — Keep Local
        </button>
        <button class="btn btn--remote" on:click={() => resolveAll('remote')}>
          Resolve All — Keep Remote
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--background-primary, #1e1e2e);
    border: 1px solid var(--background-modifier-border, #313244);
    border-radius: var(--radius-m, 8px);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m, 12px);
    max-height: 80vh;
    max-width: 640px;
    overflow: hidden;
    padding: var(--spacing-m, 12px);
    width: 100%;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .dialog-title {
    font-size: var(--font-ui-medium, 14px);
    font-weight: 600;
    color: var(--text-normal, #cdd6f4);
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted, #a6adc8);
    font-size: 14px;
    padding: 2px 6px;
  }

  .conflict-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m, 12px);
    overflow-y: auto;
    flex: 1;
  }

  .conflict-item {
    border: 1px solid var(--background-modifier-border, #313244);
    border-radius: var(--radius-s, 4px);
    padding: var(--spacing-s, 8px);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s, 8px);
  }

  .conflict-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .conflict-path {
    font-size: var(--font-ui-small, 11px);
    font-weight: 600;
    color: var(--text-normal, #cdd6f4);
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mtime-info {
    font-size: 10px;
    color: var(--text-faint, #6c7086);
  }

  .conflict-actions {
    display: flex;
    gap: var(--spacing-xs, 4px);
    flex-wrap: wrap;
  }

  .diff-view {
    background: var(--background-secondary, #181825);
    border-radius: var(--radius-xs, 2px);
    font-family: var(--font-mono);
    font-size: 10px;
    max-height: 200px;
    overflow-y: auto;
    padding: 4px;
  }

  .diff-line {
    display: flex;
    gap: 4px;
    line-height: 1.5;
  }
  .diff-sigil {
    flex-shrink: 0;
    width: 12px;
  }
  .diff-text {
    color: var(--text-normal, #cdd6f4);
    white-space: pre-wrap;
    word-break: break-all;
  }

  .diff-line--add {
    background: var(--color-diff-add, rgba(34, 84, 61, 0.4));
  }
  .diff-line--remove {
    background: var(--color-diff-remove, rgba(116, 42, 42, 0.4));
  }
  .diff-line--add .diff-sigil {
    color: #a6e3a1;
  }
  .diff-line--remove .diff-sigil {
    color: #f38ba8;
  }

  .bulk-actions {
    display: flex;
    gap: var(--spacing-s, 8px);
    flex-wrap: wrap;
    flex-shrink: 0;
    border-top: 1px solid var(--background-modifier-border, #313244);
    padding-top: var(--spacing-s, 8px);
  }

  .btn {
    border: none;
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    font-size: var(--font-ui-small, 11px);
    font-weight: 600;
    padding: 4px 10px;
    transition: filter 0.1s;
  }

  .btn:hover {
    filter: brightness(1.1);
  }

  .btn--local {
    background: var(--interactive-accent, #6366f1);
    color: #fff;
  }

  .btn--remote {
    background: var(--background-modifier-hover, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    color: var(--text-normal, #cdd6f4);
  }

  .btn--ghost {
    background: none;
    color: var(--text-muted, #a6adc8);
  }
</style>
