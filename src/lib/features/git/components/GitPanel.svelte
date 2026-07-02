<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import GitFileList from './GitFileList.svelte';
  import { currentVault } from '@/stores/vault/vault';
  import { log } from '@/utils/logger';
  import {
    type FileChange,
    loadGitStatus,
    stageFile as doStage,
    unstageFile as doUnstage,
    commitChanges,
  } from './gitPanelLogic';

  let stagedChanges: FileChange[] = [];
  let unstagedChanges: FileChange[] = [];
  let commitMessage = '';
  let isGitRepo = false;
  let loading = true;
  let error: string | null = null;
  let branch = '';

  $: vaultRoot = $currentVault?.root_path || '';

  async function loadStatus() {
    if (!vaultRoot) return;
    loading = true;
    const status = await loadGitStatus(vaultRoot);
    isGitRepo = status.isGitRepo;
    branch = status.branch;
    stagedChanges = status.staged;
    unstagedChanges = status.unstaged;
    error = status.error;
    loading = false;
  }

  async function handleCommit() {
    if (!commitMessage || stagedChanges.length === 0) return;
    try {
      await commitChanges(vaultRoot, commitMessage);
      commitMessage = '';
      await loadStatus();
    } catch (err) {
      log.error('GitPanel: commit failed', err as Error);
    }
  }

  async function stageFile(change: FileChange) {
    try {
      await doStage(vaultRoot, change.path);
      await loadStatus();
    } catch (err) {
      log.error('GitPanel: stage failed', err as Error);
    }
  }

  async function unstageFile(change: FileChange) {
    try {
      await doUnstage(vaultRoot, change.path);
      await loadStatus();
    } catch (err) {
      log.error('GitPanel: unstage failed', err as Error);
    }
  }

  onMount(() => {
    loadStatus();
  });
  $: if (vaultRoot) loadStatus();
</script>

<div class="git-panel">
  <PanelHeader icon="git-branch" title="Git">
    <svelte:fragment slot="actions">
      <ActionButton icon="refresh-cw" title="Refresh status" on:click={loadStatus} />
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    {#if loading}
      <div class="git-loading">
        <Icon name="loader" size={24} />
        <span>Loading git status...</span>
      </div>
    {:else if !isGitRepo}
      <div class="git-empty">
        <Icon name="git-branch" size={28} />
        <p class="git-empty-title">Not a git repository</p>
        <p class="git-empty-desc">Initialize git in your vault to track changes</p>
      </div>
    {:else if error}
      <div class="git-error">
        <Icon name="alert-circle" size={24} />
        <span>{error}</span>
        <button class="retry-btn" on:click={loadStatus} title="Retry">Retry</button>
      </div>
    {:else}
      {#if branch}
        <div class="branch-info">
          <Icon name="git-branch" size={12} />
          <span>{branch}</span>
          <button class="refresh-btn" on:click={loadStatus} title="Refresh status">
            <Icon name="refresh-cw" size={12} />
          </button>
        </div>
      {/if}

      <div class="commit-section">
        <input
          type="text"
          placeholder="Commit message"
          bind:value={commitMessage}
          class="commit-input"
        />
        <button
          class="commit-btn"
          disabled={!commitMessage || stagedChanges.length === 0}
          on:click={handleCommit}
          title="Commit staged changes"
        >
          <Icon name="git-commit" size={14} />
          Commit
        </button>
      </div>

      <GitFileList
        changes={stagedChanges}
        label="Staged Changes"
        icon="check-circle"
        actionIcon="minus"
        actionTitle="Unstage"
        onAction={unstageFile}
      />

      <GitFileList
        changes={unstagedChanges}
        label="Changes"
        icon="file-text"
        actionIcon="plus"
        actionTitle="Stage"
        onAction={stageFile}
      />

      {#if stagedChanges.length === 0 && unstagedChanges.length === 0}
        <div class="git-clean">
          <Icon name="check-circle" size={20} />
          <p>Working tree clean</p>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .git-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-s);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }

  .commit-section {
    display: flex;
    gap: var(--spacing-xs);
  }

  .commit-input {
    flex: 1;
    padding: var(--spacing-xs) var(--spacing-s);
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-smallest);
  }

  .commit-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: var(--font-smallest);
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .commit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .git-loading,
  .git-empty,
  .git-error,
  .git-clean {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xl) var(--spacing-m);
    color: var(--text-muted);
    text-align: center;
  }

  .git-empty-title,
  .git-clean p {
    font-size: var(--font-ui-small);
    font-weight: 500;
    margin: 0;
  }

  .git-empty-desc {
    font-size: var(--font-ui-smaller, 11px);
    margin: 0;
    opacity: 0.7;
  }

  .git-error span {
    font-size: var(--font-ui-small);
    color: var(--text-error, #ef4444);
  }

  .retry-btn {
    padding: var(--spacing-xs) var(--spacing-s);
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-smallest);
    cursor: pointer;
  }

  .retry-btn:hover {
    background-color: var(--interactive-hover);
  }

  .branch-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-smallest);
    color: var(--text-muted);
    padding: var(--spacing-xs) 0;
  }

  .branch-info span {
    font-weight: 500;
    color: var(--text-normal);
  }

  .refresh-btn {
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
  }

  .refresh-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
</style>
