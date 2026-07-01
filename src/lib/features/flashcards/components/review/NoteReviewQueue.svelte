<script lang="ts">
  /**
   * Note Review Queue — sidebar panel for reviewing whole notes.
   * Notes tagged with #review are scheduled using spaced repetition.
   * Mirrors the Obsidian SR "Open Notes Review Queue in sidebar" workflow.
   */
  import { onMount, onDestroy } from 'svelte';
  import { notes } from '@/stores/vault/vault';
  import type { ReviewableNote, NoteRecallRating } from '../../types/flashcard';
  import {
    gradeNoteReview,
    createReviewableNote,
    serializeNoteReviews,
    deserializeNoteReviews,
  } from '../../services/scheduler';

  const STORAGE_KEY = 'bismuth-note-reviews';
  const REVIEW_TAG_RE = /#review\b/i;
  const RATINGS: { label: string; value: NoteRecallRating; color: string }[] = [
    { label: 'Forgot', value: 'forgot', color: 'var(--text-error)' },
    { label: 'Hard', value: 'hard', color: 'var(--text-warning, #d97706)' },
    { label: 'Good', value: 'good', color: 'var(--text-success)' },
    { label: 'Easy', value: 'easy', color: 'var(--interactive-accent)' },
  ];

  let reviewableNotes: ReviewableNote[] = [];
  let noteReviews = new Map<string, ReviewableNote>();
  let unsubNotes: (() => void) | null = null;

  $: dueNotes = reviewableNotes.filter(n => new Date(n.nextReview) <= new Date());
  $: laterNotes = reviewableNotes.filter(n => new Date(n.nextReview) > new Date());

  onMount(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) noteReviews = deserializeNoteReviews(raw);
    unsubNotes = notes.subscribe(scanForReviewNotes);
  });

  onDestroy(() => { unsubNotes?.(); });

  function scanForReviewNotes(noteList: Array<{ path: string; content: string }>) {
    if (!noteList || noteList.length === 0) { reviewableNotes = []; return; }
    const result: ReviewableNote[] = [];
    for (const note of noteList) {
      if (!note.content) continue;
      // Check frontmatter tags and body for #review
      const hasFmTag = /^---[\s\S]*?tags:.*review.*\n[\s\S]*?---/m.test(note.content);
      const hasInlineTag = REVIEW_TAG_RE.test(note.content);
      if (!hasFmTag && !hasInlineTag) continue;
      const title = note.path.split('/').pop()?.replace(/\.md$/, '') ?? note.path;
      const existing = noteReviews.get(note.path);
      result.push(existing ?? createReviewableNote(note.path, title));
    }
    result.sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
    reviewableNotes = result;
  }

  function rateNote(note: ReviewableNote, rating: NoteRecallRating) {
    const updated = gradeNoteReview(note, rating);
    noteReviews.set(note.path, updated);
    noteReviews = noteReviews;
    localStorage.setItem(STORAGE_KEY, serializeNoteReviews(noteReviews));
    // Re-sort
    reviewableNotes = reviewableNotes.map(n => n.path === note.path ? updated : n)
      .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
  }

  function formatInterval(days: number): string {
    if (days === 0) return 'New';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.round(days / 7)}w`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${Math.round(days / 365)}y`;
  }

  function formatDue(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days <= 0) return 'Now';
    if (days === 1) return 'Tomorrow';
    return `In ${days}d`;
  }
</script>

<div class="note-review-queue">
  <div class="queue-header">
    <span class="queue-title">Note Review Queue</span>
    <span class="badge">{dueNotes.length} due</span>
  </div>

  {#if reviewableNotes.length === 0}
    <div class="empty-state">
      <p>No notes tagged for review.</p>
      <p class="hint">Add <code>#review</code> to any note to schedule it for spaced repetition.</p>
    </div>
  {:else}
    {#if dueNotes.length > 0}
      <div class="section-label">Due for Review</div>
      {#each dueNotes as note (note.path)}
        <div class="note-item due">
          <div class="note-info">
            <span class="note-title">{note.title}</span>
            <span class="note-meta">
              {formatInterval(note.intervalDays)} · {note.reviewCount} reviews
            </span>
          </div>
          <div class="rating-buttons" role="group" aria-label="Rate your recall of {note.title}">
            {#each RATINGS as r}
              <button
                class="rate-btn"
                style="color: {r.color}; border-color: {r.color}"
                on:click={() => rateNote(note, r.value)}
                title="Rate as {r.label}"
              >
                {r.label}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    {/if}

    {#if laterNotes.length > 0}
      <div class="section-label">Upcoming</div>
      {#each laterNotes as note (note.path)}
        <div class="note-item">
          <div class="note-info">
            <span class="note-title">{note.title}</span>
            <span class="note-meta">
              {formatDue(note.nextReview)} · {formatInterval(note.intervalDays)}
            </span>
          </div>
        </div>
      {/each}
    {/if}
  {/if}
</div>

<style>
  .note-review-queue { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--background-secondary); }
  .queue-header { display: flex; align-items: center; gap: var(--spacing-s); padding: var(--spacing-s) var(--spacing-m); border-bottom: 1px solid var(--border-color); }
  .queue-title { font-size: var(--font-smaller); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
  .badge { font-size: 10px; padding: 1px 6px; border-radius: var(--radius-s); background: var(--interactive-accent); color: var(--text-on-accent); }
  .empty-state { padding: var(--spacing-xl) var(--spacing-m); text-align: center; color: var(--text-muted); font-size: var(--font-smaller); }
  .empty-state p { margin: 0 0 var(--spacing-xs); }
  .hint { font-size: var(--font-smallest); color: var(--text-faint); }
  .hint code { background: var(--background-primary-alt); padding: 1px 4px; border-radius: 3px; }
  .section-label { font-size: var(--font-smallest); font-weight: var(--font-semibold); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-s) var(--spacing-m) var(--spacing-xs); }
  .note-item { padding: var(--spacing-s) var(--spacing-m); border-bottom: 1px solid var(--border-color); }
  .note-item.due { background: color-mix(in srgb, var(--interactive-accent) 5%, transparent); }
  .note-info { display: flex; align-items: baseline; gap: var(--spacing-xs); margin-bottom: var(--spacing-xs); }
  .note-title { font-size: var(--font-smaller); font-weight: var(--font-medium); color: var(--text-normal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .note-meta { font-size: var(--font-smallest); color: var(--text-faint); margin-left: auto; flex-shrink: 0; }
  .rating-buttons { display: flex; gap: var(--spacing-xs); }
  .rate-btn { font-size: 10px; padding: 2px var(--spacing-s); border-radius: var(--radius-s); border: 1px solid; background: var(--background-primary); cursor: pointer; font-weight: var(--font-semibold); }
  .rate-btn:hover { filter: brightness(0.9); transform: translateY(-1px); }
</style>
