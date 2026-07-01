<script lang="ts">
  import { buildHeatmap, heatmapColor } from '../../services/aggregation';
  import { trackerSettings } from '../../stores/trackerStore';
  import type { DataPoint, ColorScheme, AggregationMethod, HeatmapCell } from '../../types';

  export let points: DataPoint[];
  export let colorScheme: ColorScheme = 'green';
  export let aggregation: AggregationMethod = 'average';
  export let title: string = '';

  $: cells = buildHeatmap(points, aggregation, $trackerSettings.firstDayOfWeek, 52);
  $: maxWeek = cells.length > 0 ? Math.max(...cells.map(c => c.weekIndex)) : 0;

  const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

  function tooltip(cell: HeatmapCell): string {
    if (cell.value === 0) return `${cell.date}: No data`;
    return `${cell.date}: ${cell.value.toFixed(1)}`;
  }
</script>

<div class="heatmap-card">
  {#if title}
    <h4 class="card-title">{title}</h4>
  {/if}
  <div class="heatmap-container">
    <div class="day-labels">
      {#each DAY_LABELS as label, i}
        <span class="day-label" style="grid-row:{i + 1}">{label}</span>
      {/each}
    </div>
    <div class="heatmap-grid" style="grid-template-columns:repeat({maxWeek + 1}, 1fr)">
      {#each cells as cell (cell.date)}
        <div
          class="heatmap-cell"
          style="grid-row:{cell.dayOfWeek + 1};grid-column:{cell.weekIndex + 1};background:{heatmapColor(cell.level, colorScheme)}"
          title={tooltip(cell)}
          role="gridcell"
          aria-label={tooltip(cell)}
        ></div>
      {/each}
    </div>
  </div>
  <div class="legend">
    <span class="legend-label">Less</span>
    {#each [0, 1, 2, 3, 4] as level}
      <div class="legend-cell" style="background:{heatmapColor(level, colorScheme)}"></div>
    {/each}
    <span class="legend-label">More</span>
  </div>
</div>

<style>
  .heatmap-card { padding: var(--spacing-s); }
  .card-title { font-size: var(--font-ui-small); font-weight: 600; color: var(--text-normal); margin: 0 0 var(--spacing-s); }
  .heatmap-container { display: flex; gap: 4px; overflow-x: auto; }
  .day-labels { display: grid; grid-template-rows: repeat(7, 1fr); gap: 2px; width: 28px; flex-shrink: 0; }
  .day-label { font-size: 9px; color: var(--text-muted); display: flex; align-items: center; justify-content: flex-end; padding-right: 4px; height: 11px; }
  .heatmap-grid { display: grid; grid-template-rows: repeat(7, 1fr); gap: 2px; flex: 1; min-width: 600px; }
  .heatmap-cell { width: 100%; aspect-ratio: 1; border-radius: 2px; min-width: 8px; min-height: 8px; cursor: pointer; transition: opacity 0.1s; }
  .heatmap-cell:hover { opacity: 0.8; outline: 1px solid var(--text-muted); }
  .legend { display: flex; align-items: center; gap: 3px; margin-top: var(--spacing-xs); justify-content: flex-end; }
  .legend-label { font-size: 9px; color: var(--text-muted); }
  .legend-cell { width: 10px; height: 10px; border-radius: 2px; }
</style>
