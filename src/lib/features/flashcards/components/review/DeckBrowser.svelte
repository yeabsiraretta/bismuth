<script lang="ts">
  /**
   * Deck Browser — hierarchical tree view of all decks with due counts.
   * Click a deck to start a review session or cram.
   * Mirrors the Obsidian SR "Review Flashcards from all notes" deck picker.
   */
  import type { DeckNode } from '../../types/flashcard';

  export let tree: DeckNode;
  export let onSelectDeck:
    ((detail: { deckPath: string; mode: 'review' | 'cram' }) => void) | undefined = undefined;

  let expandedDecks = new Set<string>(['']);

  interface FlatDeck {
    node: DeckNode;
    depth: number;
  }

  /** Flatten the deck tree into an indented list, respecting expand state. */
  function flattenTree(root: DeckNode): FlatDeck[] {
    const result: FlatDeck[] = [];
    function walk(node: DeckNode, depth: number) {
      result.push({ node, depth });
      if (expandedDecks.has(node.fullPath)) {
        for (const child of node.children) walk(child, depth + 1);
      }
    }
    for (const child of root.children) walk(child, 0);
    return result;
  }

  $: flatDecks = flattenTree(tree);

  function toggle(path: string) {
    if (expandedDecks.has(path)) expandedDecks.delete(path);
    else expandedDecks.add(path);
    expandedDecks = expandedDecks;
  }

  function review(deckPath: string) {
    onSelectDeck?.({ deckPath, mode: 'review' });
  }

  function cram(deckPath: string) {
    onSelectDeck?.({ deckPath, mode: 'cram' });
  }
</script>

<div class="deck-browser">
  <div class="browser-header">
    <span class="browser-title">Decks</span>
  </div>

  {#if tree.children.length === 0}
    <div class="empty-state">
      <p>No decks found.</p>
      <p class="hint">Add <code>#flashcards</code> or <code>::</code> cards to your notes.</p>
    </div>
  {:else}
    <div class="deck-list">
      {#each flatDecks as { node, depth } (node.fullPath)}
        <div class="deck-row" style="padding-left: {depth * 16 + 8}px">
          {#if node.children.length > 0}
            <button
              class="expand-btn"
              on:click={() => toggle(node.fullPath)}
              aria-label="Toggle {node.name}"
            >
              <span class="chevron" class:open={expandedDecks.has(node.fullPath)}>&#9656;</span>
            </button>
          {:else}
            <span class="expand-spacer"></span>
          {/if}
          <span class="deck-name">{node.name}</span>
          <span class="deck-count">{node.cardCount}</span>
          {#if node.dueCount > 0}
            <span class="deck-due">{node.dueCount}</span>
          {/if}
          <div class="deck-actions">
            {#if node.dueCount > 0}
              <button
                class="action-btn review"
                on:click={() => review(node.fullPath)}
                title="Review due cards"
              >
                Review
              </button>
            {/if}
            <button
              class="action-btn cram"
              on:click={() => cram(node.fullPath)}
              title="Cram all cards"
            >
              Cram
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .deck-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--background-secondary);
  }
  .browser-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }
  .browser-title {
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .empty-state {
    padding: var(--spacing-xl) var(--spacing-m);
    text-align: center;
    color: var(--text-muted);
    font-size: var(--font-smaller);
  }
  .empty-state p {
    margin: 0 0 var(--spacing-xs);
  }
  .hint {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
  .hint code {
    background: var(--background-primary-alt);
    padding: 1px 4px;
    border-radius: 3px;
  }
  .deck-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-xs) 0;
  }
  .deck-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--radius-s);
  }
  .deck-row:hover {
    background: var(--background-modifier-hover);
  }
  .expand-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: 16px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .expand-spacer {
    width: 16px;
  }
  .chevron {
    display: inline-block;
    transition: transform 0.15s;
  }
  .chevron.open {
    transform: rotate(90deg);
  }
  .deck-name {
    font-size: var(--font-smaller);
    color: var(--text-normal);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .deck-count {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
  .deck-due {
    font-size: 10px;
    padding: 0 5px;
    border-radius: var(--radius-s);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    font-weight: var(--font-bold);
  }
  .deck-actions {
    display: flex;
    gap: 4px;
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .deck-row:hover .deck-actions {
    opacity: 1;
  }
  .action-btn {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
    background: var(--background-primary);
    cursor: pointer;
    color: var(--text-muted);
  }
  .action-btn.review {
    border-color: var(--interactive-accent);
    color: var(--interactive-accent);
  }
  .action-btn:hover {
    filter: brightness(0.9);
  }
</style>
