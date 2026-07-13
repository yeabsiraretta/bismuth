<script lang="ts">
  import { DEFAULT_PRIORITIES, DEFAULT_STATUSES } from '@/hubs/planner/types/pm-types';
  import type { GanttGranularity, PMTask } from '@/hubs/planner/types/pm-types';
  import {
    barStyle,
    computeTimeline,
    diffDays,
    generateColumns,
    isMilestone,
  } from '@/hubs/planner/services/pm-scheduling';
  import { getPMSettings, updatePMSettings } from '@/hubs/planner/stores/pm-task-store.svelte';

  interface Props {
    tasks: PMTask[];
    onTaskClick?: ((taskId: string) => void) | undefined;
  }

  let { tasks, onTaskClick = undefined }: Props = $props();

  let pmSettings = $derived(getPMSettings());
  let granularity = $state<GanttGranularity>('week');
  let hideDone = $state(false);

  $effect(() => {
    granularity = pmSettings.ganttGranularity;
    hideDone = pmSettings.hideDoneInGantt;
  });

  let visibleTasks = $derived(
    hideDone ? tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled') : tasks
  );

  let timeline = $derived(computeTimeline(visibleTasks));
  let columns = $derived(
    generateColumns(timeline.paddedMin, timeline.paddedMax, timeline.totalDays, granularity)
  );

  function statusColor(status: string): string {
    return DEFAULT_STATUSES.find((s) => s.id === status)?.color ?? '#6b7280';
  }

  function priorityColor(priority: string): string {
    return DEFAULT_PRIORITIES.find((p) => p.id === priority)?.color ?? '#6b7280';
  }

  function onGranChange(e: Event) {
    granularity = (e.target as HTMLSelectElement).value as GanttGranularity;
    updatePMSettings({ ganttGranularity: granularity });
  }

  function onHideDoneChange() {
    hideDone = !hideDone;
    updatePMSettings({ hideDoneInGantt: hideDone });
  }
</script>

<div class="gantt-view">
  <div class="gantt-controls">
    <select
      class="gran-select"
      value={granularity}
      onchange={onGranChange}
      aria-label="Granularity"
    >
      <option value="day">Day</option>
      <option value="week">Week</option>
      <option value="month">Month</option>
      <option value="quarter">Quarter</option>
    </select>
    <label class="hide-done">
      <input type="checkbox" checked={hideDone} onchange={onHideDoneChange} />
      <span>Hide done</span>
    </label>
    <span class="task-count">{visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}</span>
  </div>

  {#if visibleTasks.length === 0}
    <div class="gantt-empty">
      No tasks with dates. Add tasks with start/due dates to see the Gantt chart.
    </div>
  {:else}
    <div class="gantt-container">
      <div class="gantt-sidebar">
        <div class="gantt-sidebar-header">Task</div>
        {#each visibleTasks as task (task.id)}
          <div
            class="gantt-row-label"
            title={task.title}
            role="button"
            tabindex="0"
            onclick={() => onTaskClick?.(task.id)}
            onkeydown={(e) => e.key === 'Enter' && onTaskClick?.(task.id)}
          >
            <span class="label-priority" style="color:{priorityColor(task.priority)}">&#9679;</span>
            <span class="label-text">{task.title}</span>
          </div>
        {/each}
      </div>

      <div class="gantt-timeline">
        <div class="gantt-header">
          {#each columns as col (col.label)}
            <div class="gantt-col-header" style="left:{col.left}%;width:{col.width}%">
              {col.label}
            </div>
          {/each}
        </div>
        <div class="gantt-body">
          <div
            class="today-line"
            style="left:{(timeline.todayOffset / timeline.totalDays) * 100}%"
          ></div>
          {#each visibleTasks as task (task.id)}
            <div class="gantt-row">
              {#if isMilestone(task)}
                <div
                  class="milestone-marker"
                  style="left:{(diffDays(timeline.paddedMin, task.dueDate ?? '') /
                    timeline.totalDays) *
                    100}%"
                  title="{task.title} (milestone)"
                >
                  &#9670;
                </div>
              {:else}
                <div
                  class="gantt-bar"
                  style={barStyle(
                    task,
                    timeline.paddedMin,
                    timeline.totalDays,
                    statusColor(task.status)
                  )}
                  title="{task.title} ({task.progress}%)"
                  role="button"
                  tabindex="0"
                  onclick={() => onTaskClick?.(task.id)}
                  onkeydown={(e) => e.key === 'Enter' && onTaskClick?.(task.id)}
                >
                  {#if task.progress > 0}
                    <div class="bar-progress" style="width:{task.progress}%"></div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .gantt-view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .gantt-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .gran-select {
    padding: 2px 8px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
  }
  .hide-done {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.65rem;
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .task-count {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    margin-left: auto;
  }
  .gantt-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    padding: 24px;
    text-align: center;
  }
  .gantt-container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .gantt-sidebar {
    width: 160px;
    flex-shrink: 0;
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
  }
  .gantt-sidebar-header {
    padding: 0 10px;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    height: 28px;
    display: flex;
    align-items: center;
  }
  .gantt-row-label {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 10px;
    height: 28px;
    font-size: 0.65rem;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 30%, transparent);
    cursor: pointer;
  }
  .gantt-row-label:hover {
    background: var(--color-surface-hover);
  }
  .label-priority {
    font-size: 8px;
    flex-shrink: 0;
  }
  .label-text {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .gantt-timeline {
    flex: 1;
    overflow: auto;
    position: relative;
  }
  .gantt-header {
    position: sticky;
    top: 0;
    z-index: var(--z-raised);
    height: 28px;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: relative;
  }
  .gantt-col-header {
    position: absolute;
    top: 0;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    border-right: 1px solid color-mix(in srgb, var(--color-border) 30%, transparent);
    box-sizing: border-box;
  }
  .gantt-body {
    min-width: 800px;
    position: relative;
  }
  .gantt-row {
    position: relative;
    height: 28px;
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 20%, transparent);
  }
  .gantt-bar {
    position: absolute;
    top: 4px;
    height: 20px;
    border-radius: 3px;
    min-width: 4px;
    overflow: hidden;
    opacity: 0.85;
    cursor: pointer;
  }
  .gantt-bar:hover {
    opacity: 1;
  }
  .bar-progress {
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
  }
  .milestone-marker {
    position: absolute;
    top: 6px;
    transform: translateX(-50%);
    color: var(--color-accent);
    font-size: 12px;
  }
  .today-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-error);
    z-index: var(--z-raised);
    pointer-events: none;
  }
</style>
