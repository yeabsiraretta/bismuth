<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import { lintIssues, lintLoading } from '../stores/linting';
  import { groupBySeverity, severityLabel, severityIcon } from './writingLintLogic';
  import type { LintIssue } from '../services/linting';

  $: grouped = groupBySeverity($lintIssues);
  $: totalCount = $lintIssues.length;

  function handleApplyFix(issue: LintIssue) {
    window.dispatchEvent(new CustomEvent('lint-apply-fix', { detail: issue }));
  }
</script>

<div class="writing-lint-panel">
  <PanelHeader icon="spell-check" title="Writing Lint" count={totalCount || undefined}>
    <svelte:fragment slot="actions">
      {#if $lintLoading}
        <span class="loading-indicator">...</span>
      {/if}
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    {#if totalCount === 0}
      <div class="empty-state">
        <Icon name="check-circle" size={28} />
        <p class="empty-title">No issues found</p>
        <p class="empty-desc">Your writing looks great!</p>
      </div>
    {:else}
      {#each ['error', 'warning', 'info'] as severity}
        {#if grouped[severity]?.length}
          <div class="severity-group">
            <div class="severity-header">
              <Icon name={severityIcon(severity)} size={12} />
              <span>{severityLabel(severity)} ({grouped[severity].length})</span>
            </div>
            {#each grouped[severity] as issue}
              <div class="issue-item">
                <p class="issue-message">{issue.message}</p>
                {#if issue.suggestion !== null}
                  <button class="fix-btn" on:click={() => handleApplyFix(issue)}> Fix </button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>

<style>
  .writing-lint-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 var(--spacing-sm, 8px);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    padding: var(--spacing-lg, 24px);
    color: var(--text-muted);
    font-size: var(--font-size-sm, 12px);
  }

  .empty-title {
    margin: 0;
    font-weight: 600;
  }
  .empty-desc {
    margin: 0;
    opacity: 0.7;
  }

  .severity-group {
    margin-bottom: var(--spacing-sm, 8px);
  }

  .severity-header {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    padding: var(--spacing-xs, 4px) 0;
    text-transform: uppercase;
  }

  .issue-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    padding: 4px 6px;
    border-radius: var(--radius-sm, 4px);
    font-size: 12px;
  }

  .issue-item:hover {
    background: var(--bg-hover, #f3f4f6);
  }

  .issue-message {
    flex: 1;
    margin: 0;
    color: var(--text-primary);
  }

  .fix-btn {
    flex-shrink: 0;
    padding: 2px 6px;
    font-size: 10px;
    border: 1px solid var(--border-primary, #e5e7eb);
    background: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    color: var(--interactive-accent, #3b82f6);
  }

  .fix-btn:hover {
    background: var(--interactive-accent, #3b82f6);
    color: white;
  }

  .loading-indicator {
    font-size: 11px;
    color: var(--text-muted);
  }
</style>
