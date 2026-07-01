<script lang="ts">
  import {
    aggregateTimeSeries,
    movingAverage,
    computeTrend,
    detectScale,
    formatDateLabel,
  } from '../../services/aggregation';
  import { trackerSettings } from '../../stores/trackerStore';
  import { COLOR_SCHEMES } from '../../types';
  import type {
    DataPoint,
    VisualizationType,
    ColorScheme,
    AggregationMethod,
    ScaleConfig,
    ReferenceLine,
  } from '../../types';

  export let points: DataPoint[];
  export let visualization: VisualizationType = 'line';
  export let colorScheme: ColorScheme = 'green';
  export let aggregation: AggregationMethod = 'average';
  export let scale: ScaleConfig = { auto: true, min: 0, max: 100 };
  export let referenceLines: ReferenceLine[] = [];
  export let movingAvgWindow: number | null = null;
  export let showGrid: boolean = true;
  export let showLegend: boolean = true;
  export let title: string = '';

  const CHART_H = 160;
  const CHART_W = 400;
  const PAD = { top: 10, right: 10, bottom: 24, left: 40 };

  $: series = aggregateTimeSeries(points, $trackerSettings.granularity, aggregation);
  $: maLine = movingAvgWindow ? movingAverage(series, movingAvgWindow) : null;
  $: trend = computeTrend(series);
  $: effectiveScale = scale.auto ? detectScale(series) : { min: scale.min, max: scale.max };
  $: range = effectiveScale.max - effectiveScale.min || 1;

  $: innerW = CHART_W - PAD.left - PAD.right;
  $: innerH = CHART_H - PAD.top - PAD.bottom;

  function x(i: number): number {
    return PAD.left + (series.length > 1 ? (i / (series.length - 1)) * innerW : innerW / 2);
  }
  function y(val: number): number {
    return PAD.top + innerH - ((val - effectiveScale.min) / range) * innerH;
  }

  $: primaryColor = COLOR_SCHEMES[colorScheme].levels[2];
  $: areaColor = `${primaryColor}33`;

  $: linePath = series
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' ');
  $: areaPath =
    series.length > 0
      ? `${linePath} L${x(series.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`
      : '';

  $: maPath = maLine
    ? maLine
        .map((p, i) => {
          const idx = series.findIndex((s) => s.date === p.date);
          return `${i === 0 ? 'M' : 'L'}${x(idx >= 0 ? idx : i).toFixed(1)},${y(p.value).toFixed(1)}`;
        })
        .join(' ')
    : '';

  $: barWidth = series.length > 0 ? Math.max(2, innerW / series.length - 2) : 10;

  $: gridLines = Array.from({ length: 5 }, (_, i) => {
    const val = effectiveScale.min + (range / 4) * i;
    return { val, y: y(val) };
  });

  $: xLabels =
    series.length <= 12
      ? series.map((p, i) => ({
          label: formatDateLabel(p.date, $trackerSettings.granularity),
          x: x(i),
        }))
      : series
          .filter((_, i) => i % Math.ceil(series.length / 8) === 0)
          .map((p, i) => ({
            label: formatDateLabel(p.date, $trackerSettings.granularity),
            x: x(series.indexOf(p)),
          }));
</script>

<div class="chart-card">
  <div class="chart-header">
    {#if title}
      <h4 class="card-title">{title}</h4>
    {/if}
    <span
      class="trend-arrow"
      class:up={trend.direction === 'up'}
      class:down={trend.direction === 'down'}
      title="{trend.percentChange}% {trend.direction}"
    >
      {trend.arrow}
    </span>
  </div>

  <svg viewBox="0 0 {CHART_W} {CHART_H}" class="chart-svg" preserveAspectRatio="xMidYMid meet">
    {#if showGrid}
      {#each gridLines as g}
        <line x1={PAD.left} y1={g.y} x2={CHART_W - PAD.right} y2={g.y} class="grid-line" />
        <text x={PAD.left - 4} y={g.y + 3} class="axis-label" text-anchor="end"
          >{g.val.toFixed(0)}</text
        >
      {/each}
    {/if}

    {#each referenceLines as ref}
      <line
        x1={PAD.left}
        y1={y(ref.value)}
        x2={CHART_W - PAD.right}
        y2={y(ref.value)}
        stroke={ref.color}
        stroke-dasharray="4 2"
        stroke-width="1"
      />
      <text x={CHART_W - PAD.right + 2} y={y(ref.value) + 3} fill={ref.color} font-size="8"
        >{ref.label}</text
      >
    {/each}

    {#if visualization === 'area'}
      <path d={areaPath} fill={areaColor} />
      <path d={linePath} fill="none" stroke={primaryColor} stroke-width="1.5" />
    {:else if visualization === 'line'}
      <path d={linePath} fill="none" stroke={primaryColor} stroke-width="2" />
      {#each series as p, i}
        <circle cx={x(i)} cy={y(p.value)} r="3" fill={primaryColor}>
          <title
            >{formatDateLabel(p.date, $trackerSettings.granularity)}: {p.value.toFixed(1)}</title
          >
        </circle>
      {/each}
    {:else if visualization === 'bar'}
      {#each series as p, i}
        <rect
          x={x(i) - barWidth / 2}
          y={y(Math.max(p.value, effectiveScale.min))}
          width={barWidth}
          height={Math.max(1, innerH - (y(p.value) - PAD.top))}
          fill={primaryColor}
          rx="1"
          opacity="0.85"
        >
          <title
            >{formatDateLabel(p.date, $trackerSettings.granularity)}: {p.value.toFixed(1)}</title
          >
        </rect>
      {/each}
    {/if}

    {#if maPath}
      <path
        d={maPath}
        fill="none"
        stroke={primaryColor}
        stroke-width="1.5"
        stroke-dasharray="5 3"
        opacity="0.7"
      />
    {/if}

    {#each xLabels as lbl}
      <text x={lbl.x} y={CHART_H - 4} class="axis-label" text-anchor="middle">{lbl.label}</text>
    {/each}
  </svg>

  {#if showLegend && series.length > 0}
    <div class="chart-footer">
      <span class="stat">{series.length} data points</span>
      {#if movingAvgWindow}
        <span class="stat ma">--- {movingAvgWindow}-period MA</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .chart-card {
    padding: var(--spacing-s);
  }
  .chart-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-xs);
  }
  .card-title {
    font-size: var(--font-ui-small);
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
    flex: 1;
  }
  .trend-arrow {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-muted);
  }
  .trend-arrow.up {
    color: #10b981;
  }
  .trend-arrow.down {
    color: #ef4444;
  }
  .chart-svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .grid-line {
    stroke: var(--background-modifier-border, rgba(128, 128, 128, 0.15));
    stroke-width: 0.5;
  }
  .axis-label {
    font-size: 8px;
    fill: var(--text-muted);
  }
  .chart-footer {
    display: flex;
    gap: var(--spacing-m);
    margin-top: var(--spacing-xs);
  }
  .stat {
    font-size: 10px;
    color: var(--text-muted);
  }
  .stat.ma {
    font-style: italic;
  }
</style>
