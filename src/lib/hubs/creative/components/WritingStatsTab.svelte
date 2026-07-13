<script lang="ts">
  import { formatNumber } from '@/hubs/creative/services/writing-service';

  interface Props {
    recentDays: { date: string; words: number }[];
  }

  let { recentDays }: Props = $props();
</script>

<div class="wr-section">
  <h2 class="wr-section-title">Writing History (Last 14 Days)</h2>
  <div class="wr-history">
    {#each recentDays as day (day.date)}
      <div class="wr-history-row">
        <span class="wr-history-date">{day.date}</span>
        <div class="wr-history-bar-wrap">
          <div
            class="wr-history-bar"
            style="width: {Math.min(
              100,
              (day.words / Math.max(1, ...recentDays.map((d) => d.words))) * 100
            )}%"
          ></div>
        </div>
        <span class="wr-history-words">{formatNumber(day.words)}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .wr-section {
    margin-bottom: 24px;
  }
  .wr-section-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 10px 0;
  }
  .wr-history {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .wr-history-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .wr-history-date {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    min-width: 70px;
  }
  .wr-history-bar-wrap {
    flex: 1;
    height: 8px;
    background: var(--color-border);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .wr-history-bar {
    height: 100%;
    background: var(--color-accent);
    border-radius: var(--radius-s);
    transition: width var(--transition-slow);
  }
  .wr-history-words {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    min-width: 40px;
    text-align: right;
  }
</style>
