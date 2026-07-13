<script lang="ts">
  import { DEFAULT_PRIORITIES } from '@/hubs/planner/types/pm-types';
  import type { PMPriority } from '@/hubs/planner/types/pm-types';

  let {
    title = $bindable(''),
    dueDate = $bindable(''),
    priority = $bindable<PMPriority>('medium'),
    onadd,
  }: {
    title: string;
    dueDate: string;
    priority: PMPriority;
    onadd: () => void;
  } = $props();
</script>

<div class="add-form">
  <input
    class="add-input"
    type="text"
    placeholder="Task title"
    bind:value={title}
    onkeydown={(e) => e.key === 'Enter' && onadd()}
  />
  <div class="add-row">
    <input class="add-date" type="date" bind:value={dueDate} />
    <select class="add-prio" bind:value={priority}>
      {#each DEFAULT_PRIORITIES as p (p.id)}
        <option value={p.id}>{p.label}</option>
      {/each}
    </select>
    <button class="add-submit" onclick={onadd} disabled={!title.trim()}>Add</button>
  </div>
</div>

<style>
  .add-form {
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .add-input {
    padding: 4px 6px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
  }
  .add-row {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .add-date {
    flex: 1;
    padding: 3px 4px;
    font-size: 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
  }
  .add-prio {
    padding: 3px 4px;
    font-size: 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
  }
  .add-submit {
    padding: 3px 10px;
    font-size: 0.65rem;
    font-weight: 600;
    border: none;
    border-radius: var(--radius-s);
    background: var(--color-accent);
    color: var(--color-background);
    cursor: pointer;
  }
  .add-submit:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
