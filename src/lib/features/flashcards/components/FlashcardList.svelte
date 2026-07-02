<script lang="ts">
  import type { Flashcard } from '../types/flashcard';
  import { escapeHtml } from '@/utils/html';
  import { createEventDispatcher } from 'svelte';

  export let cards: Flashcard[] = [];
  export let loading = false;
  export let editable = false;

  const dispatch = createEventDispatcher<{
    editCard: { card: Flashcard };
    jumpToLine: { path: string; line: number };
  }>();

  let expandedId: string | null = null;

  const TYPE_LABEL: Record<string, string> = {
    basic: 'Basic',
    'basic-reversed': 'Reversed',
    multiline: 'Multi-line',
    'multiline-reversed': 'Multi-line Rev',
    cloze: 'Cloze',
  };

  const TYPE_COLOR: Record<string, string> = {
    basic: 'var(--text-success, #16a34a)',
    'basic-reversed': '#3b82f6',
    cloze: '#f59e0b',
    multiline: 'var(--text-success, #16a34a)',
    'multiline-reversed': '#3b82f6',
  };

  function toggleExpand(id: string) {
    expandedId = expandedId === id ? null : id;
  }

  function handleEdit(card: Flashcard) {
    dispatch('editCard', { card });
  }

  function handleJump(card: Flashcard) {
    dispatch('jumpToLine', { path: card.sourcePath, line: card.sourceLine });
  }
</script>

<div class="card-list" role="list" aria-label="Flashcards in this note">
  {#if loading}
    <div class="empty-state">
      <div class="spinner"></div>
      <p>Scanning for flashcards...</p>
    </div>
  {:else if cards.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      </div>
      <p>No flashcards found</p>
      <p class="hint">Create cards with <code>Question :: Answer</code></p>
      <p class="hint">or tag paragraphs with <code>#card</code></p>
    </div>
  {:else}
    {#each cards as card (card.id)}
      <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
      <div
        class="card-item"
        class:expanded={expandedId === card.id}
        role="listitem"
        style="--accent: {TYPE_COLOR[card.type] ?? 'var(--text-faint)'}"
        on:click={() => toggleExpand(card.id)}
      >
        <div class="card-header">
          <span class="card-type-dot"></span>
          <span class="card-type-label">{TYPE_LABEL[card.type] ?? card.type}</span>
          {#if card.ankiNoteId !== null}
            <span class="synced-badge">Anki</span>
          {/if}
          <span class="card-line">L{card.sourceLine + 1}</span>
        </div>

        <!-- eslint-disable-next-line svelte/no-at-html-tags -- Content escaped via escapeHtml before mark wrapping -->
        <div class="card-front">
          {@html escapeHtml(card.front).replace(/\{\{c\d+::(.+?)\}\}/g, '<mark>$1</mark>')}
        </div>

        {#if expandedId === card.id}
          {#if card.back}
            <div class="card-sep"></div>
            <div class="card-back">{card.back}</div>
          {/if}

          {#if card.tags.length > 0}
            <div class="card-tags">
              {#each card.tags.filter((t) => t !== 'bismuth') as tag}
                <span class="tag">#{tag}</span>
              {/each}
            </div>
          {/if}

          <div class="card-actions">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <span
              class="card-action"
              role="button"
              tabindex="0"
              on:click|stopPropagation={() => handleJump(card)}
            >
              Jump to line
            </span>
            {#if editable}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <span
                class="card-action"
                role="button"
                tabindex="0"
                on:click|stopPropagation={() => handleEdit(card)}
              >
                Edit
              </span>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .card-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-xs);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl) var(--spacing-m);
    text-align: center;
    color: var(--text-muted);
    font-size: var(--font-smaller);
    gap: var(--spacing-xs);
  }
  .empty-state p {
    margin: 0;
  }
  .empty-icon {
    color: var(--text-faint);
    opacity: 0.4;
    margin-bottom: var(--spacing-xs);
  }
  .hint {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
  .hint code {
    background: var(--background-primary-alt);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-top-color: var(--interactive-accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .card-item {
    display: block;
    width: 100%;
    text-align: left;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius-m);
    padding: var(--spacing-s) var(--spacing-s) var(--spacing-s) var(--spacing-m);
    margin-bottom: var(--spacing-xs);
    cursor: pointer;
    transition:
      border-color 0.12s,
      box-shadow 0.12s;
  }
  .card-item:hover {
    border-color: var(--accent);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  .card-item.expanded {
    border-color: var(--accent);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-bottom: 4px;
  }
  .card-type-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
  }
  .card-type-label {
    font-size: 10px;
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-faint);
  }
  .synced-badge {
    font-size: 9px;
    padding: 0 5px;
    border-radius: 3px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    font-weight: 600;
  }
  .card-line {
    font-size: 10px;
    color: var(--text-faint);
    margin-left: auto;
  }

  .card-front {
    font-size: var(--font-smaller);
    color: var(--text-normal);
    font-weight: var(--font-medium);
    word-break: break-word;
    line-height: 1.5;
  }
  .card-front :global(mark) {
    background: rgba(245, 158, 11, 0.2);
    color: inherit;
    border-radius: 2px;
    padding: 0 3px;
    border-bottom: 2px dashed rgba(245, 158, 11, 0.5);
  }

  .card-sep {
    height: 1px;
    background: var(--border-color);
    margin: var(--spacing-xs) 0;
  }
  .card-back {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    line-height: 1.5;
    word-break: break-word;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: var(--spacing-xs);
  }
  .tag {
    font-size: 10px;
    color: var(--text-faint);
    background: var(--background-modifier-hover);
    padding: 0 5px;
    border-radius: 3px;
  }

  .card-actions {
    display: flex;
    gap: var(--spacing-s);
    margin-top: var(--spacing-xs);
    padding-top: var(--spacing-xs);
    border-top: 1px solid var(--border-color);
  }
  .card-action {
    font-size: var(--font-smallest);
    color: var(--interactive-accent);
    cursor: pointer;
    padding: 2px 0;
  }
  .card-action:hover {
    text-decoration: underline;
  }
</style>
