<script lang="ts">
  /**
   * Native flashcard study session — works without Anki.
   * Uses SM-2 spaced repetition. Shows front, reveal back, grade 0-5.
   * Supports keyboard shortcuts: Space to reveal, 0-5 to grade.
   */
  import { onMount, onDestroy } from 'svelte';
  import type { Flashcard } from '../types/flashcard';
  import type { ReviewRecord, ReviewGrade } from '../services/scheduler';
  import { gradeCard } from '../services/scheduler';
  import { escapeHtml } from '@/utils/html';

  export let cards: Flashcard[] = [];
  export let records: Map<string, ReviewRecord> = new Map();
  /** Optional course ID — when set, shows a course context header. */
  export const courseId: string | null = null;
  /** Optional course name for display. */
  export let courseName: string | null = null;
  export let onGraded: ((detail: { cardId: string; grade: ReviewGrade; record: ReviewRecord }) => void) | undefined = undefined;
  export let onFinished: ((detail: { total: number }) => void) | undefined = undefined;

  let queue = [...cards];
  let current: Flashcard | null = queue[0] ?? null;
  let revealed = false;
  let sessionGrades: ReviewGrade[] = [];
  let index = 0;

  $: progress = queue.length > 0 ? (index / queue.length) * 100 : 0;
  $: circumference = 2 * Math.PI * 18;
  $: strokeOffset = circumference - (progress / 100) * circumference;

  function reveal() { revealed = true; }

  function grade(g: ReviewGrade) {
    if (!current) return;
    const updated = gradeCard(records.get(current.id) ?? null, current.id, g);
    records.set(current.id, updated);
    sessionGrades.push(g);
    onGraded?.({ cardId: current.id, grade: g, record: updated });
    if (g < 3 && queue.length < 30) queue.push(current);
    index++;
    if (index < queue.length) {
      current = queue[index];
      revealed = false;
    } else {
      current = null;
      onFinished?.({ total: sessionGrades.length });
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!current) return;
    if (e.key === ' ' && !revealed) { e.preventDefault(); reveal(); return; }
    if (revealed && e.key >= '0' && e.key <= '5') {
      e.preventDefault();
      grade(parseInt(e.key) as ReviewGrade);
    }
  }

  onMount(() => { window.addEventListener('keydown', handleKeydown); });
  onDestroy(() => { window.removeEventListener('keydown', handleKeydown); });

  const GRADE_LABELS: Record<number, string> = {
    0: 'Blackout', 1: 'Wrong', 2: 'Hard', 3: 'OK', 4: 'Good', 5: 'Easy',
  };
  const GRADE_KEYS = [0, 1, 2, 3, 4, 5] as const;
</script>

