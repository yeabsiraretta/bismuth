<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { type FileChange, getStatusLabel } from './gitPanelLogic';

  export let changes: FileChange[] = [];
  export let label: string;
  export let icon: string;
  export let actionIcon: string;
  export let actionTitle: string;
  export let onAction: (change: FileChange) => void;
</script>

<div class="changes-section">
  <div class="section-header">
    <Icon name={icon} size={14} />
    <span>{label}</span>
    <span class="count">{changes.length}</span>
  </div>

  {#each changes as change}
    <div class="file-change">
      <span class="status-badge status-{change.status}">
        {getStatusLabel(change.status)}
      </span>
      <span class="file-path" title={change.path}>{change.path}</span>
      <button class="action-btn" title={actionTitle} on:click={() => onAction(change)}>
        <Icon name={actionIcon} size={12} />
      </button>
    </div>
  {/each}
</div>

<style>
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
    min-height: 22px;
    padding: 0 var(--spacing-l);
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

  .status-badge:global(.status-added),
  .status-badge:global(.status-untracked) {
    background-color: color-mix(in srgb, var(--status-added) 20%, transparent);
    color: var(--status-added);
  }

  .status-badge:global(.status-modified) {
    background-color: color-mix(in srgb, var(--status-modified) 20%, transparent);
    color: var(--status-modified);
  }

  .status-badge:global(.status-deleted) {
    background-color: color-mix(in srgb, var(--status-deleted) 20%, transparent);
    color: var(--status-deleted);
  }

  .file-path {
    flex: 1;
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-btn {
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

  .file-change:hover .action-btn {
    opacity: 1;
  }

  .action-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
</style>
