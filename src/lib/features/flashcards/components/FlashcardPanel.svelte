<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { activeNote } from '@/stores/vault/vault';
  import {
    scanActiveNote,
    scannedCards,
    isScanning,
    flashcardError,
    cardCount,
  } from '../stores/flashcardStore';
  import {
    getDueCards,
    deserializeRecords,
    serializeRecords,
    gradeCard,
  } from '../services/scheduler';
  import type { ReviewRecord, ReviewGrade } from '../services/scheduler';
  import type { Flashcard } from '../types/flashcard';
  import FlashcardList from './FlashcardList.svelte';
  import { escapeHtml } from '@/utils/html';

  type ViewMode = 'cards' | 'study';
  let viewMode: ViewMode = 'cards';
  let currentPath = '';
  let unsubNote: (() => void) | null = null;
  let reviewRecords = new Map<string, ReviewRecord>();

  $: dueCards = getDueCards($scannedCards, reviewRecords);
  $: dueCount = dueCards.length;
  $: noteName = currentPath.split('/').pop()?.replace(/\.md$/, '') ?? '';

  // Study state
  let queue: Flashcard[] = [];
  let studyIndex = 0;
  let currentCard: Flashcard | null = null;
  let revealed = false;
  let sessionGrades: ReviewGrade[] = [];

  const GRADE_LABELS: Record<number, string> = {
    0: 'Blackout',
    1: 'Wrong',
    2: 'Hard',
    3: 'OK',
    4: 'Good',
    5: 'Easy',
  };
  const GRADE_KEYS = [0, 1, 2, 3, 4, 5] as const;

  onMount(() => {
    const raw = localStorage.getItem('bismuth-flashcard-reviews');
    if (raw) reviewRecords = deserializeRecords(raw);
    unsubNote = activeNote.subscribe((note) => {
      if (note && note.path !== currentPath) {
        currentPath = note.path;
        scanActiveNote(note.path, note.content);
        if (viewMode === 'study') viewMode = 'cards';
      }
    });
  });

  onDestroy(() => {
    unsubNote?.();
  });

  function startStudy() {
    queue = [...dueCards];
    studyIndex = 0;
    currentCard = queue[0] ?? null;
    revealed = false;
    sessionGrades = [];
    viewMode = 'study';
  }

  function reveal() {
    revealed = true;
  }

  function grade(g: ReviewGrade) {
    if (!currentCard) return;
    const updated = gradeCard(reviewRecords.get(currentCard.id) ?? null, currentCard.id, g);
    reviewRecords.set(currentCard.id, updated);
    reviewRecords = reviewRecords;
    sessionGrades.push(g);
    localStorage.setItem('bismuth-flashcard-reviews', serializeRecords(reviewRecords));
    if (g < 3 && queue.length < 30) queue.push(currentCard);
    studyIndex++;
    if (studyIndex < queue.length) {
      currentCard = queue[studyIndex];
      revealed = false;
    } else {
      currentCard = null;
    }
  }

  function endSession() {
    viewMode = 'cards';
  }

  function handleRescan() {
    const unsub = activeNote.subscribe((n) => {
      if (n) scanActiveNote(n.path, n.content);
    });
    unsub();
  }
</script>

