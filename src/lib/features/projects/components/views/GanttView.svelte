<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { filteredPMTasks, pmTasks, updatePMTask } from '../../stores/pmTaskStore';
  import { pmSettings } from '../../stores/projectStore';
  import { DEFAULT_STATUSES, DEFAULT_PRIORITIES } from '../../types';
  import { isMilestone, diffDays } from '../../services/scheduling';
  import type { PMTask, GanttGranularity } from '../../types';

  let granularity: GanttGranularity = $pmSettings.ganttGranularity;

  $: hideDone = $pmSettings.hideDoneInGantt;
  $: tasks = hideDone
    ? $filteredPMTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled')
    : $filteredPMTasks;

  // Timeline range
  $: allDates = tasks.flatMap((t) => [t.startDate, t.dueDate].filter(Boolean) as string[]);
  $: minDate =
    allDates.length > 0
      ? allDates.reduce((a, b) => (a < b ? a : b))
      : new Date().toISOString().slice(0, 10);
  $: maxDate =
    allDates.length > 0 ? allDates.reduce((a, b) => (a > b ? a : b)) : addDays(minDate, 30);
  $: paddedMin = addDays(minDate, -7);
  $: paddedMax = addDays(maxDate, 14);
  $: totalDays = Math.max(1, diffDays(paddedMin, paddedMax));

  $: today = new Date().toISOString().slice(0, 10);
  $: todayOffset = Math.max(0, diffDays(paddedMin, today));

  function addDays(date: string, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function barStyle(task: PMTask): string {
    const start = task.startDate ?? task.dueDate ?? today;
    const end = task.dueDate ?? task.startDate ?? today;
    const left = Math.max(0, diffDays(paddedMin, start));
    const width = Math.max(1, diffDays(start, end));
    const color = DEFAULT_STATUSES.find((s) => s.id === task.status)?.color ?? '#6b7280';
    return `left:${(left / totalDays) * 100}%;width:${(width / totalDays) * 100}%;background:${color}`;
  }

  function priorityColor(p: string): string {
    return DEFAULT_PRIORITIES.find((pr) => pr.id === p)?.color ?? '#6b7280';
  }

  // Time headers
  $: columns = generateColumns(paddedMin, paddedMax, granularity);

  function generateColumns(
    min: string,
    max: string,
    gran: GanttGranularity
  ): { label: string; left: number; width: number }[] {
    const cols: { label: string; left: number; width: number }[] = [];
    const d = new Date(min);
    const end = new Date(max);

    while (d <= end) {
      const start = d.toISOString().slice(0, 10);
      let label: string;
      let days: number;

      if (gran === 'day') {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        days = 1;
        d.setDate(d.getDate() + 1);
      } else if (gran === 'week') {
        label = `W${getWeekNumber(d)}`;
        days = 7;
        d.setDate(d.getDate() + 7);
      } else if (gran === 'month') {
        label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        days = daysInMonth(d);
        d.setMonth(d.getMonth() + 1);
        d.setDate(1);
      } else {
        label = `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
        days = 90;
        d.setMonth(d.getMonth() + 3);
        d.setDate(1);
      }

      const leftPx = diffDays(paddedMin, start);
      cols.push({ label, left: (leftPx / totalDays) * 100, width: (days / totalDays) * 100 });
    }
    return cols;
  }

  function getWeekNumber(d: Date): number {
    const start = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  }

  function daysInMonth(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }

  // Drag state
  let dragging: { taskId: string; startX: number; origStart: string; origEnd: string } | null =
    null;

  function handleBarMouseDown(e: MouseEvent, task: PMTask) {
    if (isMilestone(task)) return;
    dragging = {
      taskId: task.id,
      startX: e.clientX,
      origStart: task.startDate ?? today,
      origEnd: task.dueDate ?? today,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(_e: MouseEvent) {
    if (!dragging) return;
    // Visual feedback only — actual update on mouseup
  }

  async function handleMouseUp(e: MouseEvent) {
    if (!dragging) return;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    const dx = e.clientX - dragging.startX;
    const dayShift = Math.round(dx / (800 / totalDays));
    if (dayShift !== 0) {
      const task = $pmTasks.find((t) => t.id === dragging!.taskId);
      if (task) {
        await updatePMTask({
          ...task,
          startDate: addDays(dragging.origStart, dayShift),
          dueDate: addDays(dragging.origEnd, dayShift),
        });
      }
    }
    dragging = null;
  }
</script>

<div class="gantt-view">
  <div class="gantt-controls">
    <select bind:value={granularity} class="gran-select" aria-label="Granularity">
      <option value="day">Day</option>
      <option value="week">Week</option>
      <option value="month">Month</option>
      <option value="quarter">Quarter</option>
    </select>
  </div>

  <div class="gantt-container">
    <div class="gantt-sidebar">
      <div class="gantt-sidebar-header">Task</div>
      {#each tasks as task (task.id)}
        <div class="gantt-row-label" title={task.title}>
          <span class="label-priority" style="color:{priorityColor(task.priority)}">
            <Icon
              name={DEFAULT_PRIORITIES.find((p) => p.id === task.priority)?.icon ?? 'minus'}
              size={10}
            />
          </span>
          <span class="label-text">{task.title}</span>
        </div>
      {/each}
    </div>

    <div class="gantt-timeline">
      <div class="gantt-header">
        {#each columns as col}
          <div class="gantt-col-header" style="left:{col.left}%;width:{col.width}%">
            {col.label}
          </div>
        {/each}
      </div>
      <div class="gantt-body" style="position:relative">
        <div class="today-line" style="left:{(todayOffset / totalDays) * 100}%"></div>
        {#each tasks as task (task.id)}
          <div class="gantt-row">
            {#if isMilestone(task)}
              <div
                class="milestone-marker"
                style="left:{(diffDays(paddedMin, task.dueDate ?? today) / totalDays) * 100}%"
                title={task.title}
              >
                <Icon name="diamond" size={12} />
              </div>
            {:else}
              <div
                class="gantt-bar"
                style={barStyle(task)}
                on:mousedown={(e) => handleBarMouseDown(e, task)}
                title="{task.title} ({task.progress}%)"
                role="slider"
                aria-valuenow={task.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                tabindex="0"
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
    gap: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }
  .gran-select {
    padding: 2px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 11px;
  }
  .gantt-container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .gantt-sidebar {
    width: 180px;
    flex-shrink: 0;
    border-right: 1px solid var(--border-color);
    overflow-y: auto;
  }
  .gantt-sidebar-header {
    padding: var(--spacing-xs) var(--spacing-s);
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
    height: 28px;
  }
  .gantt-row-label {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 var(--spacing-s);
    height: 28px;
    font-size: 11px;
    color: var(--text-normal);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-bottom: 1px solid var(--background-modifier-border, rgba(0, 0, 0, 0.03));
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
    z-index: 2;
    height: 28px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    position: relative;
  }
  .gantt-col-header {
    position: absolute;
    top: 0;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: var(--text-muted);
    border-right: 1px solid var(--background-modifier-border, rgba(0, 0, 0, 0.05));
    box-sizing: border-box;
  }
  .gantt-body {
    min-width: 800px;
  }
  .gantt-row {
    position: relative;
    height: 28px;
    border-bottom: 1px solid var(--background-modifier-border, rgba(0, 0, 0, 0.03));
  }
  .gantt-bar {
    position: absolute;
    top: 4px;
    height: 20px;
    border-radius: 3px;
    cursor: ew-resize;
    min-width: 4px;
    overflow: hidden;
    opacity: 0.85;
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
    color: var(--interactive-accent);
  }
  .today-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #ef4444;
    z-index: 1;
    pointer-events: none;
  }
</style>
