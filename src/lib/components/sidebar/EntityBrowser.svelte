<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { entityGroups as entityGroupsStore } from '@/stores/entity/entity';

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

<div class="entity-browser">
  <div class="browser-header">
    <Icon name="box" size={16} />
    <h3>Entity Browser</h3>
  </div>

  <div class="entity-groups">
    {#each groups as group}
      <div class="entity-group">
        <button class="group-header" on:click={() => toggleType(group.type)}>
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
                <button class="note-item" on:click={() => openNote(note.path)}>
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

  .browser-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .browser-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
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
