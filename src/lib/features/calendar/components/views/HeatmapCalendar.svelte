<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    heatmapConfig,
    heatmapEntries,
    COLOR_SCHEMES,
    intensityLevel,
    getIntensityRange,
    buildYearHeatmapGrid,
  } from '../../stores/heatmapData';
  import type { HeatmapColorScheme, HeatmapDataSource } from '../../stores/heatmapData';

  $: cfg = $heatmapConfig;
  $: entries = $heatmapEntries;
  $: entryMap = new Map(entries.map(e => [e.date, e]));
  $: weeks = buildYearHeatmapGrid(cfg.year);
  $: range = getIntensityRange(entries, cfg.intensityScaleStart, cfg.intensityScaleEnd);
  $: colors = COLOR_SCHEMES[cfg.colorScheme];
  $: todayStr = formatToday();

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  const dataSourceOptions: { id: HeatmapDataSource; label: string }[] = [
    { id: 'events', label: 'Events' },
    { id: 'time-tracked', label: 'Time Tracked' },
  ];

  const colorOptions: HeatmapColorScheme[] = ['green', 'blue', 'red', 'orange', 'purple'];

  function formatToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getCellColor(date: string): string {
    const entry = entryMap.get(date);
    if (!entry) return 'var(--background-modifier-hover, #161b22)';
    const level = intensityLevel(entry.intensity, range.min, range.max);
    return colors[level] ?? colors[0];
  }

  function getCellTitle(date: string): string {
    const entry = entryMap.get(date);
    if (!entry) return date;
    return `${date}: ${entry.label ?? entry.intensity}`;
  }

  function isInYear(date: string): boolean {
    return date.startsWith(String(cfg.year));
  }

  function getMonthPositions(wks: string[][]): { label: string; col: number }[] {
    const positions: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < wks.length; w++) {
      const firstDateInWeek = wks[w].find(d => d.startsWith(String(cfg.year)));
      if (!firstDateInWeek) continue;
      const m = parseInt(firstDateInWeek.split('-')[1], 10) - 1;
      if (m !== lastMonth) {
        positions.push({ label: monthLabels[m], col: w });
        lastMonth = m;
      }
    }
    return positions;
  }

  $: monthPositions = getMonthPositions(weeks);

  function prevYear() { heatmapConfig.update(c => ({ ...c, year: c.year - 1 })); }
  function nextYear() { heatmapConfig.update(c => ({ ...c, year: c.year + 1 })); }

  function setScheme(s: HeatmapColorScheme) {
    heatmapConfig.update(c => ({ ...c, colorScheme: s }));
  }

  function setSource(s: HeatmapDataSource) {
    heatmapConfig.update(c => ({ ...c, dataSource: s }));
  }
</script>

