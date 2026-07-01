<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    filteredEntities,
    entityCountsByType,
    activeEntity,
    addEntity,
    removeEntity,
    selectEntity,
    editEntity,
    setTypeFilter,
    entityTypeFilter,
  } from '../stores/entityStore';
  import { ENTITY_TYPE_META, type EntityType } from '../types/entity';

  let newName = '';
  let newType: EntityType = 'character';
  let showCreate = false;
  let editingId: string | null = null;
  let editName = '';

  function handleCreate() {
    if (!newName.trim()) return;
    addEntity(newType, newName.trim());
    newName = '';
    showCreate = false;
  }

  function startEdit(id: string, name: string) {
    editingId = id;
    editName = name;
  }

  function saveEdit() {
    if (!editingId || !$activeEntity) return;
    editEntity({ ...$activeEntity, name: editName });
    editingId = null;
  }
</script>

<div class="ep-panel">
  <div class="ep-header">
    <h3>Entities</h3>
    <button
      class="ep-btn-add"
      on:click={() => {
        showCreate = !showCreate;
      }}
    >
      <Icon name="plus" size={14} />
    </button>
  </div>

  {#if showCreate}
    <div class="ep-create">
      <select bind:value={newType} class="ep-select">
        {#each ENTITY_TYPE_META as meta}
          <option value={meta.type}>{meta.label}</option>
        {/each}
      </select>
      <input
        bind:value={newName}
        placeholder="Name…"
        class="ep-input"
        on:keydown={(e) => e.key === 'Enter' && handleCreate()}
      />
      <button class="ep-btn-primary" on:click={handleCreate}>Add</button>
    </div>
  {/if}

  <div class="ep-type-tabs">
    <button
      class="ep-type-tab"
      class:active={$entityTypeFilter === null}
      on:click={() => setTypeFilter(null)}>All</button
    >
    {#each ENTITY_TYPE_META as meta}
      {#if ($entityCountsByType[meta.type] ?? 0) > 0}
        <button
          class="ep-type-tab"
          class:active={$entityTypeFilter === meta.type}
          on:click={() => setTypeFilter(meta.type)}
          style="--tab-color: {meta.color}"
        >
          <Icon name={meta.icon} size={12} />
          <span>{meta.pluralLabel}</span>
          <span class="ep-type-count">{$entityCountsByType[meta.type] ?? 0}</span>
        </button>
      {/if}
    {/each}
  </div>

  <div class="ep-list">
    {#each $filteredEntities as entity (entity.id)}
      {@const meta = ENTITY_TYPE_META.find((m) => m.type === entity.type)}
      <div class="ep-entity" class:selected={$activeEntity?.id === entity.id}>
        <button class="ep-entity-btn" on:click={() => selectEntity(entity.id)}>
          <span class="ep-entity-icon" style="color: {meta?.color ?? '#888'}">
            <Icon name={meta?.icon ?? 'file'} size={14} />
          </span>
          {#if editingId === entity.id}
            <input
              class="ep-edit-input"
              bind:value={editName}
              on:blur={saveEdit}
              on:keydown={(e) => e.key === 'Enter' && saveEdit()}
            />
          {:else}
            <span class="ep-entity-name">{entity.name}</span>
          {/if}
          <span class="ep-entity-type">{meta?.label ?? entity.type}</span>
        </button>
        <div class="ep-entity-actions">
          <button
            class="ep-action"
            title="Rename"
            on:click|stopPropagation={() => startEdit(entity.id, entity.name)}
          >
            <Icon name="edit-2" size={12} />
          </button>
          <button
            class="ep-action ep-delete"
            title="Delete"
            on:click|stopPropagation={() => removeEntity(entity.id)}
          >
            <Icon name="trash-2" size={12} />
          </button>
        </div>
      </div>
    {/each}
    {#if $filteredEntities.length === 0}
      <div class="ep-empty">No entities yet. Create one to start worldbuilding.</div>
    {/if}
  </div>

  {#if $activeEntity}
    <div class="ep-detail">
      <h4>{$activeEntity.name}</h4>
      <div class="ep-detail-field">
        <label>Description</label>
        <textarea
          class="ep-textarea"
          value={$activeEntity.description}
          on:input={(e) => editEntity({ ...$activeEntity, description: e.currentTarget.value })}
        />
      </div>
      <div class="ep-detail-field">
        <label>Tags</label>
        <input
          class="ep-input"
          value={$activeEntity.tags.join(', ')}
          on:change={(e) =>
            editEntity({
              ...$activeEntity,
              tags: e.currentTarget.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  .ep-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .ep-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .ep-header h3 {
    margin: 0;
    font-size: 14px;
  }
  .ep-btn-add {
    border: none;
    background: none;
    color: var(--text-normal);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
  }
  .ep-btn-add:hover {
    background: var(--background-modifier-hover, #333);
  }
  .ep-create {
    display: flex;
    gap: 6px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .ep-select,
  .ep-input {
    padding: 5px 8px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary, #1e1e1e);
    color: var(--text-normal, #ddd);
    font-size: 12px;
  }
  .ep-input {
    flex: 1;
  }
  .ep-btn-primary {
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    background: var(--interactive-accent, #7c3aed);
    color: #fff;
    cursor: pointer;
    font-size: 12px;
  }
  .ep-type-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .ep-type-tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 12px;
    background: none;
    color: var(--text-normal);
    cursor: pointer;
    font-size: 11px;
  }
  .ep-type-tab:hover {
    background: var(--background-modifier-hover, #333);
  }
  .ep-type-tab.active {
    background: var(--interactive-accent, #7c3aed);
    color: #fff;
    border-color: transparent;
  }
  .ep-type-count {
    opacity: 0.6;
  }
  .ep-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }
  .ep-entity {
    display: flex;
    align-items: center;
    padding: 0 8px;
    border-bottom: 1px solid var(--background-modifier-border, #2a2a2a);
  }
  .ep-entity.selected {
    background: var(--background-secondary-alt, #333);
  }
  .ep-entity-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 6px;
    border: none;
    background: none;
    color: var(--text-normal);
    cursor: pointer;
    text-align: left;
    font-size: 13px;
  }
  .ep-entity:hover {
    background: var(--background-modifier-hover, #2a2a2a);
  }
  .ep-entity-icon {
    display: flex;
  }
  .ep-entity-name {
    flex: 1;
  }
  .ep-entity-type {
    font-size: 10px;
    opacity: 0.5;
  }
  .ep-entity-actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .ep-entity:hover .ep-entity-actions {
    opacity: 1;
  }
  .ep-action {
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 3px;
  }
  .ep-action:hover {
    color: var(--text-normal);
  }
  .ep-delete:hover {
    color: var(--text-error, #f87171);
  }
  .ep-edit-input {
    flex: 1;
    padding: 2px 6px;
    border: 1px solid var(--interactive-accent, #7c3aed);
    border-radius: 3px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 13px;
  }
  .ep-detail {
    padding: 12px 14px;
    border-top: 1px solid var(--background-modifier-border, #333);
    background: var(--background-secondary, #252525);
  }
  .ep-detail h4 {
    margin: 0 0 10px;
    font-size: 14px;
  }
  .ep-detail-field {
    margin-bottom: 10px;
  }
  .ep-detail-field label {
    display: block;
    font-size: 11px;
    opacity: 0.6;
    margin-bottom: 4px;
  }
  .ep-textarea {
    width: 100%;
    min-height: 60px;
    padding: 6px 8px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 12px;
    resize: vertical;
  }
  .ep-empty {
    text-align: center;
    padding: 24px;
    opacity: 0.5;
    font-size: 12px;
  }
</style>
