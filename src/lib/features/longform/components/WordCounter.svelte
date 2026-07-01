<script lang="ts">
  export let count: number = 0;
  export let goal: number = 0;

  $: progress = goal > 0 ? Math.min(100, (count / goal) * 100) : 0;
</script>

<div class="word-counter">
  <div class="count-display">
    <span class="count">{count.toLocaleString()}</span>
    <span class="label">words</span>
    {#if goal > 0}
      <span class="goal">/ {goal.toLocaleString()}</span>
    {/if}
  </div>
  {#if goal > 0}
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progress}%"></div>
    </div>
  {/if}
</div>

<style>
  .word-counter { padding: var(--spacing-sm) 0; }
  .count-display { display: flex; align-items: baseline; gap: var(--spacing-xs); }
  .count { font-size: var(--font-size-lg); font-weight: 600; }
  .label { color: var(--text-muted); font-size: var(--font-size-sm); }
  .goal { color: var(--text-muted); font-size: var(--font-size-sm); }
  .progress-bar { height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-top: var(--spacing-xs); overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent); transition: width 0.3s ease; }
</style>
