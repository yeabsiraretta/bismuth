<script lang="ts">
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import { resolveTemplateVars } from '@/hubs/editor/services/template-vars';
  import {
    type ReviewGroup,
    DEFAULT_REVIEW_CONFIG,
    matchNotesToTimeSpans,
    type VaultNote,
  } from '@/hubs/planner/services/journal-review';
  import ReviewSection from '@/hubs/planner/components/ReviewSection.svelte';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';

  type Period = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  const PERIODS: { id: Period; label: string }[] = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'yearly', label: 'Yearly' },
  ];

  let activePeriod: Period = $state('weekly');

  const TEMPLATES: Record<Period, string> = {
    weekly:
      '# Weekly Review — {{value}}\n\n## What went well\n\n- \n\n## What could improve\n\n- \n\n## Goals for next week\n\n- \n',
    monthly:
      '# Monthly Review — {{value}}\n\n## Accomplishments\n\n- \n\n## Challenges\n\n- \n\n## Focus areas\n\n- \n',
    quarterly:
      '# Quarterly Review — {{value}}\n\n## Key results\n\n- \n\n## Lessons learned\n\n- \n\n## Next quarter priorities\n\n- \n',
    yearly:
      '# Annual Review — {{value}}\n\n## Highlights\n\n- \n\n## Growth areas\n\n- \n\n## Vision for next year\n\n- \n',
  };

  function getDateRange(period: Period): string {
    const ts = Date.now();
    const now = new Date(ts);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (period === 'weekly') {
      const startTs = ts - now.getDay() * 86400000;
      const start = new Date(startTs);
      const end = new Date(startTs + 6 * 86400000);
      return `${fmt(start)} – ${fmt(end)}`;
    }
    if (period === 'monthly') {
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (period === 'quarterly') {
      const q = Math.floor(now.getMonth() / 3) + 1;
      return `Q${q} ${now.getFullYear()}`;
    }
    return `${now.getFullYear()}`;
  }

  function createReview() {
    const title = `${activePeriod}-review-${new Date().toISOString().slice(0, 10)}`;
    const range = getDateRange(activePeriod);
    const content = resolveTemplateVars(TEMPLATES[activePeriod], {
      noteTitle: title,
      notePath: `reviews/${title}.md`,
      date: new Date(),
      value: range,
    });
    openNote(`reviews/${title}.md`, { content });
  }

  let allNotes = $derived(getNotes());
  let pastReviews = $derived(
    allNotes
      .filter((n) => n.path.startsWith('reviews/') && n.path.includes(`${activePeriod}-review`))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
  );

  let vaultNotes = $derived<VaultNote[]>(
    allNotes
      .map((n) => ({ path: n.path, content: getCachedContent(n.path) ?? '' }))
      .filter((n) => n.content.length > 0)
  );

  let reviewGroups = $derived<ReviewGroup[]>(
    matchNotesToTimeSpans(vaultNotes, {
      ...DEFAULT_REVIEW_CONFIG,
      lookupMargin: 1,
    })
  );
</script>

<Panel title="Periodic Reviews">
  <div class="periodic-panel">
    <div class="period-tabs">
      {#each PERIODS as p (p.id)}
        <button
          class="period-tab"
          class:active={activePeriod === p.id}
          onclick={() => (activePeriod = p.id)}
        >
          {p.label}
        </button>
      {/each}
    </div>

    <div class="period-info">
      <span class="period-range">{getDateRange(activePeriod)}</span>
    </div>

    <ReviewSection groups={reviewGroups} />

    <div class="review-prompts">
      <h4 class="section-title">Reflection Prompts</h4>
      <ul class="prompts-list">
        <li>What went well?</li>
        <li>What could be improved?</li>
        <li>Key accomplishments</li>
        <li>Goals for next period</li>
        <li>Lessons learned</li>
      </ul>
    </div>

    <button class="create-review-btn" onclick={createReview}>
      Create {activePeriod} review
    </button>

    {#if pastReviews.length > 0}
      <div class="past-reviews">
        <h4 class="section-title">Past Reviews</h4>
        <ul class="past-list">
          {#each pastReviews as note (note.path)}
            <li>
              <button class="past-review-btn" onclick={() => openNote(note.path)}>
                {note.title}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</Panel>

<style>
  .periodic-panel {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .period-tabs {
    display: flex;
    gap: 2px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
    padding: 2px;
  }
  .period-tab {
    flex: 1;
    padding: 4px 6px;
    font-size: 0.65rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    transition: all var(--transition-base);
  }
  .period-tab.active {
    background: var(--color-accent);
    color: var(--color-background);
  }
  .period-info {
    text-align: center;
  }
  .period-range {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text);
  }

  /* ── Prompts & Reviews ──────────────────── */
  .section-title {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-muted);
    margin: 0 0 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .review-prompts {
    padding: 8px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
  }
  .prompts-list {
    margin: 0;
    padding: 0 0 0 16px;
    font-size: 0.7rem;
    color: var(--color-text);
    line-height: 1.6;
  }
  .create-review-btn {
    padding: 6px 12px;
    font-size: 0.75rem;
    border: 1px solid var(--color-accent);
    background: transparent;
    color: var(--color-accent);
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: all var(--transition-base);
  }
  .create-review-btn:hover {
    background: var(--color-accent);
    color: var(--color-background);
  }
  .past-reviews {
    padding: 8px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
  }
  .past-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .past-review-btn {
    width: 100%;
    padding: 4px 0;
    font-size: 0.7rem;
    background: none;
    border: none;
    color: var(--color-accent);
    cursor: pointer;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .past-review-btn:hover {
    text-decoration: underline;
  }
</style>
