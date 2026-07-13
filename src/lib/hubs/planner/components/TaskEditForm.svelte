<script lang="ts">
  import { DEFAULT_PRIORITIES } from '@/hubs/planner/types/pm-types';
  import type { PMPriority } from '@/hubs/planner/types/pm-types';

  let {
    title = $bindable(''),
    description = $bindable(''),
    dueDate = $bindable(''),
    priority = $bindable<PMPriority>('medium'),
    onsave,
    oncancel,
  }: {
    title: string;
    description: string;
    dueDate: string;
    priority: PMPriority;
    onsave: () => void;
    oncancel: () => void;
  } = $props();
</script>

<li class="task-edit-item">
  <input
    class="edit-input"
    type="text"
    bind:value={title}
    onkeydown={(e) => e.key === 'Enter' && onsave()}
  />
  <textarea class="edit-desc" rows="2" placeholder="Description" bind:value={description}
  ></textarea>
  <div class="edit-row">
    <input class="edit-date" type="date" bind:value={dueDate} />
    <select class="edit-prio" bind:value={priority}>
      {#each DEFAULT_PRIORITIES as p (p.id)}
        <option value={p.id}>{p.label}</option>
      {/each}
    </select>
    <button class="edit-save" onclick={onsave}>Save</button>
    <button class="edit-cancel" onclick={oncancel}>Cancel</button>
  </div>
</li>

<style>
  .task-edit-item {
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-bottom: 1px solid var(--color-border);
  }
  .edit-input,
  .edit-desc {
    padding: 3px 6px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    resize: vertical;
  }
  .edit-row {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .edit-date,
  .edit-prio {
    padding: 3px 4px;
    font-size: 0.6rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
  }
  .edit-save {
    padding: 2px 8px;
    font-size: 0.6rem;
    font-weight: 600;
    border: none;
    border-radius: var(--radius-s);
    background: var(--color-accent);
    color: var(--color-background);
    cursor: pointer;
  }
  .edit-cancel {
    padding: 2px 8px;
    font-size: 0.6rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }
</style>
