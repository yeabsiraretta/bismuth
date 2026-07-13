<script lang="ts">
  import type { Flashcard } from '@/hubs/knowledge/types/flashcard-types';

  let {
    filteredCards,
    dueCards,
    renderFace,
    renderInline,
    onStudyDue,
  }: {
    filteredCards: Flashcard[];
    dueCards: Flashcard[];
    renderFace: (card: Flashcard, side: 'front' | 'back') => string;
    renderInline: (text: string) => string;
    onStudyDue: () => void;
  } = $props();
</script>

{#if filteredCards.length === 0}
  <div class="empty-state">
    <p>No flashcards found</p>
    <span class="empty-hint">Use :: separators, #card tags, ==cloze==, or Q:/A: in your notes</span>
  </div>
{:else}
  {#if dueCards.length > 0}
    <button class="study-btn top-study" onclick={onStudyDue}>
      Study {dueCards.length} due card{dueCards.length !== 1 ? 's' : ''}
    </button>
  {/if}
  <div class="browse-grid">
    {#each filteredCards as card (card.id)}
      <div class="browse-card">
        <span class="card-type-tag">{card.type}</span>
        <div class="card-front">{@html renderFace(card, 'front')}</div>
        {#if card.type === 'cloze'}
          <div class="card-back">{@html renderFace(card, 'back')}</div>
        {:else if card.back}
          <div class="card-back">{@html renderInline(card.back)}</div>
        {/if}
        <div class="card-meta">{card.deck} · L{card.sourceLine + 1}</div>
      </div>
    {/each}
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
  .top-study {
    margin-bottom: 16px;
  }
  .browse-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  .browse-card {
    padding: 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-l);
    background: var(--color-surface);
    position: relative;
  }
  .card-type-tag {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-subtle);
    background: var(--color-surface-hover);
    padding: 1px 5px;
    border-radius: var(--radius-s);
  }
  .card-front {
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 6px;
    font-size: 0.82rem;
    white-space: pre-wrap;
  }
  .card-back {
    color: var(--color-text-muted);
    font-size: 0.78rem;
    margin-bottom: 6px;
  }
  .card-meta {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
  }
</style>
