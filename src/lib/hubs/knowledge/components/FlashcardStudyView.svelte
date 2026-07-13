<script lang="ts">
  import type { Flashcard, ReviewGrade } from '@/hubs/knowledge/types/flashcard-types';

  let {
    dueCards,
    currentCard = $bindable(),
    studyIndex = $bindable(),
    queue = $bindable(),
    revealed = $bindable(),
    sessionGrades = $bindable(),
    renderFace,
    onStartStudy,
    onReveal,
    onGrade,
    onEndSession,
  }: {
    dueCards: Flashcard[];
    currentCard: Flashcard | null;
    studyIndex: number;
    queue: Flashcard[];
    revealed: boolean;
    sessionGrades: ReviewGrade[];
    renderFace: (card: Flashcard, side: 'front' | 'back') => string;
    onStartStudy: () => void;
    onReveal: () => void;
    onGrade: (g: ReviewGrade) => void;
    onEndSession: () => void;
  } = $props();

  const GRADE_LABELS: Record<number, string> = {
    0: 'Blackout',
    1: 'Wrong',
    2: 'Hard',
    3: 'OK',
    4: 'Good',
    5: 'Easy',
  };
  const GRADE_KEYS: ReviewGrade[] = [0, 1, 2, 3, 4, 5];
</script>

{#if !currentCard && studyIndex === 0}
  {#if dueCards.length > 0}
    <div class="study-start">
      <p>{dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review</p>
      <button class="study-btn" onclick={onStartStudy}>Start Study Session</button>
    </div>
  {:else}
    <div class="empty-state">
      <p>No cards due!</p>
      <span class="empty-hint">Come back later or add more cards to your notes.</span>
    </div>
  {/if}
{:else if !currentCard}
  <div class="session-done">
    <h3>Session Complete</h3>
    <p>{sessionGrades.length} cards reviewed</p>
    <p class="stats-row">
      Easy: {sessionGrades.filter((g) => g >= 4).length} · OK: {sessionGrades.filter((g) => g === 3)
        .length} · Hard: {sessionGrades.filter((g) => g < 3).length}
    </p>
    <button class="study-btn" onclick={onEndSession}>Done</button>
  </div>
{:else}
  <div class="study-header">
    <button class="back-btn" onclick={onEndSession}>← Back</button>
    <span class="progress-text">{studyIndex + 1} / {queue.length}</span>
  </div>
  <div class="progress-bar">
    <div
      class="progress-fill"
      style="width: {queue.length > 0 ? Math.round((studyIndex / queue.length) * 100) : 0}%"
    ></div>
  </div>
  <div class="study-area">
    <div
      class="study-card"
      role="button"
      tabindex="0"
      onclick={onReveal}
      onkeydown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') onReveal();
      }}
    >
      <div class="card-type-badge">{currentCard.type}</div>
      <div class="card-face">
        <span class="face-label">Question</span>
        <p class="face-content">{@html renderFace(currentCard, 'front')}</p>
      </div>
      {#if revealed}
        <div class="divider"></div>
        <div class="card-face">
          <span class="face-label">Answer</span>
          <p class="face-content">{@html renderFace(currentCard, 'back')}</p>
        </div>
      {/if}
    </div>
    {#if revealed}
      <div class="grade-buttons">
        {#each GRADE_KEYS as g (g)}
          <button
            class="grade-btn"
            class:fail={g < 3}
            class:pass={g >= 3}
            onclick={() => onGrade(g)}
          >
            <span class="grade-num">{g}</span>
            <span class="grade-label">{GRADE_LABELS[g]}</span>
          </button>
        {/each}
      </div>
    {:else}
      <button class="reveal-btn" onclick={onReveal}>Show Answer</button>
    {/if}
  </div>
{/if}

<style>
  .empty-state {
    text-align: center;
    padding: 64px 0;
    color: var(--color-text-muted);
  }
  .empty-hint {
    font-size: 0.75rem;
  }
  .study-start {
    text-align: center;
    padding: 48px 0;
  }
  .study-btn {
    padding: 8px 24px;
    font-size: 0.85rem;
    background: var(--color-accent);
    color: var(--color-background);
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-family: inherit;
  }
  .study-btn:hover {
    opacity: 0.9;
  }
  .session-done {
    text-align: center;
    padding: 48px 0;
  }
  .session-done h3 {
    color: var(--color-text);
    margin: 0 0 8px;
  }
  .stats-row {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  .study-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .back-btn {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 0.8rem;
    padding: 4px;
    font-family: inherit;
  }
  .back-btn:hover {
    color: var(--color-accent);
  }
  .progress-text {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
  .progress-bar {
    height: 4px;
    background: var(--color-border);
    border-radius: var(--radius-s);
    overflow: hidden;
    margin-bottom: 20px;
  }
  .progress-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: var(--radius-s);
    transition: width var(--transition-slow);
  }
  .study-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .study-card {
    width: 100%;
    max-width: 520px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-l);
    background: var(--color-surface);
    cursor: pointer;
    padding: 28px;
    transition: border-color var(--transition-base);
    position: relative;
  }
  .study-card:hover {
    border-color: var(--color-accent);
  }
  .card-type-badge {
    position: absolute;
    top: 8px;
    right: 10px;
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-subtle);
    background: var(--color-surface-hover);
    padding: 1px 6px;
    border-radius: var(--radius-s);
  }
  .card-face {
    text-align: center;
  }
  .face-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    display: block;
    margin-bottom: 8px;
  }
  .face-content {
    font-size: 1rem;
    color: var(--color-text);
    margin: 0;
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .divider {
    height: 1px;
    background: var(--color-border);
    margin: 16px 0;
  }
  .reveal-btn {
    padding: 8px 28px;
    font-size: 0.85rem;
    background: var(--color-accent);
    color: var(--color-background);
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-family: inherit;
  }
  .grade-buttons {
    display: flex;
    gap: 6px;
  }
  .grade-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    border-radius: var(--radius-s);
    cursor: pointer;
    min-width: 52px;
    font-family: inherit;
  }
  .grade-btn:hover {
    border-color: var(--color-accent);
  }
  .grade-btn.fail {
    border-color: oklch(from var(--color-error) l c h / 0.4);
  }
  .grade-btn.pass {
    border-color: oklch(from var(--color-success) l c h / 0.4);
  }
  .grade-num {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-text);
  }
  .grade-label {
    font-size: 0.55rem;
    color: var(--color-text-muted);
  }
</style>