<div class="flashcard-panel">
  <div class="panel-header">
    <span class="panel-title">Note Flashcards</span>
    {#if noteName}
      <span class="note-name">{noteName}</span>
    {/if}
  </div>

  {#if !currentPath}
    <div class="empty-state">
      <p>No note open</p>
      <p class="hint">Open a note to see its flashcards.</p>
    </div>
  {:else if $flashcardError}
    <div class="error-banner" role="alert">{$flashcardError}</div>
  {/if}

  {#if currentPath && viewMode === 'cards'}
    <div class="panel-stats">
      <div class="stat">
        <span class="stat-value">{$cardCount}</span>
        <span class="stat-label">Cards</span>
      </div>
      <div class="stat">
        <span class="stat-value due">{dueCount}</span>
        <span class="stat-label">Due</span>
      </div>
      <div class="stat-actions">
        <button class="action-btn secondary" on:click={handleRescan} disabled={$isScanning}
          >Rescan</button
        >
      </div>
    </div>

    {#if dueCount > 0}
      <button class="study-btn" on:click={startStudy}>
        Study {dueCount} due card{dueCount !== 1 ? 's' : ''}
      </button>
    {/if}

    <FlashcardList cards={$scannedCards} loading={$isScanning} />
  {:else if currentPath}
    <!-- Study mode -->
    <div class="study-header">
      <button class="back-btn" on:click={endSession}>Back to cards</button>
      <span class="progress-text">{studyIndex + 1} / {queue.length}</span>
    </div>

    <div class="progress-bar">
      <div
        class="progress-fill"
        style="width: {queue.length > 0 ? Math.round((studyIndex / queue.length) * 100) : 0}%"
      ></div>
    </div>

    {#if !currentCard}
      <div class="session-done">
        <h3>Session complete</h3>
        <p>{sessionGrades.length} cards reviewed</p>
        <p class="stats-row">
          Easy: {sessionGrades.filter((g) => g >= 4).length} | OK: {sessionGrades.filter(
            (g) => g === 3
          ).length} | Hard: {sessionGrades.filter((g) => g < 3).length}
        </p>
        <button class="study-btn" on:click={endSession}>Done</button>
      </div>
    {:else}
      <div class="card-display">
        <div class="card-type-badge" data-type={currentCard.type}>{currentCard.type}</div>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- Content escaped via escapeHtml -->
        <div class="card-question">
          {@html escapeHtml(currentCard.front)
            .replace(
              /\{\{c\d+::(.+?)\}\}/g,
              revealed ? '<mark>$1</mark>' : '<span class="cloze-blank">[...]</span>'
            )
            .replace(/\n/g, '<br>')}
        </div>

        {#if revealed}
          {#if currentCard.back}
            <div class="divider"></div>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- Content escaped via escapeHtml -->
            <div class="card-answer">
              {@html escapeHtml(currentCard.back).replace(/\n/g, '<br>')}
            </div>
          {/if}
          <div class="grade-buttons">
            {#each GRADE_KEYS as g}
              <button
                class="grade-btn"
                class:fail={g < 3}
                class:pass={g >= 3}
                on:click={() => grade(g)}
              >
                <span class="grade-num">{g}</span>
                <span class="grade-label">{GRADE_LABELS[g]}</span>
              </button>
            {/each}
          </div>
        {:else}
          <button class="reveal-btn" on:click={reveal}>Show Answer</button>
        {/if}
      </div>
      <div class="source-label">L{currentCard.sourceLine + 1}</div>
    {/if}
  {/if}
</div>

<style>
  .flashcard-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--background-secondary);
  }
  .panel-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }
  .panel-title {
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .note-name {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: var(--spacing-s);
    padding: var(--spacing-xl);
    text-align: center;
  }
  .empty-state p {
    margin: 0;
    font-size: var(--font-smaller);
    color: var(--text-muted);
  }
  .hint {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
  .error-banner {
    padding: var(--spacing-xs) var(--spacing-m);
    background: var(--background-modifier-error);
    color: var(--text-error);
    font-size: var(--font-smallest);
  }
  .panel-stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .stat-value {
    font-size: var(--font-normal);
    font-weight: var(--font-bold);
    color: var(--text-normal);
  }
  .stat-value.due {
    color: var(--interactive-accent);
  }
  .stat-label {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
  .stat-actions {
    margin-left: auto;
  }
  .action-btn {
    padding: 3px var(--spacing-s);
    font-size: var(--font-smallest);
    border-radius: var(--radius-s);
    cursor: pointer;
    border: 1px solid var(--border-color);
  }
  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .action-btn.secondary {
    background: var(--background-modifier-hover);
    color: var(--text-muted);
  }
  .action-btn.secondary:not(:disabled):hover {
    background: var(--background-modifier-active-hover);
  }
  .study-btn {
    margin: 0 var(--spacing-m) var(--spacing-s);
    padding: var(--spacing-s);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-m);
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    cursor: pointer;
  }
  .study-btn:hover {
    filter: brightness(0.9);
  }
  .study-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }
  .back-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: var(--font-smallest);
  }
  .back-btn:hover {
    color: var(--text-normal);
  }
  .progress-text {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
  .progress-bar {
    height: 3px;
    background: var(--background-modifier-border);
  }
  .progress-fill {
    height: 100%;
    background: var(--interactive-accent);
    transition: width 0.3s;
  }
  .card-display {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    margin: var(--spacing-m);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    padding: var(--spacing-l);
  }
  .card-type-badge {
    font-size: 10px;
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .card-question {
    font-size: var(--font-normal);
    font-weight: var(--font-medium);
    line-height: 1.6;
    color: var(--text-normal);
  }
  .card-question :global(mark) {
    background: rgba(245, 158, 11, 0.2);
    color: inherit;
    border-radius: 2px;
    padding: 0 3px;
    border-bottom: 2px dashed rgba(245, 158, 11, 0.5);
  }
  .card-question :global(.cloze-blank) {
    background: var(--background-modifier-border);
    color: transparent;
    border-radius: 3px;
    padding: 0 12px;
    user-select: none;
  }
  .divider {
    height: 1px;
    background: var(--border-color);
  }
  .card-answer {
    font-size: var(--font-smaller);
    color: var(--text-muted);
    line-height: 1.6;
  }
  .reveal-btn {
    margin-top: auto;
    padding: var(--spacing-s);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-m);
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    cursor: pointer;
    transition: filter 0.12s;
  }
  .reveal-btn:hover {
    filter: brightness(0.9);
  }
  .grade-buttons {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: var(--spacing-xs);
    margin-top: auto;
  }
  .grade-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
    cursor: pointer;
    font-size: 10px;
    transition: all 0.12s;
    background: var(--background-secondary);
  }
  .grade-btn.fail {
    border-color: #fca5a5;
    color: #ef4444;
  }
  .grade-btn.pass {
    border-color: #86efac;
    color: #16a34a;
  }
  .grade-btn:hover {
    filter: brightness(0.92);
    transform: translateY(-1px);
  }
  .grade-num {
    font-size: var(--font-normal);
    font-weight: var(--font-bold);
  }
  .grade-label {
    color: var(--text-faint);
    font-size: 9px;
    white-space: nowrap;
  }
  .source-label {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    text-align: center;
    padding: var(--spacing-xs);
  }
  .session-done {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: var(--spacing-s);
    padding: var(--spacing-xl);
    text-align: center;
  }
  .session-done h3 {
    margin: 0;
    font-size: var(--font-large);
  }
  .session-done p {
    margin: 0;
    color: var(--text-muted);
  }
  .stats-row {
    color: var(--text-faint);
    font-size: var(--font-smallest);
  }
</style>
