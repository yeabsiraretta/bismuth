<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    activeElement,
    updateActiveElement,
    removeElement,
    addRelationship,
    removeRelationship,
    elements,
  } from '../stores/rpgStore';
  import { ELEMENT_META } from '../types/elementMeta';
  import { getVisibleRelationships, getOtherElementId } from '../services/relationshipService';
  import {
    getTasksForElement,
    createTask,
    toggleTask,
    deleteTask,
  } from '../services/narrativeService';
  import type { RpgTask, RelationshipType } from '../types';

  let editingDesc = false;
  let descDraft = '';
  let newRelTargetId = '';
  let newRelType: RelationshipType = 'bidirectional';
  let showRelForm = false;
  let newTaskText = '';

  $: el = $activeElement;
  $: meta = el ? ELEMENT_META[el.type] : null;
  $: visibleRels = el ? getVisibleRelationships(el.id) : [];
  $: tasks = el ? getTasksForElement(el.id) : [];
  $: otherElements = $elements.filter((e) => e.id !== el?.id);

  function startEditDesc() {
    if (!el) return;
    descDraft = el.description;
    editingDesc = true;
  }

  function saveDesc() {
    updateActiveElement({ description: descDraft });
    editingDesc = false;
  }

  function handleAddRelationship() {
    if (!el || !newRelTargetId) return;
    addRelationship(el.id, newRelTargetId, newRelType);
    newRelTargetId = '';
    showRelForm = false;
    visibleRels = getVisibleRelationships(el.id);
  }

  function handleAddTask() {
    if (!el || !newTaskText.trim()) return;
    createTask(el.id, newTaskText.trim());
    newTaskText = '';
    tasks = getTasksForElement(el.id);
  }

  function handleToggleTask(t: RpgTask) {
    toggleTask(t.id);
    if (el) tasks = getTasksForElement(el.id);
  }

  function handleDeleteTask(t: RpgTask) {
    deleteTask(t.id);
    if (el) tasks = getTasksForElement(el.id);
  }
</script>