<div class="study-session" role="region" aria-label="Flashcard study session">
  {#if courseName}
    <div class="course-context" aria-label="Studying course: {courseName}">
      <span class="course-label">Studying:</span>
      <span class="course-name">{courseName}</span>
    </div>
  {/if}
  {#if !current}
    <div class="session-done">
      <svg class="done-ring" width="64" height="64" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--interactive-accent)" stroke-width="3" />
        <path d="M15 22l4 4 9-9" fill="none" stroke="var(--interactive-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h3>Session complete</h3>
      <p>{sessionGrades.length} cards reviewed</p>
      <div class="done-stats">
        <span class="done-stat pass">{sessionGrades.filter(g => g >= 4).length} Easy</span>
        <span class="done-stat ok">{sessionGrades.filter(g => g === 3).length} OK</span>
        <span class="done-stat fail">{sessionGrades.filter(g => g < 3).length} Hard</span>
      </div>
    </div>
  {:else}
    <div class="progress-row">
      <svg class="progress-ring" width="40" height="40" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-color)" stroke-width="3"/>
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--interactive-accent)" stroke-width="3"
          stroke-dasharray={circumference} stroke-dashoffset={strokeOffset}
          stroke-linecap="round" transform="rotate(-90 22 22)" style="transition: stroke-dashoffset 0.4s"/>
      </svg>
      <span class="progress-count">{index + 1}<span class="progress-sep">/</span>{queue.length}</span>
    </div>

    <div class="card-display" class:flipped={revealed}>
      <div class="card-type-badge" data-type={current.type}>{current.type}</div>

      <div class="card-front">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- Content escaped via escapeHtml before mark/br wrapping -->
        {@html escapeHtml(current.front)
          .replace(/\{\{c\d+::(.+?)\}\}/g, revealed ? '<mark>$1</mark>' : '<span class="cloze-blank">[...]</span>')
          .replace(/\n/g, '<br>')}
      </div>

      {#if revealed}
        {#if current.back}
          <div class="card-divider" aria-hidden="true"></div>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- Content escaped via escapeHtml before br wrapping -->
          <div class="card-back">{@html escapeHtml(current.back).replace(/\n/g, '<br>')}</div>
        {/if}

        <div class="grade-buttons" role="group" aria-label="Rate your recall">
          {#each GRADE_KEYS as g}
            <button
              class="grade-btn"
              class:fail={g < 3}
              class:pass={g >= 3}
              data-grade={g}
              on:click={() => grade(g)}
              title="Grade: {GRADE_LABELS[g]} (press {g})"
            >
              <span class="grade-num">{g}</span>
              <span class="grade-label">{GRADE_LABELS[g]}</span>
            </button>
          {/each}
        </div>
      {:else}
        <button class="reveal-btn" on:click={reveal}>
          Show Answer
          <span class="shortcut-hint">Space</span>
        </button>
      {/if}
    </div>

    <div class="card-source">
      {current.sourcePath.split('/').pop()?.replace(/\.md$/, '')} · L{current.sourceLine + 1}
    </div>
  {/if}
</div>

<style>
  .study-session { display: flex; flex-direction: column; height: 100%; padding: var(--spacing-m); gap: var(--spacing-m); overflow-y: auto; }
  .course-context { display: flex; align-items: center; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-s); background: var(--background-modifier-hover); border-radius: var(--radius-s); }
  .course-label { font-size: 10px; color: var(--text-faint); }
  .course-name { font-size: var(--font-smallest); font-weight: var(--font-semibold); color: var(--text-muted); }
  .progress-row { display: flex; align-items: center; gap: var(--spacing-s); }
  .progress-count { font-size: var(--font-smaller); font-weight: var(--font-semibold); color: var(--text-normal); }
  .progress-sep { color: var(--text-faint); margin: 0 1px; }
  .card-display { flex: 1; display: flex; flex-direction: column; gap: var(--spacing-m); background: var(--background-primary); border: 1px solid var(--border-color); border-radius: var(--radius-m); padding: var(--spacing-l); transition: border-color 0.2s; }
  .card-display.flipped { border-color: var(--interactive-accent); }
  .card-type-badge { font-size: 10px; font-weight: var(--font-semibold); text-transform: uppercase; color: var(--text-faint); }
  .card-front { font-size: var(--font-normal); font-weight: var(--font-medium); line-height: 1.6; color: var(--text-normal); }
  .card-front :global(mark) { background: rgba(245, 158, 11, 0.2); color: inherit; border-radius: 2px; padding: 0 3px; border-bottom: 2px dashed rgba(245, 158, 11, 0.5); }
  .card-front :global(.cloze-blank) { background: var(--background-modifier-border); color: transparent; border-radius: 3px; padding: 0 12px; user-select: none; }
  .card-divider { height: 1px; background: var(--border-color); }
  .card-back { font-size: var(--font-smaller); color: var(--text-muted); line-height: 1.6; }
  .reveal-btn { margin-top: auto; display: flex; align-items: center; justify-content: center; gap: var(--spacing-s); padding: var(--spacing-s) var(--spacing-l); background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: var(--radius-m); font-size: var(--font-smaller); font-weight: var(--font-semibold); cursor: pointer; transition: filter 0.12s; }
  .reveal-btn:hover { filter: brightness(0.9); }
  .shortcut-hint { font-size: 10px; opacity: 0.7; padding: 1px 5px; background: rgba(255,255,255,0.15); border-radius: 3px; }
  .grade-buttons { display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--spacing-xs); margin-top: auto; }
  .grade-btn { display: flex; flex-direction: column; align-items: center; padding: var(--spacing-xs) var(--spacing-s); border-radius: var(--radius-s); border: 1px solid var(--border-color); cursor: pointer; font-size: 10px; transition: all 0.12s; background: var(--background-secondary); }
  .grade-btn.fail { border-color: #fca5a5; color: #ef4444; }
  .grade-btn.pass { border-color: #86efac; color: #16a34a; }
  .grade-btn:hover { filter: brightness(0.92); transform: translateY(-1px); }
  .grade-num { font-size: var(--font-normal); font-weight: var(--font-bold); }
  .grade-label { color: var(--text-faint); font-size: 9px; white-space: nowrap; }
  .card-source { font-size: var(--font-smallest); color: var(--text-faint); text-align: center; }
  .session-done { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: var(--spacing-s); text-align: center; }
  .session-done h3 { margin: 0; font-size: var(--font-large); }
  .session-done p { margin: 0; color: var(--text-muted); }
  .done-stats { display: flex; gap: var(--spacing-s); margin-top: var(--spacing-xs); }
  .done-stat { font-size: var(--font-smallest); padding: 2px 8px; border-radius: 4px; font-weight: 500; }
  .done-stat.pass { background: rgba(22, 163, 74, 0.1); color: #16a34a; }
  .done-stat.ok { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
  .done-stat.fail { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
</style>
