<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import { entityGroups as entityGroupsStore } from '../stores/entity';

  export let onOpenNote: ((path: string) => void) | undefined = undefined;

  let expandedTypes: Set<string> = new Set();

  $: groups = $entityGroupsStore;

  function toggleType(type: string) {
    if (expandedTypes.has(type)) {
      expandedTypes.delete(type);
    } else {
      expandedTypes.add(type);
    }
    expandedTypes = expandedTypes;
  }

  function openNote(path: string) {
    onOpenNote?.(path);
  }
</script>

<div class="entity-browser" role="tabpanel" aria-label="Entities">
  <PanelHeader
    icon="layers"
    title="Entities"
    count={groups.reduce((sum, g) => sum + g.count, 0) || undefined}
  />

  <div class="entity-groups">
    {#if groups.length === 0}
      <div class="empty-state">
        <Icon name="layers" size={32} color="var(--text-faint)" />
        <p>No entities found</p>
        <span class="empty-hint">Entities are extracted from note frontmatter</span>
      </div>
    {/if}
    {#each groups as group}
      <div class="entity-group">
        <button
          class="group-header"
          on:click={() => toggleType(group.type)}
          title="Toggle {group.type} list"
        >
          <Icon name={expandedTypes.has(group.type) ? 'chevron-down' : 'chevron-right'} size={14} />
          <Icon name={group.icon} size={16} />
          <span class="group-type">{group.type}</span>
          <span class="group-count">{group.count}</span>
        </button>

        {#if expandedTypes.has(group.type)}
          <div class="group-notes">
            {#if group.notes.length === 0}
              <div class="empty-hint">No {group.type.toLowerCase()}s found</div>
            {:else}
              {#each group.notes as note}
                <button
                  class="note-item"
                  on:click={() => openNote(note.path)}
                  title="Open {note.title}"
                >
                  <Icon name="file-text" size={14} />
                  <span class="note-title">{note.title}</span>
                  {#if note.lifecycle}
                    <span class="lifecycle-badge">{note.lifecycle}</span>
                  {/if}
                </button>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .entity-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xl) var(--spacing-m);
    text-align: center;
  }
  .empty-state p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  .empty-hint {
    font-size: 0.75rem;
    color: var(--text-faint);
  }

  .entity-groups {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .entity-group {
    display: flex;
    flex-direction: column;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: background-color 0.15s ease;
    text-align: left;
  }

  .group-header:hover {
    background-color: var(--interactive-hover);
  }

  .group-type {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-normal);
  }

  .group-count {
    padding: 2px 8px;
    background-color: var(--background-modifier-border);
    color: var(--text-muted);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
  }

  .group-notes {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-left: 24px;
    margin-top: 4px;
  }

  .note-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: background-color 0.15s ease;
    text-align: left;
  }

  .note-item:hover {
    background-color: var(--interactive-hover);
  }

  .note-title {
    flex: 1;
    font-size: 12px;
    color: var(--text-normal);
  }

  .lifecycle-badge {
    padding: 2px 6px;
    background-color: var(--background-modifier-border);
    color: var(--text-faint);
    border-radius: 4px;
    font-size: 10px;
  }

  .empty-hint {
    padding: 12px;
    text-align: center;
    font-size: 12px;
    color: var(--text-faint);
    font-style: italic;
  }
</style>
