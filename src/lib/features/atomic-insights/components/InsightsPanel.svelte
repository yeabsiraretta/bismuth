<script lang="ts">
  /**
   * InsightsPanel — sidebar view showing structurally related notes
   * for the active note, ranked by Adamic-Adar index.
   */
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import { activeNote } from '@/stores/vault/vault';
  import {
    insightsResults, insightsLoading, insightsError, insightsConfig,
    getRelatedNotes, clearInsights, updateInsightsConfig,
  } from '../stores/insightsStore';
  import type { RelatedNote } from '../types';

  $: results = $insightsResults;
  $: loading = $insightsLoading;
  $: error = $insightsError;
  $: config = $insightsConfig;
  $: notePath = $activeNote?.path ?? '';

  $: if (notePath && config.autoUpdate) {
    refresh();
  }

  async function refresh(): Promise<void> {
    if (!notePath || loading) return;
    await getRelatedNotes(notePath);
  }

  function handleNoteClick(note: RelatedNote): void {
    import('@/appNavigation').then(m => m.openNote(note.path)).catch(() => {});
  }

  function toggleAutoUpdate(): void {
    updateInsightsConfig({ autoUpdate: !config.autoUpdate });
  }

  function reasonIcon(r: string): string {
    switch (r) {
      case 'graph': return 'git-branch';
      case 'time': return 'clock';
      case 'metadata': return 'tag';
      case 'edit-time': return 'edit';
      default: return 'info';
    }
  }
</script>

<div class="insights-panel">
  <PanelHeader icon="zap">
    <svelte:fragment slot="title">
      <span class="insights-title">Atomic Insights</span>
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <button
        class="action-btn"
        class:active={config.autoUpdate}
        on:click={toggleAutoUpdate}
        title={config.autoUpdate ? 'Auto-update on' : 'Auto-update off'}
      >
        <Icon name="refresh-cw" size={13} />
      </button>
      <button class="action-btn" on:click={refresh} title="Refresh" disabled={loading}>
        <Icon name="refresh-cw" size={13} />
      </button>
      <button class="action-btn" on:click={clearInsights} title="Clear">
        <Icon name="x" size={13} />
      </button>
    </svelte:fragment>
  </PanelHeader>

  <div class="insights-body">
    {#if !notePath}
      <div class="empty-state">
        <Icon name="file-text" size={28} />
        <p>Open a note to see related insights.</p>
      </div>
    {:else if loading}
      <div class="empty-state">
        <Icon name="loader" size={28} />
        <p>Analyzing link graph...</p>
      </div>
    {:else if error}
      <div class="empty-state error">
        <Icon name="alert-triangle" size={28} />
        <p>{error}</p>
      </div>
    {:else if results.length === 0}
      <div class="empty-state">
        <Icon name="search" size={28} />
        <p>No structurally related notes found.</p>
        <p class="hint">Build more links between atomic notes to improve results.</p>
      </div>
    {:else}
      <ul class="results-list">
        {#each results as note (note.path)}
          <li class="result-item">
            <button class="result-btn" on:click={() => handleNoteClick(note)} title={note.path}>
              <div class="result-top">
                <span class="result-label">{note.label}</span>
                <span class="result-score">{note.score.toFixed(2)}</span>
              </div>
              <div class="result-meta">
                <span class="result-reasons">
                  {#each note.reasons as reason}
                    <span class="reason-chip" title={reason}>
                      <Icon name={reasonIcon(reason)} size={10} />
                    </span>
                  {/each}
                </span>
                {#if note.commonNeighbors.length > 0}
                  <span class="result-neighbors" title={note.commonNeighbors.join(', ')}>
                    {note.commonNeighbors.length} shared
                  </span>
                {/if}
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .insights-panel { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
  .insights-title { font-size: 0.85rem; font-weight: 600; }
  .action-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 2px; border-radius: 3px; display: flex; }
  .action-btn:hover { background: var(--color-bg-secondary); }
  .action-btn.active { color: var(--color-accent); }
  .action-btn:disabled { opacity: 0.3; }
  .insights-body { flex: 1; overflow-y: auto; padding: 6px; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center; color: var(--color-text-muted); gap: 6px; padding: 2rem; min-height: 120px; }
  .empty-state p { margin: 0; font-size: 0.83rem; }
  .empty-state.error { color: var(--color-error, #e55); }
  .hint { font-size: 0.75rem; }
  .results-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  .result-item { margin: 0; }
  .result-btn { display: block; width: 100%; text-align: left; background: none; border: 1px solid transparent; border-radius: 6px; padding: 6px 8px; cursor: pointer; color: var(--color-text); font-family: inherit; }
  .result-btn:hover { background: var(--color-bg-secondary); border-color: var(--color-border); }
  .result-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  .result-label { font-size: 0.83rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .result-score { font-size: 0.72rem; font-weight: 600; color: var(--color-accent); font-family: var(--font-mono, monospace); flex-shrink: 0; }
  .result-meta { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
  .result-reasons { display: flex; gap: 2px; }
  .reason-chip { display: inline-flex; align-items: center; padding: 1px 3px; border-radius: 3px; background: var(--color-bg-secondary); color: var(--color-text-muted); }
  .result-neighbors { font-size: 0.7rem; color: var(--color-text-muted); }
</style>
