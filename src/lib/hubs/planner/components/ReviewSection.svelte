<script lang="ts">
  import type { ReviewGroup } from '@/hubs/planner/services/journal-review';
  import { openNote } from '@/ui/panel-actions';
  import { SvelteSet } from 'svelte/reactivity';

  let { groups, title = 'On This Day' }: { groups: ReviewGroup[]; title?: string } = $props();

  let expandedGroups = new SvelteSet<string>();

  function toggleGroup(label: string) {
    if (expandedGroups.has(label)) expandedGroups.delete(label);
    else expandedGroups.add(label);
  }
</script>

{#if groups.length > 0}
  <div class="rs-section">
    <h4 class="rs-title">{title}</h4>
    {#each groups as group (group.label + group.targetDate)}
      <div class="rs-group">
        <button class="rs-group-header" onclick={() => toggleGroup(group.label + group.targetDate)}>
          <span class="rs-label">{group.label}</span>
          <span class="rs-date">{group.targetDate}</span>
          <span class="rs-count">{group.entries.length}</span>
          <span
            class="rs-chevron"
            class:expanded={expandedGroups.has(group.label + group.targetDate)}>&#x25B8;</span
          >
        </button>
        {#if expandedGroups.has(group.label + group.targetDate)}
          <ul class="rs-entries">
            {#each group.entries as entry (entry.path)}
              <li class="rs-entry">
                <button class="rs-entry-link" onclick={() => openNote(entry.path)}>
                  <span class="rs-entry-title">{entry.title}</span>
                  {#if entry.tags.length > 0}
                    <span class="rs-entry-tags">{entry.tags.slice(0, 3).join(', ')}</span>
                  {/if}
                </button>
                {#if entry.preview}
                  <p class="rs-entry-preview">{entry.preview}</p>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .rs-section {
    border-top: 1px solid var(--color-border);
    padding-top: 8px;
  }
  .rs-title {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    margin: 0 0 6px;
  }
  .rs-group {
    background: var(--color-surface);
    border-radius: var(--radius-s);
    overflow: hidden;
    margin-bottom: 4px;
  }
  .rs-group-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    font-size: 0.7rem;
    border: none;
    background: none;
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }
  .rs-group-header:hover {
    background: var(--color-surface-hover);
  }
  .rs-label {
    font-weight: 600;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rs-date {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    flex-shrink: 0;
  }
  .rs-count {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    background: var(--color-background);
    padding: 0 5px;
    border-radius: var(--radius-m);
    flex-shrink: 0;
  }
  .rs-chevron {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    transition: transform var(--transition-base);
    flex-shrink: 0;
  }
  .rs-chevron.expanded {
    transform: rotate(90deg);
  }
  .rs-entries {
    list-style: none;
    margin: 0;
    padding: 0 8px 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .rs-entry {
    border-left: 2px solid var(--color-accent);
    padding-left: 8px;
  }
  .rs-entry-link {
    display: flex;
    align-items: baseline;
    gap: 6px;
    width: 100%;
    background: none;
    border: none;
    padding: 2px 0;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }
  .rs-entry-title {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--color-accent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .rs-entry-link:hover .rs-entry-title {
    text-decoration: underline;
  }
  .rs-entry-tags {
    font-size: 0.55rem;
    color: var(--color-text-subtle);
    flex-shrink: 0;
  }
  .rs-entry-preview {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    margin: 2px 0 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
