<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  interface FileChange {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'untracked';
  }

  // Mock data for now - will be replaced with actual Git integration
  let stagedChanges: FileChange[] = [];
  let unstagedChanges: FileChange[] = [
    { path: '00-09_System/00_System_Management/00.01_System_Meta.md', status: 'modified' },
    { path: '00-09_System_00_System_Mana...', status: 'modified' },
    { path: '00.00_System_Index', status: 'modified' },
    { path: '2026-05-24 Initial Concept', status: 'added' },
  ];
  let commitMessage = '';

  function getStatusLabel(status: string) {
    switch (status) {
      case 'added':
        return 'U';
      case 'modified':
        return 'M';
      case 'deleted':
        return 'D';
      case 'untracked':
        return '?';
      default:
        return '';
    }
  }

  function handleCommit() {
    if (!commitMessage) return;
    console.log('Committing:', commitMessage);
    // TODO: Implement Git commit via Tauri command
  }

  function stageFile(change: FileChange) {
    unstagedChanges = unstagedChanges.filter((c) => c !== change);
    stagedChanges = [...stagedChanges, change];
  }

  function unstageFile(change: FileChange) {
    stagedChanges = stagedChanges.filter((c) => c !== change);
    unstagedChanges = [...unstagedChanges, change];
  }
</script>

<div class="git-panel">
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
    >
      <Icon name="git-commit" size={14} />
      Commit
    </button>
  </div>

  <div class="changes-section">
    <div class="section-header">
      <Icon name="check-circle" size={14} />
      <span>Staged Changes</span>
      <span class="count">{stagedChanges.length}</span>
    </div>

    {#each stagedChanges as change}
      <div class="file-change">
        <span class="status-badge status-{change.status}">
          {getStatusLabel(change.status)}
        </span>
        <span class="file-path" title={change.path}>{change.path}</span>
        <button class="unstage-btn" title="Unstage" on:click={() => unstageFile(change)}>
          <Icon name="minus" size={12} />
        </button>
      </div>
    {/each}
  </div>

  <div class="changes-section">
    <div class="section-header">
      <Icon name="file-text" size={14} />
      <span>Changes</span>
      <span class="count">+{unstagedChanges.length}</span>
    </div>

    {#each unstagedChanges as change}
      <div class="file-change">
        <span class="status-badge status-{change.status}">
          {getStatusLabel(change.status)}
        </span>
        <span class="file-path" title={change.path}>{change.path}</span>
        <button class="stage-btn" title="Stage" on:click={() => stageFile(change)}>
          <Icon name="plus" size={12} />
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .git-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--spacing-s);
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

  .changes-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs, 4px);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-smallest);
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: var(--spacing-xxs, 4px);
  }

  .count {
    margin-left: auto;
    background-color: var(--background-modifier-border);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
  }

  .file-change {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xxs, 4px) var(--spacing-xs);
    border-radius: var(--radius-s);
    font-size: var(--font-smallest);
    font-family: var(--font-monospace);
    transition: background-color 0.15s ease;
  }

  .file-change:hover {
    background-color: var(--interactive-hover);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 2px;
    font-size: 10px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .status-added,
  .status-untracked {
    background-color: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .status-modified {
    background-color: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  .status-deleted {
    background-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .file-path {
    flex: 1;
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stage-btn,
  .unstage-btn {
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
    opacity: 0;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .file-change:hover .stage-btn,
  .file-change:hover .unstage-btn {
    opacity: 1;
  }

  .stage-btn:hover,
  .unstage-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
</style>
