<script lang="ts">
  let {
    stats,
  }: {
    stats: {
      totalCards: number;
      totalReviews: number;
      reviewsToday: number;
      currentStreak: number;
      longestStreak: number;
      retentionRate: number;
      maturedCards: number;
      youngCards: number;
      newCards: number;
    };
  } = $props();
</script>

<div class="stats-grid">
  <div class="stat-card">
    <span class="stat-val">{stats.totalCards}</span><span class="stat-lbl">Total Cards</span>
  </div>
  <div class="stat-card">
    <span class="stat-val">{stats.totalReviews}</span><span class="stat-lbl">Total Reviews</span>
  </div>
  <div class="stat-card">
    <span class="stat-val">{stats.reviewsToday}</span><span class="stat-lbl">Today</span>
  </div>
  <div class="stat-card">
    <span class="stat-val">{stats.currentStreak}d</span><span class="stat-lbl">Streak</span>
  </div>
  <div class="stat-card">
    <span class="stat-val">{stats.longestStreak}d</span><span class="stat-lbl">Best Streak</span>
  </div>
  <div class="stat-card">
    <span class="stat-val">{stats.retentionRate}%</span><span class="stat-lbl">Retention</span>
  </div>
  <div class="stat-card">
    <span class="stat-val">{stats.maturedCards}</span><span class="stat-lbl">Matured</span>
  </div>
  <div class="stat-card">
    <span class="stat-val">{stats.youngCards}</span><span class="stat-lbl">Young</span>
  </div>
  <div class="stat-card">
    <span class="stat-val">{stats.newCards}</span><span class="stat-lbl">New</span>
  </div>
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .stat-card {
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-l);
    background: var(--color-surface);
    text-align: center;
  }
  .stat-val {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-accent);
  }
  .stat-lbl {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
</style>
