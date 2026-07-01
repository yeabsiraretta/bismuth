<script lang="ts">
  /**
   * AgentChangeReview — displays and manages pending agent proposed changes.
   * Approve/Reject operations go through agentStore only — no direct invoke().
   */
  import { log } from '@/utils/logger';
  import { pendingChanges, approveChange, rejectChange } from '../stores/agentStore';
  import type { AgentProposedChange } from '../types/llm';

  export let vaultRoot: string;

  let processingIds = new Set<string>();
  let errorMap: Record<string, string> = {};

  const actionColors: Record<AgentProposedChange['action'], string> = {
    create: 'badge--create',
    update: 'badge--update',
    delete: 'badge--delete',
    rename: 'badge--rename',
  };

  function getDiffLines(content: string | null): { type: '+' | '-' | ' '; text: string }[] {
    if (!content) return [];
    return content.split('\n').map((line) => {
      if (line.startsWith('+')) return { type: '+', text: line };
      if (line.startsWith('-')) return { type: '-', text: line };
      return { type: ' ', text: line };
    });
  }

  async function handleApprove(change: AgentProposedChange): Promise<void> {
    if (processingIds.has(change.changeId)) return;
    processingIds = new Set([...processingIds, change.changeId]);
    errorMap = { ...errorMap };
    delete errorMap[change.changeId];
    try {
      await approveChange(vaultRoot, change.changeId);
      log.info('AgentChangeReview: change approved', { changeId: change.changeId });
    } catch (err) {
      errorMap = { ...errorMap, [change.changeId]: `Approve failed: ${err}` };
      log.error('AgentChangeReview: approve failed', err as Error);
    } finally {
      processingIds = new Set([...processingIds].filter((id) => id !== change.changeId));
    }
  }

  async function handleReject(change: AgentProposedChange): Promise<void> {
    if (processingIds.has(change.changeId)) return;
    processingIds = new Set([...processingIds, change.changeId]);
    errorMap = { ...errorMap };
    delete errorMap[change.changeId];
    try {
      await rejectChange(vaultRoot, change.changeId);
      log.info('AgentChangeReview: change rejected', { changeId: change.changeId });
    } catch (err) {
      errorMap = { ...errorMap, [change.changeId]: `Reject failed: ${err}` };
      log.error('AgentChangeReview: reject failed', err as Error);
    } finally {
      processingIds = new Set([...processingIds].filter((id) => id !== change.changeId));
    }
  }
</script>

<div class="change-review">
  {#if $pendingChanges.length === 0}
    <div class="empty-state">
      <p class="empty-text">No pending changes</p>
    </div>
  {:else}
    <div class="changes-list" role="list" aria-label="Pending agent changes">
      {#each $pendingChanges as change (change.changeId)}
        <article
          class="change-card"
          role="listitem"
          aria-label="Change: {change.action} {change.targetPath}"
        >
          <div class="change-header">
            <span class="action-badge {actionColors[change.action]}">{change.action}</span>
            <span class="target-path" title={change.targetPath}
              >{change.targetPath.split('/').pop() ?? change.targetPath}</span
            >
            <span class="agent-name">{change.agentName}</span>
          </div>

          {#if change.rationale}
            <p class="change-rationale">{change.rationale}</p>
          {/if}

          {#if change.action === 'update' && change.proposedContent}
            <div class="diff-view" aria-label="Diff for {change.targetPath}">
              {#each getDiffLines(change.proposedContent) as line}
                <div class="diff-line diff-line--{line.type}">{line.text}</div>
              {/each}
            </div>
          {:else if change.action === 'rename' && change.newPath}
            <p class="rename-target">Rename to: <code>{change.newPath}</code></p>
          {/if}

          {#if errorMap[change.changeId]}
            <div class="change-error" role="alert">{errorMap[change.changeId]}</div>
          {/if}

          <div class="change-actions">
            <button
              class="action-btn action-btn--approve"
              disabled={processingIds.has(change.changeId)}
              on:click={() => handleApprove(change)}
              aria-label="Approve change to {change.targetPath}">Approve</button
            >
            <button
              class="action-btn action-btn--reject"
              disabled={processingIds.has(change.changeId)}
              on:click={() => handleReject(change)}
              aria-label="Reject change to {change.targetPath}">Reject</button
            >
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<style>
  .change-review {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .empty-text {
    color: var(--text-muted);
    font-size: var(--font-ui-small);
  }
  .changes-list {
    overflow-y: auto;
    padding: var(--spacing-s);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }
  .change-card {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    padding: var(--spacing-m);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }
  .change-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    flex-wrap: wrap;
  }
  .action-badge {
    font-size: var(--font-smallest);
    font-weight: 600;
    text-transform: uppercase;
    padding: 2px var(--spacing-xs);
    border-radius: var(--radius-s);
    letter-spacing: 0.04em;
  }
  .badge--create {
    background: var(--background-modifier-success, #d1fae5);
    color: var(--text-success, #065f46);
  }
  .badge--update {
    background: #fef3c7;
    color: #92400e;
  }
  .badge--delete {
    background: var(--background-modifier-error, #fee2e2);
    color: var(--text-error, #991b1b);
  }
  .badge--rename {
    background: var(--background-modifier-border);
    color: var(--text-muted);
  }
  .target-path {
    font-size: var(--font-ui-small);
    font-weight: 500;
    color: var(--text-normal);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .agent-name {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
  .change-rationale {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
  }
  .diff-view {
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    padding: var(--spacing-xs);
    max-height: 120px;
    overflow-y: auto;
    font-family: var(--font-monospace, monospace);
    font-size: var(--font-smallest);
  }
  .diff-line {
    padding: 1px 4px;
    white-space: pre;
  }
  .diff-line--\+ {
    background: rgba(0, 200, 100, 0.12);
    color: var(--text-success, #065f46);
  }
  .diff-line--\- {
    background: rgba(255, 60, 60, 0.12);
    color: var(--text-error, #991b1b);
  }
  .rename-target {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    margin: 0;
  }
  .rename-target code {
    font-size: var(--font-ui-smaller);
    background: var(--background-modifier-border);
    padding: 1px 4px;
    border-radius: 3px;
  }
  .change-error {
    font-size: var(--font-ui-smaller);
    color: var(--text-error);
    padding: var(--spacing-xs);
    background: var(--background-modifier-error);
    border-radius: var(--radius-s);
  }
  .change-actions {
    display: flex;
    gap: var(--spacing-s);
  }
  .action-btn {
    padding: var(--spacing-xs) var(--spacing-m);
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: var(--font-ui-small);
    font-weight: 500;
    min-height: 32px;
  }
  .action-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .action-btn--approve {
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
  }
  .action-btn--approve:hover:not(:disabled) {
    background: var(--interactive-accent-hover);
  }
  .action-btn--reject {
    background: var(--background-modifier-border);
    color: var(--text-normal);
  }
  .action-btn--reject:hover:not(:disabled) {
    background: var(--background-modifier-error);
    color: var(--text-error);
  }
</style>
