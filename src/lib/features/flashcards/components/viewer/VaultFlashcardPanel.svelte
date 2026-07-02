<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { notes } from '@/stores/vault/vault';
  import { parseAllCards } from '../../services/studyParser';
  import {
    getDueCards,
    getCardsInDeck,
    buildDeckTree,
    deserializeRecords,
    serializeRecords,
    gradeCardWithAlgorithm,
    computeStats,
    deserializeEvents,
    serializeEvents,
  } from '../../services/scheduler';
  import type { ReviewRecord, ReviewGrade } from '../../services/scheduler';
  import type { Flashcard, ReviewEvent, SchedulerAlgorithm } from '../../types/flashcard';
  import { escapeHtml } from '@/utils/html';
  import { log } from '@/utils/logger';
  import DeckBrowser from '../review/DeckBrowser.svelte';
  import StatsPanel from '../review/StatsPanel.svelte';

  type ViewMode = 'decks' | 'study' | 'stats';
  let viewMode: ViewMode = 'decks';
  let allCards: Flashcard[] = [];
  let reviewRecords = new Map<string, ReviewRecord>();
  let reviewEvents: ReviewEvent[] = [];
  let scanning = false;
  let unsubNotes: (() => void) | null = null;
  let algorithm: SchedulerAlgorithm = 'sm2';
  let studyMode: 'review' | 'cram' = 'review';

  $: deckTree = buildDeckTree(allCards, reviewRecords);
  $: stats = computeStats(allCards, reviewRecords, reviewEvents);

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
    const evRaw = localStorage.getItem('bismuth-flashcard-events');
    if (evRaw) reviewEvents = deserializeEvents(evRaw);
    const alg = localStorage.getItem('bismuth-flashcard-algorithm');
    if (alg === 'fsrs') algorithm = 'fsrs';
    unsubNotes = notes.subscribe(scanAllNotes);
  });

  onDestroy(() => {
    unsubNotes?.();
  });

  function scanAllNotes(noteList: Array<{ path: string; content: string }>) {
    if (!noteList || noteList.length === 0) {
      allCards = [];
      return;
    }
    scanning = true;
    const cards: Flashcard[] = [];
    for (const note of noteList) {
      if (!note.content) continue;
      try {
        const parsed = parseAllCards(note.path, note.content);
        cards.push(...parsed);
      } catch {
        // skip notes that fail to parse
      }
    }
    allCards = cards;
    scanning = false;
    log.debug('Vault flashcard scan complete', { total: cards.length });
  }

  function handleDeckSelect(detail: { deckPath: string; mode: 'review' | 'cram' }) {
    const { deckPath, mode } = detail;
    const deckCards = getCardsInDeck(allCards, deckPath);
    studyMode = mode;
    if (mode === 'cram') {
      queue = [...deckCards];
    } else {
      queue = getDueCards(deckCards, reviewRecords);
    }
    if (queue.length === 0) return;
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
    if (studyMode === 'review') {
      const updated = gradeCardWithAlgorithm(
        reviewRecords.get(currentCard.id) ?? null,
        currentCard.id,
        g,
        algorithm
      );
      reviewRecords.set(currentCard.id, updated);
      reviewRecords = reviewRecords;
      localStorage.setItem('bismuth-flashcard-reviews', serializeRecords(reviewRecords));
      // Track event
      reviewEvents = [
        ...reviewEvents,
        {
          cardId: currentCard.id,
          grade: g,
          timestamp: new Date().toISOString(),
          intervalDays: updated.intervalDays,
          algorithm,
        },
      ];
      localStorage.setItem('bismuth-flashcard-events', serializeEvents(reviewEvents));
    }
    sessionGrades.push(g);
    if (g < 3 && queue.length < 50) queue.push(currentCard);
    studyIndex++;
    if (studyIndex < queue.length) {
      currentCard = queue[studyIndex];
      revealed = false;
    } else {
      currentCard = null;
    }
  }

  function endSession() {
    viewMode = 'decks';
  }

  function toggleAlgorithm() {
    algorithm = algorithm === 'sm2' ? 'fsrs' : 'sm2';
    localStorage.setItem('bismuth-flashcard-algorithm', algorithm);
  }

  function getSourceName(path: string): string {
    return path.split('/').pop()?.replace(/\.md$/, '') ?? path;
  }