{#if el && meta}
  <div class="el-editor">
    <div class="el-header">
      <span class="el-type-badge" style="background: {meta.color}">
        <Icon name={meta.icon} size={12} color="#fff" />
        {meta.label}
      </span>
      <h3 class="el-title">{el.name}</h3>
      <button class="el-delete" on:click={() => removeElement(el.id)} title="Delete element">
        <Icon name="trash-2" size={13} />
      </button>
    </div>

    <div class="el-section">
      <div class="el-section-header">
        <span class="el-section-title">Description</span>
        {#if !editingDesc}
          <button class="el-edit-btn" on:click={startEditDesc}
            ><Icon name="edit" size={11} /></button
          >
        {/if}
      </div>
      {#if editingDesc}
        <textarea class="el-desc-edit" bind:value={descDraft} rows={6}></textarea>
        <div class="el-form-actions">
          <button class="el-btn" on:click={saveDesc}>Save</button>
          <button class="el-btn-ghost" on:click={() => (editingDesc = false)}>Cancel</button>
        </div>
      {:else}
        <p class="el-desc">{el.description || 'No description yet.'}</p>
      {/if}
    </div>

    {#if el.type === 'npc' || el.type === 'pc'}
      <div class="el-section">
        <div class="el-section-title">Character Details</div>
        <div class="el-attrs">
          {#if el.type === 'npc'}
            <div class="el-attr">
              <span class="el-attr-label">Type</span><span>{el.npcType ?? '-'}</span>
            </div>
            <div class="el-attr">
              <span class="el-attr-label">Occupation</span><span>{el.occupation ?? '-'}</span>
            </div>
            <div class="el-attr">
              <span class="el-attr-label">Arc</span><span>{el.characterArc ?? '-'}</span>
            </div>
            <div class="el-attr">
              <span class="el-attr-label">Stake</span><span>{el.stake ?? '-'}</span>
            </div>
          {/if}
          <div class="el-attr">
            <span class="el-attr-label">Beliefs</span><span>{el.beliefs ?? '-'}</span>
          </div>
          <div class="el-attr">
            <span class="el-attr-label">Lie</span><span>{el.lie ?? '-'}</span>
          </div>
          <div class="el-attr">
            <span class="el-attr-label">Need</span><span>{el.need ?? '-'}</span>
          </div>
          <div class="el-attr">
            <span class="el-attr-label">Want</span><span>{el.want ?? '-'}</span>
          </div>
          <div class="el-attr">
            <span class="el-attr-label">Strengths</span><span>{el.strengths ?? '-'}</span>
          </div>
          <div class="el-attr">
            <span class="el-attr-label">Weaknesses</span><span>{el.weaknesses ?? '-'}</span>
          </div>
        </div>
      </div>
    {/if}

    <div class="el-section">
      <div class="el-section-header">
        <span class="el-section-title">Relationships ({visibleRels.length})</span>
        <button class="el-edit-btn" on:click={() => (showRelForm = !showRelForm)}
          ><Icon name="plus" size={11} /></button
        >
      </div>
      {#if showRelForm}
        <div class="el-rel-form">
          <select bind:value={newRelTargetId}>
            <option value="">Select element...</option>
            {#each otherElements as oe}
              <option value={oe.id}>{ELEMENT_META[oe.type].label}: {oe.name}</option>
            {/each}
          </select>
          <select bind:value={newRelType}>
            <option value="bidirectional">Bidirectional</option>
            <option value="unidirectional">Unidirectional</option>
            <option value="parent">Parent</option>
            <option value="child">Child</option>
          </select>
          <button class="el-btn" on:click={handleAddRelationship}>Add</button>
        </div>
      {/if}
      {#each visibleRels as rel}
        {@const otherId = getOtherElementId(rel, el.id)}
        {@const other = $elements.find((e) => e.id === otherId)}
        <div class="el-rel-item">
          {#if other}
            <Icon
              name={ELEMENT_META[other.type].icon}
              size={12}
              color={ELEMENT_META[other.type].color}
            />
            <span class="el-rel-name">{other.name}</span>
          {:else}
            <span class="el-rel-name">Unknown</span>
          {/if}
          <span class="el-rel-type">{rel.type}</span>
          <button class="el-rel-remove" on:click={() => removeRelationship(rel.id)}>
            <Icon name="x" size={10} />
          </button>
        </div>
      {/each}
    </div>

    <div class="el-section">
      <div class="el-section-header">
        <span class="el-section-title">Tasks ({tasks.filter((t) => !t.completed).length} open)</span
        >
      </div>
      <div class="el-task-add">
        <input
          bind:value={newTaskText}
          placeholder="New task..."
          on:keydown={(e) => e.key === 'Enter' && handleAddTask()}
        />
        <button class="el-btn" on:click={handleAddTask}>Add</button>
      </div>
      {#each tasks as t}
        <div class="el-task-item" class:completed={t.completed}>
          <input type="checkbox" checked={t.completed} on:change={() => handleToggleTask(t)} />
          <span class="el-task-text">{t.description}</span>
          <button class="el-rel-remove" on:click={() => handleDeleteTask(t)}>
            <Icon name="x" size={10} />
          </button>
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="el-empty">
    <p>Select an element from the sidebar</p>
  </div>
{/if}

<style>
  .el-editor {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    height: 100%;
  }
  .el-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .el-type-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    color: #fff;
    white-space: nowrap;
  }
  .el-title {
    flex: 1;
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .el-delete {
    border: none;
    background: none;
    color: var(--text-faint);
    cursor: pointer;
    padding: 4px;
  }
  .el-delete:hover {
    color: var(--text-error);
  }
  .el-section {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    padding: 8px;
  }
  .el-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .el-section-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .el-edit-btn {
    border: none;
    background: none;
    color: var(--text-faint);
    cursor: pointer;
    padding: 2px;
  }
  .el-edit-btn:hover {
    color: var(--interactive-accent);
  }
  .el-desc {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-normal);
    white-space: pre-wrap;
  }
  .el-desc-edit {
    width: 100%;
    font-size: 0.8rem;
    padding: 6px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    resize: vertical;
    font-family: inherit;
  }
  .el-form-actions {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }
  .el-btn {
    font-size: 0.7rem;
    padding: 3px 8px;
    border-radius: var(--radius-s);
    border: none;
    background: var(--interactive-accent);
    color: #fff;
    cursor: pointer;
  }
  .el-btn-ghost {
    font-size: 0.7rem;
    padding: 3px 8px;
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .el-attrs {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .el-attr {
    display: flex;
    gap: 6px;
    font-size: 0.75rem;
  }
  .el-attr-label {
    font-weight: 600;
    color: var(--text-muted);
    min-width: 70px;
  }
  .el-rel-form {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 6px;
  }
  .el-rel-form select {
    font-size: 0.75rem;
    padding: 3px 6px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
  }
  .el-rel-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 4px;
    font-size: 0.75rem;
    border-radius: var(--radius-s);
  }
  .el-rel-item:hover {
    background: var(--background-modifier-hover);
  }
  .el-rel-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .el-rel-type {
    font-size: 0.6rem;
    color: var(--text-faint);
    background: var(--background-modifier-hover);
    padding: 0 4px;
    border-radius: 4px;
  }
  .el-rel-remove {
    border: none;
    background: none;
    color: var(--text-faint);
    cursor: pointer;
    padding: 2px;
  }
  .el-rel-remove:hover {
    color: var(--text-error);
  }
  .el-task-add {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }
  .el-task-add input {
    flex: 1;
    font-size: 0.75rem;
    padding: 3px 6px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
  }
  .el-task-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 4px;
    font-size: 0.75rem;
  }
  .el-task-item.completed .el-task-text {
    text-decoration: line-through;
    color: var(--text-faint);
  }
  .el-task-text {
    flex: 1;
  }
  .el-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    font-size: 0.8rem;
  }
</style>