<div class="heatmap-calendar">
  <div class="heatmap-toolbar">
    <div class="toolbar-left">
      <button class="nav-btn" on:click={prevYear} title="Previous year">
        <Icon name="chevron-left" size={14} />
      </button>
      <span class="year-label">{cfg.year}</span>
      <button class="nav-btn" on:click={nextYear} title="Next year">
        <Icon name="chevron-right" size={14} />
      </button>
    </div>
    <div class="toolbar-right">
      <div class="source-switcher">
        {#each dataSourceOptions as opt}
          <button
            class="source-btn"
            class:active={cfg.dataSource === opt.id}
            on:click={() => setSource(opt.id)}
          >{opt.label}</button>
        {/each}
      </div>
      <div class="color-picker">
        {#each colorOptions as scheme}
          <button
            class="color-dot"
            class:active={cfg.colorScheme === scheme}
            style="background: {COLOR_SCHEMES[scheme][3]}"
            on:click={() => setScheme(scheme)}
            title="{scheme} theme"
            aria-label="{scheme} color scheme"
          ></button>
        {/each}
      </div>
    </div>
  </div>

  <div class="heatmap-body">
    <div class="day-labels">
      {#each dayLabels as label}
        <span class="day-label">{label}</span>
      {/each}
    </div>

    <div class="heatmap-scroll">
      <div class="month-labels">
        {#each monthPositions as mp}
          <span class="month-label" style="grid-column: {mp.col + 1}">{mp.label}</span>
        {/each}
      </div>

      <div class="heatmap-grid" style="grid-template-columns: repeat({weeks.length}, 1fr)">
        {#each weeks as week, wi}
          {#each week as date, di}
            {#if isInYear(date)}
              <div
                class="heatmap-cell"
                class:today={cfg.showCurrentDayBorder && date === todayStr}
                style="background: {getCellColor(date)}; grid-column: {wi + 1}; grid-row: {di + 1};"
                title={getCellTitle(date)}
              ></div>
            {:else}
              <div
                class="heatmap-cell outside"
                style="grid-column: {wi + 1}; grid-row: {di + 1};"
              ></div>
            {/if}
          {/each}
        {/each}
      </div>
    </div>
  </div>

  <div class="heatmap-legend">
    <span class="legend-label">Less</span>
    <div class="legend-cell" style="background: var(--background-modifier-hover, #161b22)"></div>
    {#each colors as c}
      <div class="legend-cell" style="background: {c}"></div>
    {/each}
    <span class="legend-label">More</span>
    <span class="legend-count">{entries.length} days tracked</span>
  </div>
</div>

<style>
  .heatmap-calendar { display: flex; flex-direction: column; height: 100%; padding: 20px; overflow-y: auto; gap: 12px; }
  .heatmap-toolbar { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 8px; }
  .year-label { font-size: 1rem; font-weight: 600; color: var(--text-normal); min-width: 48px; text-align: center; }
  .nav-btn { background: none; border: none; padding: 4px; border-radius: var(--radius-s); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; }
  .nav-btn:hover { color: var(--text-normal); background: var(--background-modifier-hover); }
  .source-switcher { display: flex; background: var(--background-secondary); border-radius: var(--radius-s); overflow: hidden; border: 1px solid var(--border-color); }
  .source-btn { padding: 3px 8px; font-size: 0.65rem; border: none; background: none; color: var(--text-muted); cursor: pointer; }
  .source-btn.active { background: var(--interactive-accent); color: var(--text-on-accent); }
  .color-picker { display: flex; gap: 4px; }
  .color-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 0; }
  .color-dot.active { border-color: var(--text-normal); }
  .heatmap-body { display: flex; gap: 4px; overflow-x: auto; }
  .day-labels { display: flex; flex-direction: column; gap: 1px; padding-top: 18px; flex-shrink: 0; }
  .day-label { height: 13px; font-size: 0.55rem; color: var(--text-faint); display: flex; align-items: center; }
  .heatmap-scroll { flex: 1; overflow-x: auto; min-width: 0; }
  .month-labels { display: grid; height: 16px; margin-bottom: 2px; }
  .month-label { font-size: 0.6rem; color: var(--text-muted); white-space: nowrap; }
  .heatmap-grid { display: grid; grid-template-rows: repeat(7, 1fr); grid-auto-flow: column; gap: 1px; }
  .heatmap-cell { width: 13px; height: 13px; border-radius: 2px; cursor: default; }
  .heatmap-cell.today { outline: 2px solid var(--text-normal); outline-offset: -1px; }
  .heatmap-cell.outside { visibility: hidden; }
  .heatmap-legend { display: flex; align-items: center; gap: 3px; justify-content: flex-end; flex-shrink: 0; }
  .legend-label { font-size: 0.6rem; color: var(--text-faint); margin: 0 2px; }
  .legend-cell { width: 11px; height: 11px; border-radius: 2px; }
  .legend-count { font-size: 0.6rem; color: var(--text-muted); margin-left: 8px; }
</style>
