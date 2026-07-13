<script lang="ts">
  import { addNote, getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent, updateCachedContent } from '@/hubs/editor/services/file-ops';
  import {
    type HabitData,
    type HabitFrequency,
    addTask as addTaskToContent,
    allTasksDone,
    computeStreak,
    generateHabitContent,
    habitFilePath,
    isHabitFile,
    logCompletion,
    parseHabitFile,
    removeTask as removeTaskFromContent,
    renameHabit as renameHabitContent,
    resetAllTasks,
    setAllTasks,
    setRepeatable,
    taskProgress,
    todayStr,
    toggleTask as toggleTaskInContent,
  } from '@/hubs/planner/services/habit-service';
  import { createNote, writeNote } from '@/sal/note-service';
  import Panel from '@/ui/panel.svelte';

  interface LoadedHabit {
    path: string;
    data: HabitData;
    streak: number;
  }

  let habits = $state<LoadedHabit[]>([]);
  let expanded = $state<string | null>(null);
  let showCreate = $state(false);
  let newName = $state('');
  let newFreq = $state<HabitFrequency>('daily');
  let newTaskInput = $state('');
  let addingTaskTo = $state<string | null>(null);
  let newTaskTitle = $state('');
  let contextMenu = $state<{ x: number; y: number; habit: LoadedHabit } | null>(null);
  let renamingPath = $state<string | null>(null);
  let renameValue = $state('');

  const today = todayStr();

  let completedCount = $derived(
    habits.filter(
      (h) => allTasksDone(h.data.tasks) || h.data.log.some((e) => e.date === today && e.completed)
    ).length
  );

  function loadHabits() {
    const notes = getNotes();
    const loaded: LoadedHabit[] = [];
    for (const note of notes) {
      const content = getCachedContent(note.path);
      if (!content || !isHabitFile(content)) continue;
      const data = parseHabitFile(content);
      loaded.push({
        path: note.path,
        data,
        streak: computeStreak(data.log, data.frequency),
      });
    }
    loaded.sort((a, b) => a.data.name.localeCompare(b.data.name));
    habits = loaded;
  }

  $effect(() => {
    loadHabits();
  });

  async function persistHabit(path: string, content: string) {
    updateCachedContent(path, content);
    await writeNote(path, content);
    loadHabits();
  }

  async function createHabit() {
    const name = newName.trim();
    if (!name) return;
    const tasks = newTaskInput
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);
    const content = generateHabitContent({ name, frequency: newFreq, tasks });
    const path = habitFilePath(name);
    const now = Date.now();
    try {
      const folder = 'habits';
      await createNote(name, folder, content);
      updateCachedContent(path, content);
    } catch {
      await writeNote(path, content);
      updateCachedContent(path, content);
    }
    addNote({ path, title: name, modifiedAt: now, createdAt: now, size: content.length });
    newName = '';
    newFreq = 'daily';
    newTaskInput = '';
    showCreate = false;
    loadHabits();
  }

  async function handleToggleTask(habit: LoadedHabit, taskIdx: number) {
    const content = getCachedContent(habit.path);
    if (!content) return;
    const updated = toggleTaskInContent(content, taskIdx);
    await persistHabit(habit.path, updated);
  }

  async function handleLogDay(habit: LoadedHabit) {
    const content = getCachedContent(habit.path);
    if (!content) return;
    const done = allTasksDone(habit.data.tasks);
    let updated = logCompletion(content, today, done);
    if (habit.data.repeatable) {
      updated = resetAllTasks(updated);
    }
    await persistHabit(habit.path, updated);
  }

  async function handleAddTask(habit: LoadedHabit) {
    const title = newTaskTitle.trim();
    if (!title) return;
    const content = getCachedContent(habit.path);
    if (!content) return;
    const updated = addTaskToContent(content, title);
    newTaskTitle = '';
    addingTaskTo = null;
    await persistHabit(habit.path, updated);
  }

  async function handleRemoveTask(habit: LoadedHabit, taskIdx: number) {
    const content = getCachedContent(habit.path);
    if (!content) return;
    const updated = removeTaskFromContent(content, taskIdx);
    await persistHabit(habit.path, updated);
  }

  function toggleExpand(path: string) {
    expanded = expanded === path ? null : path;
  }

  function openContextMenu(e: MouseEvent, habit: LoadedHabit) {
    e.preventDefault();
    contextMenu = { x: e.clientX, y: e.clientY, habit };
  }

  function closeContextMenu() {
    contextMenu = null;
  }

  function startRename(habit: LoadedHabit) {
    renamingPath = habit.path;
    renameValue = habit.data.name;
    closeContextMenu();
  }

  async function commitRename(habit: LoadedHabit) {
    const name = renameValue.trim();
    if (!name || name === habit.data.name) {
      renamingPath = null;
      return;
    }
    const content = getCachedContent(habit.path);
    if (!content) return;
    const updated = renameHabitContent(content, name);
    renamingPath = null;
    await persistHabit(habit.path, updated);
  }

  async function handleToggleAll(habit: LoadedHabit) {
    const content = getCachedContent(habit.path);
    if (!content) return;
    const done = allTasksDone(habit.data.tasks);
    const updated = setAllTasks(content, !done);
    await persistHabit(habit.path, updated);
  }

  async function handleToggleRepeatable(habit: LoadedHabit) {
    const content = getCachedContent(habit.path);
    if (!content) return;
    const updated = setRepeatable(content, !habit.data.repeatable);
    closeContextMenu();
    await persistHabit(habit.path, updated);
  }

  function freqLabel(f: HabitFrequency): string {
    if (f === 'daily') return 'Daily';
    if (f === 'weekdays') return 'Weekdays';
    if (f === 'weekly') return 'Weekly';
    return 'Monthly';
  }
