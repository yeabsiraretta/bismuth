<script lang="ts">
  import { countListValues } from '../../services/aggregation';
  import type { DataPoint, VisualizationType, ColorScheme } from '../../types';

  export let points: DataPoint[];
  export let visualization: VisualizationType = 'pie';
  export let colorScheme: ColorScheme = 'green';
  export let title: string = '';

  const PALETTE: Record<ColorScheme, string[]> = {
    green:  ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#059669'],
    blue:   ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#2563eb'],
    purple: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#7c3aed'],
    orange: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#ea580c'],
    red:    ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#dc2626'],
  };

  $: counts = countListValues(points);
  $: total = counts.reduce((s, c) => s + c.count, 0);
  $: palette = PALETTE[colorScheme];
  $: isDoughnut = visualization === 'doughnut';

  $: slices = (() => {
    let cumulative = 0;
    return counts.map((item, i) => {
      const pct = total > 0 ? (item.count / total) * 100 : 0;
      const start = cumulative;
      cumulative += pct;
      return { ...item, pct, start, color: palette[i % palette.length] };
    });
  })();

  $: conicGradient = slices.length > 0
    ? slices.map(s => `${s.color} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`).join(', ')
    : 'var(--background-modifier-border) 0% 100%';
</script>

<div class="pie-card">
  {#if title}
    <h4 class="card-title">{title}</h4>
  {/if}

  <div class="pie-layout">
    <div
      class="pie-chart"
      class:doughnut={isDoughnut}
      style="background: conic-gradient({conicGradient})"
      role="img"
      aria-label="{title} chart"
    >
      {#if isDoughnut}
        <div class="doughnut-hole">
          <span class="doughnut-total">{total}</span>
        </div>
      {/if}
    </div>

    <div class="pie-legend">
      {#each slices.slice(0, 8) as slice}
        <div class="legend-item">
          <span class="legend-dot" style="background:{slice.color}"></span>
          <span class="legend-label">{slice.label}</span>
          <span class="legend-count">{slice.count} ({slice.pct.toFixed(0)}%)</span>
        </div>
      {/each}
      {#if slices.length > 8}
        <div class="legend-item">
          <span class="legend-label more">+{slices.length - 8} more</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .pie-card { padding: var(--spacing-s); }
  .card-title { font-size: var(--font-ui-small); font-weight: 600; color: var(--text-normal); margin: 0 0 var(--spacing-s); }
  .pie-layout { display: flex; align-items: center; gap: var(--spacing-m); }
  .pie-chart { width: 120px; height: 120px; border-radius: 50%; flex-shrink: 0; position: relative; }
  .pie-chart.doughnut { display: flex; align-items: center; justify-content: center; }
  .doughnut-hole { width: 60%; height: 60%; border-radius: 50%; background: var(--background-primary); display: flex; align-items: center; justify-content: center; }
  .doughnut-total { font-size: 16px; font-weight: 700; color: var(--text-normal); }
  .pie-legend { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
  .legend-item { display: flex; align-items: center; gap: var(--spacing-xs); }
  .legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
  .legend-label { font-size: 11px; color: var(--text-normal); text-transform: capitalize; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .legend-label.more { color: var(--text-muted); font-style: italic; }
  .legend-count { font-size: 10px; color: var(--text-muted); margin-left: auto; white-space: nowrap; }
</style>
