<script lang="ts">
  /**
   * Flashcard Statistics Panel — shows review history, retention, streaks.
   * Mirrors the Obsidian SR plugin statistics view.
   */
  import type { FlashcardStats } from '../../types/flashcard';

  export let stats: FlashcardStats;

  $: maturedPct = stats.totalCards > 0
    ? Math.round((stats.maturedCards / stats.totalCards) * 100)
    : 0;
  $: youngPct = stats.totalCards > 0
    ? Math.round((stats.youngCards / stats.totalCards) * 100)
    : 0;
  $: newPct = stats.totalCards > 0
    ? Math.round((stats.newCards / stats.totalCards) * 100)
    : 0;
</script>

<div class="stats-panel">
  <div class="stats-header">
    <span class="stats-title">Statistics</span>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-value">{stats.totalCards}</span>
      <span class="stat-label">Total Cards</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{stats.totalReviews}</span>
      <span class="stat-label">Total Reviews</span>
    </div>
    <div class="stat-card">
      <span class="stat-value accent">{stats.reviewsToday}</span>
      <span class="stat-label">Today</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{stats.retentionRate}%</span>
      <span class="stat-label">Retention (30d)</span>
    </div>
  </div>

  <div class="section-label">Streaks</div>
  <div class="streak-row">
    <div class="streak">
      <span class="streak-value">{stats.currentStreak}</span>
      <span class="streak-label">Current</span>
    </div>
    <div class="streak">
      <span class="streak-value">{stats.longestStreak}</span>
      <span class="streak-label">Longest</span>
    </div>
  </div>

  <div class="section-label">Card Maturity</div>
  <div class="maturity-bar">
    {#if stats.totalCards > 0}
      <div class="bar-segment matured" style="width: {maturedPct}%" title="{stats.maturedCards} matured ({maturedPct}%)"></div>
      <div class="bar-segment young" style="width: {youngPct}%" title="{stats.youngCards} young ({youngPct}%)"></div>
      <div class="bar-segment new" style="width: {newPct}%" title="{stats.newCards} new ({newPct}%)"></div>
    {/if}
  </div>
  <div class="maturity-legend">
    <span class="legend-item"><span class="dot matured"></span> Matured ({stats.maturedCards})</span>
    <span class="legend-item"><span class="dot young"></span> Young ({stats.youngCards})</span>
    <span class="legend-item"><span class="dot new"></span> New ({stats.newCards})</span>
  </div>
</div>

<style>
  .stats-panel { display: flex; flex-direction: column; gap: var(--spacing-m); padding: var(--spacing-m); }
  .stats-header { border-bottom: 1px solid var(--border-color); padding-bottom: var(--spacing-s); }
  .stats-title { font-size: var(--font-smaller); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-s); }
  .stat-card { background: var(--background-primary); border: 1px solid var(--border-color); border-radius: var(--radius-m); padding: var(--spacing-s); text-align: center; }
  .stat-value { display: block; font-size: var(--font-large); font-weight: var(--font-bold); color: var(--text-normal); }
  .stat-value.accent { color: var(--interactive-accent); }
  .stat-label { font-size: var(--font-smallest); color: var(--text-faint); }
  .section-label { font-size: var(--font-smallest); font-weight: var(--font-semibold); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.05em; }
  .streak-row { display: flex; gap: var(--spacing-m); }
  .streak { flex: 1; background: var(--background-primary); border: 1px solid var(--border-color); border-radius: var(--radius-m); padding: var(--spacing-s); text-align: center; }
  .streak-value { display: block; font-size: var(--font-large); font-weight: var(--font-bold); color: var(--text-normal); }
  .streak-label { font-size: var(--font-smallest); color: var(--text-faint); }
  .maturity-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: var(--background-modifier-border); }
  .bar-segment { min-width: 2px; transition: width 0.3s; }
  .bar-segment.matured { background: var(--text-success); }
  .bar-segment.young { background: var(--interactive-accent); }
  .bar-segment.new { background: var(--text-faint); }
  .maturity-legend { display: flex; gap: var(--spacing-m); flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 4px; font-size: var(--font-smallest); color: var(--text-muted); }
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot.matured { background: var(--text-success); }
  .dot.young { background: var(--interactive-accent); }
  .dot.new { background: var(--text-faint); }
</style>