</script>

<Panel title="Habits">
  {#snippet badge()}<span class="panel-badge">{completedCount}/{habits.length}</span>{/snippet}

  <div class="habits-panel">
    {#if habits.length === 0 && !showCreate}
      <div class="panel-empty">
        <p>No habits yet</p>
        <p class="panel-empty-hint">Create habit files with linked tasks</p>
      </div>
    {/if}

    {#each habits as habit (habit.path)}
      {@const prog = taskProgress(habit.data.tasks)}
      {@const done = allTasksDone(habit.data.tasks)}
      {@const isExpanded = expanded === habit.path}
      <div class="habit-row" class:habit-done={done}>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="habit-header" oncontextmenu={(e) => openContextMenu(e, habit)}>
          <button class="habit-expand" onclick={() => toggleExpand(habit.path)}>
            <span class="habit-chevron" class:open={isExpanded}>›</span>
          </button>
          <button
            class="habit-check-btn"
            onclick={() => handleToggleAll(habit)}
            title={done ? 'Uncheck all tasks' : 'Check all tasks'}
          >
            <span class="habit-check" class:checked={done}></span>
          </button>
          {#if renamingPath === habit.path}
            <input
              class="habit-rename-input"
              bind:value={renameValue}
              onkeydown={(e) => {
                if (e.key === 'Enter') commitRename(habit);
                if (e.key === 'Escape') renamingPath = null;
              }}
              onblur={() => commitRename(habit)}
            />
          {:else}
            <button class="habit-name-btn" onclick={() => toggleExpand(habit.path)}>
              <span class="habit-name" class:done>{habit.data.name}</span>
            </button>
          {/if}
          <span class="habit-meta">
            {#if habit.data.repeatable}<span class="habit-repeatable" title="Repeatable">↻</span
              >{/if}
            {#if habit.streak > 0}<span class="habit-streak">{habit.streak}d</span>{/if}
            <span class="habit-progress">{prog.done}/{prog.total}</span>
          </span>
        </div>
      </div>

      {#if isExpanded}
        <div class="habit-detail">
          <div class="habit-freq">
            {freqLabel(habit.data.frequency)}{#if habit.data.repeatable}
              · Repeatable{/if}
          </div>

          {#if habit.data.description}
            <p class="habit-desc">{habit.data.description}</p>
          {/if}

          <div class="task-list">
            {#each habit.data.tasks as task, idx (idx)}
              <div class="task-row">
                <button class="task-toggle" onclick={() => handleToggleTask(habit, idx)}>
                  <span class="task-check" class:checked={task.done}></span>
                  <span class="task-title" class:done={task.done}>{task.title}</span>
                </button>
                <button
                  class="task-remove"
                  onclick={() => handleRemoveTask(habit, idx)}
                  title="Remove task">×</button
                >
              </div>
            {/each}
          </div>

          {#if addingTaskTo === habit.path}
            <div class="task-add-row">
              <input
                class="task-add-input"
                placeholder="Task title..."
                bind:value={newTaskTitle}
                onkeydown={(e) => e.key === 'Enter' && handleAddTask(habit)}
              />
              <button
                class="task-add-btn"
                onclick={() => handleAddTask(habit)}
                disabled={!newTaskTitle.trim()}>+</button
              >
              <button
                class="task-add-cancel"
                onclick={() => {
                  addingTaskTo = null;
                  newTaskTitle = '';
                }}>×</button
              >
            </div>
          {:else}
            <button class="link-task-btn" onclick={() => (addingTaskTo = habit.path)}
              >+ Link Task</button
            >
          {/if}

          {#if prog.total > 0}
            <button
              class="log-btn"
              onclick={() => handleLogDay(habit)}
              disabled={!done}
              title={done
                ? habit.data.repeatable
                  ? 'Log today as complete and reset tasks'
                  : 'Log today as complete'
                : 'Complete all tasks first'}
            >
              {habit.data.repeatable ? 'Log & Reset' : 'Log Complete'}
            </button>
          {/if}
        </div>
      {/if}
    {/each}

    {#if showCreate}
      <div class="create-form">
        <input class="create-input" placeholder="Habit name..." bind:value={newName} />
        <select class="create-select" bind:value={newFreq}>
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <textarea
          class="create-tasks"
          placeholder="Tasks (one per line)..."
          bind:value={newTaskInput}
          rows="3"></textarea>
        <div class="create-actions">
          <button class="create-btn" onclick={createHabit} disabled={!newName.trim()}>Create</button
          >
          <button
            class="create-cancel"
            onclick={() => {
              showCreate = false;
              newName = '';
              newTaskInput = '';
            }}>Cancel</button
          >
        </div>
      </div>
    {:else}
      <button class="habit-new-btn" onclick={() => (showCreate = true)}>+ New Habit</button>
    {/if}
  </div>
</Panel>

{#if contextMenu}
  {@const cm = contextMenu}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div
    class="ctx-backdrop"
    onclick={closeContextMenu}
    oncontextmenu={(e) => {
      e.preventDefault();
      closeContextMenu();
    }}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
    <div class="ctx-menu" style="left:{cm.x}px;top:{cm.y}px" onclick={(e) => e.stopPropagation()}>
      <button class="ctx-item" onclick={() => startRename(cm.habit)}>Rename</button>
      <button class="ctx-item" onclick={() => handleToggleRepeatable(cm.habit)}>
        {cm.habit.data.repeatable ? '✓ ' : ''}Repeatable
      </button>
    </div>
  </div>
{/if}

<style>
  .habits-panel {
    display: flex;
    flex-direction: column;
  }
  .habit-row {
    border-bottom: 1px solid var(--color-border);
  }
  .habit-done {
    background: oklch(from var(--color-success) l c h / 0.05);
  }
  .habit-header {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    background: transparent;
    cursor: default;
    text-align: left;
    font-family: inherit;
  }
  .habit-expand,
  .habit-check-btn,
  .habit-name-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    display: flex;
    align-items: center;
  }
  .habit-name-btn {
    flex: 1;
    min-width: 0;
  }
  .habit-rename-input {
    flex: 1;
    min-width: 0;
    padding: 2px 4px;
    font-size: 0.75rem;
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    outline: none;
  }
  .habit-repeatable {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
  .habit-header:hover {
    background: var(--color-surface-hover);
  }
  .habit-chevron {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    transition: transform var(--transition-base);
    flex-shrink: 0;
  }
  .habit-chevron.open {
    transform: rotate(90deg);
  }
  .habit-check {
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-s);
    flex-shrink: 0;
  }
  .habit-check.checked {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }
  .habit-name {
    font-size: 0.75rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .habit-name.done {
    text-decoration: line-through;
    color: var(--color-text-muted);
  }
  .habit-meta {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-shrink: 0;
  }
  .habit-streak {
    font-size: 0.6rem;
    color: var(--color-accent);
    font-weight: 600;
  }
  .habit-progress {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
  }
  .habit-detail {
    padding: 4px 10px 10px 26px;
    border-bottom: 1px solid var(--color-border);
  }
  .habit-freq {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }
  .habit-desc {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    margin: 0 0 6px;
  }
  .task-list {
    display: flex;
    flex-direction: column;
  }
  .task-row {
    display: flex;
    align-items: center;
  }
  .task-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    padding: 4px 0;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    min-width: 0;
  }
  .task-toggle:hover {
    color: var(--color-accent);
  }
  .task-check {
    width: 12px;
    height: 12px;
    border: 1.5px solid var(--color-border);
    border-radius: 2px;
    flex-shrink: 0;
  }
  .task-check.checked {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }
  .task-title {
    font-size: 0.7rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .task-title.done {
    text-decoration: line-through;
    color: var(--color-text-muted);
  }
  .task-remove {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-subtle);
    font-size: 0.8rem;
    padding: 2px 4px;
    opacity: 0;
    flex-shrink: 0;
  }
  .task-row:hover .task-remove {
    opacity: 1;
  }
  .task-remove:hover {
    color: var(--color-error);
  }
  .link-task-btn {
    padding: 3px 0;
    font-size: 0.65rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    text-align: left;
  }
  .link-task-btn:hover {
    color: var(--color-accent);
  }
  .task-add-row {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }
  .task-add-input {
    flex: 1;
    padding: 3px 6px;
    font-size: 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    outline: none;
  }
  .task-add-input:focus {
    border-color: var(--color-accent);
  }
  .task-add-btn,
  .task-add-cancel {
    padding: 3px 6px;
    font-size: 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }
  .task-add-btn:hover:not(:disabled) {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .task-add-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .task-add-cancel:hover {
    color: var(--color-error);
  }
  .log-btn {
    margin-top: 6px;
    padding: 4px 10px;
    font-size: 0.65rem;
    font-weight: 500;
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-accent);
    cursor: pointer;
  }
  .log-btn:hover:not(:disabled) {
    background: var(--color-accent);
    color: var(--color-background);
  }
  .log-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .create-form {
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-top: 1px solid var(--color-border);
  }
  .create-input,
  .create-tasks {
    padding: 4px 6px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    outline: none;
    resize: vertical;
  }
  .create-input:focus,
  .create-tasks:focus {
    border-color: var(--color-accent);
  }
  .create-select {
    padding: 4px 6px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    outline: none;
  }
  .create-actions {
    display: flex;
    gap: 4px;
  }
  .create-btn {
    padding: 4px 10px;
    font-size: 0.65rem;
    font-weight: 500;
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-s);
    background: var(--color-accent);
    color: var(--color-background);
    cursor: pointer;
  }
  .create-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .create-cancel {
    padding: 4px 10px;
    font-size: 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .create-cancel:hover {
    color: var(--color-error);
  }
  .habit-new-btn {
    padding: 6px 12px;
    font-size: 0.7rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    text-align: left;
  }
  .habit-new-btn:hover {
    color: var(--color-accent);
    background: var(--color-surface-hover);
  }
  .ctx-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
  }
  .ctx-menu {
    position: fixed;
    min-width: 140px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    box-shadow: 0 4px 12px oklch(0 0 0 / 0.2);
    padding: 4px 0;
    z-index: 10000;
  }
  .ctx-item {
    display: block;
    width: 100%;
    padding: 6px 12px;
    font-size: 0.7rem;
    border: none;
    background: transparent;
    color: var(--color-text);
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }
  .ctx-item:hover {
    background: var(--color-surface-hover);
    color: var(--color-accent);
  }
</style>
