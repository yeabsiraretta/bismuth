<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { getSettings } from '@/hubs/core/stores/settings-store.svelte';
  import {
    gitStatus,
    gitStageAll,
    gitCommit,
    gitPush,
    gitPull,
    type GitStatus,
  } from '@/sal/git-service';
  import Panel from '@/ui/panel.svelte';
  import { log } from '@/utils/log/logger';
  import { onMount } from 'svelte';

  let gitEnabled = $derived(getSettings().vault.enableGit);

  let status = $state<GitStatus | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let commitMsg = $state('');
  let pushing = $state(false);
  let pulling = $state(false);

  async function refresh() {
    loading = true;
    error = null;
    try {
      status = await gitStatus();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      status = null;
    } finally {
      loading = false;
    }
  }

  async function handleStageAll() {
    try {
      await gitStageAll();
      await refresh();
    } catch (e) {
      log.error('Stage all failed', e instanceof Error ? e : new Error(String(e)));
    }
  }

  async function handleCommit() {
    if (!commitMsg.trim() || !status || status.staged === 0) return;
    try {
      await gitCommit(commitMsg.trim());
      commitMsg = '';
      await refresh();
    } catch (e) {
      log.error('Commit failed', e instanceof Error ? e : new Error(String(e)));
    }
  }

  async function handlePush() {
    pushing = true;
    try {
      await gitPush();
      await refresh();
    } catch (e) {
      log.error('Push failed', e instanceof Error ? e : new Error(String(e)));
    } finally {
      pushing = false;
    }
  }

  async function handlePull() {
    pulling = true;
    try {
      await gitPull();
      await refresh();
    } catch (e) {
      log.error('Pull failed', e instanceof Error ? e : new Error(String(e)));
    } finally {
      pulling = false;
    }
  }

  onMount(() => {
    if (gitEnabled) refresh();
  });
</script>

<Panel title="Git">
  {#snippet actions()}
    <button class="panel-action" onclick={refresh} aria-label="Refresh" title="Refresh">
      <BIcon name="periodic" size={14} />
    </button>
  {/snippet}
  <div class="git-body">
    {#if !gitEnabled}
      <div class="panel-empty">Git integration is disabled. Enable it in Settings.</div>
    {:else if loading}
      <div class="panel-empty">Loading git status...</div>
    {:else if error}
      <div class="panel-empty">
        <p>{error}</p>
        <button class="git-action-link" onclick={refresh}>Retry</button>
      </div>
    {:else if status}
      <div class="branch-row">
        <BIcon name="git" size={12} />
        <span class="branch-name">{status.branch}</span>
        {#if status.clean}
          <span class="branch-badge clean">clean</span>
        {/if}
      </div>

      <div class="stat-grid">
        <div class="stat-item">
          <span class="stat-num">{status.staged}</span>
          <span class="stat-label">staged</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{status.modified}</span>
          <span class="stat-label">modified</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{status.untracked}</span>
          <span class="stat-label">untracked</span>
        </div>
      </div>

      {#if !status.clean}
        <button class="git-btn stage-btn" onclick={handleStageAll}> Stage All </button>
      {/if}

      <div class="commit-row">
        <input
          type="text"
          class="commit-input"
          placeholder="Commit message..."
          bind:value={commitMsg}
          onkeydown={(e) => e.key === 'Enter' && handleCommit()}
        />
        <button
          class="git-btn commit-btn"
          disabled={!commitMsg.trim() || !status || status.staged === 0}
          onclick={handleCommit}
        >
          Commit
        </button>
      </div>

      <div class="sync-row">
        <button class="git-btn sync-btn" onclick={handlePull} disabled={pulling}>
          {pulling ? 'Pulling...' : 'Pull'}
        </button>
        <button class="git-btn sync-btn" onclick={handlePush} disabled={pushing}>
          {pushing ? 'Pushing...' : 'Push'}
        </button>
      </div>
    {/if}
  </div>
</Panel>

<style>
  .git-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .git-action-link {
    background: none;
    border: none;
    color: var(--color-accent);
    cursor: pointer;
    font-size: 0.7rem;
    font-family: inherit;
    text-decoration: underline;
  }
  .branch-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    min-width: 0;
  }
  .branch-name {
    font-weight: 500;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .branch-badge {
    font-size: 0.6rem;
    padding: 1px 5px;
    border-radius: var(--radius-m);
    margin-left: auto;
  }
  .branch-badge.clean {
    background: oklch(from var(--color-accent) l c h / 0.15);
    color: var(--color-accent);
  }
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
  }
  .stat-num {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .stat-label {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .commit-row {
    display: flex;
    gap: 4px;
  }
  .commit-input {
    flex: 1;
    padding: 4px 8px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    outline: none;
  }
  .commit-input:focus {
    border-color: var(--color-accent);
  }
  .git-btn {
    padding: 4px 10px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    font-family: inherit;
  }
  .git-btn:hover:not(:disabled) {
    background: var(--color-surface-hover);
    border-color: var(--color-accent);
  }
  .git-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .commit-btn {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .commit-btn:hover:not(:disabled) {
    opacity: 0.9;
    background: var(--color-accent);
  }
  .stage-btn {
    width: 100%;
  }
  .sync-row {
    display: flex;
    gap: 4px;
  }
  .sync-btn {
    flex: 1;
  }
</style>
