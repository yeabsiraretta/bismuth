<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { allCalendarItems, calendarFocusDate } from '../../stores/calendarStore';
  import type { GanttTask, GanttGroup } from '../../types/prisma';

  $: ganttData = buildGanttData($allCalendarItems, $calendarFocusDate);
  $: dateRange = buildDateRange($calendarFocusDate);
  $: totalDays = dateRange.length;

  interface GanttRow {
    task: GanttTask;
    startCol: number;
    spanCols: number;
  }

  function buildGanttData(
    items: typeof $allCalendarItems,
    focus: Date,
  ): GanttGroup[] {
    const rangeStart = new Date(focus);
    rangeStart.setDate(rangeStart.getDate() - 7);
    const rangeEnd = new Date(focus);
    rangeEnd.setDate(rangeEnd.getDate() + 28);

    const startStr = formatDate(rangeStart);
    const endStr = formatDate(rangeEnd);

    // Filter events in range that have duration
    const relevant = items.filter(e =>
      e.date >= startStr && e.date <= endStr,
    );

    // Group by project/category
    const groups = new Map<string, GanttTask[]>();
    for (const e of relevant) {
      const group = e.project || e.categoryId || 'Ungrouped';
      if (!groups.has(group)) groups.set(group, []);

      const endDate = computeEndDate(e.date, e.durationMinutes);
      groups.get(group)!.push({
        id: e.id,
        title: e.title,
        startDate: e.date,
        endDate,
        progress: e.completed ? 100 : 0,
        dependencies: [],
        group,
        color: e.color,
        eventId: e.id,
      });
    }

    return [...groups.entries()].map(([id, tasks]) => ({
      id,
      label: id,
      tasks: tasks.sort((a, b) => a.startDate.localeCompare(b.startDate)),
    }));
  }

  function buildDateRange(focus: Date): string[] {
    const start = new Date(focus);
    start.setDate(start.getDate() - 7);
    const dates: string[] = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(formatDate(d));
    }
    return dates;
  }

  function computeEndDate(startDate: string, durationMinutes: number | null): string {
    if (!durationMinutes) return startDate;
    const d = new Date(startDate);
    d.setDate(d.getDate() + Math.max(0, Math.ceil(durationMinutes / 1440) - 1));
    return formatDate(d);
  }

  function getTaskPosition(task: GanttTask): { startCol: number; spanCols: number } {
    const startIdx = dateRange.indexOf(task.startDate);
    const endIdx = dateRange.indexOf(task.endDate);
    if (startIdx === -1) return { startCol: 0, spanCols: 1 };
    const span = endIdx === -1 ? 1 : Math.max(1, endIdx - startIdx + 1);
    return { startCol: startIdx, spanCols: span };
  }

  function formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDayLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return `${d.getDate()}`;
  }

  function formatMonthLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('default', { month: 'short' });
  }

  function isToday(dateStr: string): boolean {
    return dateStr === formatDate(new Date());
  }

  function isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr + 'T12:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
  }
</script>

<div class="gantt-view">
  {#if ganttData.length === 0}
    <div class="gantt-empty">
      <Icon name="bar-chart-2" size={32} />
      <p>No events to display in Gantt view</p>
      <p class="gantt-hint">Events with dates and durations will appear here</p>
    </div>
  {:else}
    <div class="gantt-container">
      <!-- Header: date columns -->
      <div class="gantt-header" style="grid-template-columns: 160px repeat({totalDays}, 1fr)">
        <div class="gantt-label-col">Task</div>
        {#each dateRange as dateStr, i}
          <div
            class="gantt-date-col"
            class:today={isToday(dateStr)}
            class:weekend={isWeekend(dateStr)}
          >
            {#if i === 0 || dateStr.endsWith('-01')}
              <span class="month-label">{formatMonthLabel(dateStr)}</span>
            {/if}
            <span class="day-label">{formatDayLabel(dateStr)}</span>
          </div>
        {/each}
      </div>

      <!-- Groups and tasks -->
      {#each ganttData as group}
        <div class="gantt-group-header">{group.label}</div>
        {#each group.tasks as task}
          {@const pos = getTaskPosition(task)}
          <div class="gantt-row" style="grid-template-columns: 160px repeat({totalDays}, 1fr)">
            <div class="gantt-task-label" title={task.title}>
              {task.title}
            </div>
            {#each dateRange as dateStr}
              <div
                class="gantt-cell"
                class:today={isToday(dateStr)}
                class:weekend={isWeekend(dateStr)}
              ></div>
            {/each}
            <!-- Bar overlay -->
            <div
              class="gantt-bar"
              style="
                grid-column: {pos.startCol + 2} / span {pos.spanCols};
                background: {task.color ?? 'var(--interactive-accent)'};
              "
              title="{task.title}: {task.startDate} → {task.endDate}"
            >
              {#if task.progress > 0}
                <div class="gantt-progress" style="width: {task.progress}%"></div>
              {/if}
              <span class="gantt-bar-label">{task.title}</span>
            </div>
          </div>
        {/each}
      {/each}
    </div>
  {/if}
</div>

<style>
  .gantt-view {
    overflow: auto;
    height: 100%;
    font-size: var(--font-smallest);
  }

  .gantt-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xl);
    color: var(--text-muted);
  }

  .gantt-hint { font-size: var(--font-smallest); color: var(--text-faint); }

  .gantt-container { min-width: 800px; }

  .gantt-header {
    display: grid;
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--background-primary);
    border-bottom: 2px solid var(--background-modifier-border);
  }

  .gantt-label-col {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-weight: 600;
    border-right: 1px solid var(--background-modifier-border);
  }

  .gantt-date-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2px 1px;
    border-right: 1px solid var(--background-modifier-border-hover);
    min-width: 24px;
  }

  .gantt-date-col.today { background: var(--interactive-accent-hover); }
  .gantt-date-col.weekend { background: var(--background-secondary); }

  .month-label { font-size: 8px; color: var(--text-faint); text-transform: uppercase; }
  .day-label { font-size: 10px; }

  .gantt-group-header {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-weight: 600;
    font-size: var(--font-ui-small);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .gantt-row {
    display: grid;
    position: relative;
    min-height: 28px;
    border-bottom: 1px solid var(--background-modifier-border-hover);
  }

  .gantt-task-label {
    padding: 4px var(--spacing-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-right: 1px solid var(--background-modifier-border);
    display: flex;
    align-items: center;
  }

  .gantt-cell {
    border-right: 1px solid var(--background-modifier-border-hover);
    min-width: 24px;
  }

  .gantt-cell.today { background: var(--interactive-accent-hover); opacity: 0.3; }
  .gantt-cell.weekend { background: var(--background-secondary); opacity: 0.3; }

  .gantt-bar {
    position: absolute;
    top: 3px;
    height: 22px;
    border-radius: 4px;
    opacity: 0.85;
    display: flex;
    align-items: center;
    overflow: hidden;
    z-index: 1;
  }

  .gantt-progress {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px 0 0 4px;
  }

  .gantt-bar-label {
    padding: 0 6px;
    color: white;
    font-size: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
    z-index: 1;
  }
</style>
