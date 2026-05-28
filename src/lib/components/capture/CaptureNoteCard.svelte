<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let title: string;
  export let snippet: string;
  export let created: string;
  export let path: string;
  export let type: string | undefined = undefined;
  export let selected = false;
  export let portentTypes: string[];
  export let lifecycleStates: string[];
  export let onSelect: (e: MouseEvent) => void;
  export let onAssignType: (type: string) => void;
  export let onSetLifecycle: (lifecycle: string) => void;
  export let onDelete: () => void;

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
</script>

<div
  class="note-card"
  class:selected
  on:click={onSelect}
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(new MouseEvent('click'));
    }
  }}
  role="button"
  tabindex="0"
>
  <div class="note-header">
    <div class="note-title-row">
      <Icon name="file-text" size={14} />
      <span class="note-title">{title}</span>
      <span class="note-date">{formatDate(created)}</span>
    </div>
    {#if type}
      <span class="type-badge">{type}</span>
    {/if}
  </div>

  <div class="note-snippet">{snippet}</div>

  <div class="note-actions">
    <select
      class="action-select"
      on:change={(e) => onAssignType(e.currentTarget.value)}
      on:click|stopPropagation
    >
      <option value="">Type...</option>
      {#each portentTypes as t}
        <option value={t}>{t}</option>
      {/each}
    </select>

    <select
      class="action-select"
      on:change={(e) => onSetLifecycle(e.currentTarget.value)}
      on:click|stopPropagation
    >
      <option value="">Lifecycle...</option>
      {#each lifecycleStates as state}
        <option value={state}>{state}</option>
      {/each}
    </select>

    <button
      class="delete-btn"
      on:click|stopPropagation={onDelete}
      title="Delete"
    >
      <Icon name="trash-2" size={14} />
    </button>
  </div>
</div>

<style>
  .note-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background-color: var(--background-secondary);
    border: 2px solid transparent;
    border-radius: var(--radius-m);
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .note-card:hover {
    border-color: var(--border-color);
  }

  .note-card.selected {
    border-color: var(--interactive-accent);
    background-color: var(--background-modifier-form-field-highlighted);
  }

  .note-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .note-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .note-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-normal);
  }

  .note-date {
    font-size: 11px;
    color: var(--text-faint);
    margin-left: auto;
  }

  .type-badge {
    padding: 2px 8px;
    background-color: var(--background-modifier-border);
    color: var(--text-muted);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }

  .note-snippet {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }

  .note-actions {
    display: flex;
    gap: 8px;
  }

  .action-select {
    flex: 1;
    padding: 6px 10px;
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: 12px;
    cursor: pointer;
  }

  .delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .delete-btn:hover {
    background-color: var(--background-modifier-error);
    border-color: var(--text-error);
    color: var(--text-error);
  }
</style>