</script>

<div class="vault-fc-panel">
  <div class="panel-header">
    <span class="panel-title">Vault Flashcards</span>
    <span class="badge">{allCards.length}</span>
    <div class="header-actions">
      <button
        class="tab-btn"
        class:active={viewMode === 'decks'}
        on:click={() => (viewMode = 'decks')}>Decks</button
      >
      <button
        class="tab-btn"
        class:active={viewMode === 'stats'}
        on:click={() => (viewMode = 'stats')}>Stats</button
      >
      <button class="algo-btn" on:click={toggleAlgorithm} title="Switch algorithm">
        {algorithm.toUpperCase()}
      </button>
    </div>
  </div>

  {#if scanning}
    <div class="empty-state">Scanning vault...</div>
  {:else if viewMode === 'decks'}
    <DeckBrowser tree={deckTree} onSelectDeck={handleDeckSelect} />
  {:else if viewMode === 'stats'}
    <StatsPanel {stats} />
  {:else if viewMode === 'study'}
    <div class="study-header">
      <button class="back-btn" on:click={endSession}>Back to decks</button>
      <span class="study-mode-label">{studyMode === 'cram' ? 'Cram' : 'Review'}</span>
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
        <div class="card-meta-row">
          <span class="card-type" data-type={currentCard.type}>{currentCard.type}</span>
          {#if currentCard.context}
            <span class="card-context">{currentCard.context}</span>
          {/if}
        </div>
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
      <div class="source-label">From: {getSourceName(currentCard.sourcePath)}</div>
    {/if}
  {/if}
</div>

<style>
  .vault-fc-panel {
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
    flex-wrap: wrap;
  }
  .panel-title {
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: var(--radius-s);
    background: var(--background-modifier-hover);
    color: var(--text-muted);
  }
  .header-actions {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }
  .tab-btn {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
    background: var(--background-primary);
    cursor: pointer;
    color: var(--text-muted);
  }
  .tab-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }
  .algo-btn {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
    background: var(--background-primary);
    cursor: pointer;
    color: var(--text-faint);
    font-weight: var(--font-bold);
  }
  .empty-state {
    padding: var(--spacing-xl) var(--spacing-m);
    text-align: center;
    color: var(--text-muted);
    font-size: var(--font-smaller);
  }
  .study-btn {
    margin: 0 var(--spacing-m) var(--spacing-m);
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
  .study-mode-label {
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
    color: var(--interactive-accent);
    text-transform: uppercase;
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
  .card-meta-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .card-type {
    font-size: 10px;
    font-weight: var(--font-semibold);
    padding: 1px 6px;
    border-radius: var(--radius-s);
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .card-context {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card-question {
    font-size: var(--font-normal);
    font-weight: var(--font-medium);
    line-height: 1.6;
    color: var(--text-normal);
  }
  .card-question :global(mark) {
    background: var(--text-highlight-bg, rgba(255, 208, 0, 0.4));
    border-radius: 2px;
    padding: 0 3px;
  }
  .card-question :global(.cloze-blank) {
    background: var(--background-modifier-border);
    color: transparent;
    border-radius: 3px;
    padding: 0 12px;
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
    padding: var(--spacing-xs);
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
    cursor: pointer;
    font-size: 10px;
    background: var(--background-secondary);
  }
  .grade-btn.fail {
    border-color: var(--text-error);
    color: var(--text-error);
  }
  .grade-btn.pass {
    border-color: var(--text-success);
    color: var(--text-success);
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
