<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import type { PortentType, LifecycleState } from '@/types/data/entity';

  export let title: string;
  export let snippet: string;
  export let created: string;
  export let path: string;
  export let type: string | undefined = undefined;
  export let selected = false;
  export let portentTypes: string[];
  export const lifecycleStates: string[] = []; // passed by parent, reserved for future use
  export let onSelect: (e: MouseEvent) => void;
  export let onAssignType: (type: PortentType) => void;
  export let onSetLifecycle: (lifecycle: LifecycleState) => void;
  export let onDelete: () => void;
  export let onArchive: (() => void) | undefined = undefined;
  export let onOrganize: ((folder: string) => void) | undefined = undefined;

  let organizeFolderInput = '';
  let showOrganizeInput = false;

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
  data-path={path}
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
  <div class="card-top">
    <div class="card-meta">
      {#if type}
        <span class="type-badge badge-{type.toLowerCase()}">{type}</span>
      {:else}
        <span class="type-badge badge-untyped">Unclassified</span>
      {/if}
      <span class="card-date">{formatDate(created)}</span>
    </div>
    <div class="quick-actions">
      <select
        class="quick-select"
        on:change={(e) => onAssignType(e.currentTarget.value)}
        on:click|stopPropagation
        title="Classify"
        aria-label="Assign type"
      >
        <option value="">Classify</option>
        {#each portentTypes as t}
          <option value={t}>{t}</option>
        {/each}
      </select>
      <button
        class="quick-btn"
        on:click|stopPropagation={() => (onArchive ? onArchive() : onSetLifecycle('archived'))}
        title="Archive"
        aria-label="Archive"
      >
        <Icon name="archive" size={14} />
      </button>
      {#if onOrganize}
        {#if showOrganizeInput}
          <input
            class="organize-input"
            type="text"
            bind:value={organizeFolderInput}
            placeholder="folder/"
            on:click|stopPropagation
            on:keydown|stopPropagation={(e) => {
              if (e.key === 'Enter' && organizeFolderInput.trim()) {
                onOrganize!(organizeFolderInput.trim());
                showOrganizeInput = false;
                organizeFolderInput = '';
              }
              if (e.key === 'Escape') { showOrganizeInput = false; organizeFolderInput = ''; }
            }}
          />
        {:else}
          <button
            class="quick-btn"
            on:click|stopPropagation={() => { showOrganizeInput = true; }}
            title="Organize to folder"
            aria-label="Organize"
          >
            <Icon name="folder-input" size={14} />
          </button>
        {/if}
      {/if}
      <button
        class="quick-btn quick-btn-danger"
        on:click|stopPropagation={onDelete}
        title="Delete"
        aria-label="Delete"
      >
        <Icon name="trash-2" size={14} />
      </button>
    </div>
  </div>

  <h3 class="card-title">{title}</h3>

  {#if snippet}
    <p class="card-snippet">{snippet}</p>
  {/if}
</div>

<style>
  .note-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-m);
    background-color: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .note-card:hover {
    border-color: var(--border-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .note-card.selected {
    border-color: var(--interactive-accent);
    box-shadow: 0 0 0 1px var(--interactive-accent);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-s);
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .card-date {
    font-size: var(--badge-font-size-sm, 10px);
    color: var(--text-faint);
  }

  .type-badge {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-xxs, 2px) var(--spacing-s);
    border-radius: var(--radius-s);
    font-size: var(--badge-font-size-sm, 10px);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .badge-untyped {
    background: var(--background-modifier-hover);
    color: var(--text-faint);
  }

  .badge-idea {
    background: color-mix(in srgb, var(--interactive-accent) 12%, transparent);
    color: var(--interactive-accent);
  }

  .badge-task {
    background: color-mix(in srgb, var(--status-added) 12%, transparent);
    color: var(--status-added);
  }

  .badge-reference {
    background: color-mix(in srgb, var(--status-warning) 12%, transparent);
    color: var(--status-warning);
  }

  .badge-question {
    background: color-mix(in srgb, var(--status-info) 12%, transparent);
    color: var(--status-info);
  }

  .badge-note {
    background: rgba(156, 163, 175, 0.12);
    color: var(--text-muted);
  }

  /* Quick actions — visible on hover */
  .quick-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-xxs, 4px);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .note-card:hover .quick-actions {
    opacity: 1;
  }

  .quick-select {
    padding: var(--spacing-xxs, 3px) var(--badge-padding-inline, 6px);
    background: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: var(--font-smallest);
    color: var(--text-muted);
    cursor: pointer;
  }

  .organize-input {
    width: 80px;
    padding: var(--spacing-xxs, 2px) var(--badge-padding-inline, 6px);
    background: var(--background-modifier-form-field);
    border: 1px solid var(--interactive-accent);
    border-radius: var(--radius-s);
    font-size: var(--font-smallest);
    color: var(--text-normal);
    outline: none;
  }

  .quick-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .quick-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .quick-btn-danger:hover {
    background: var(--background-modifier-error);
    color: var(--text-on-accent);
  }

  .card-title {
    margin: 0;
    font-size: var(--font-ui-small);
    font-weight: 600;
    color: var(--text-normal);
    line-height: 1.3;
  }

  .card-snippet {
    margin: 0;
    font-size: var(--font-smallest);
    color: var(--text-muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
