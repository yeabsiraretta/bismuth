<script lang="ts">
  import './+page.css';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import { awardFlashcardXp } from '@/hubs/core/stores/gamification-store.svelte';
  import { getSettings } from '@/hubs/core/stores/settings-store.svelte';
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import { getCardsInDeck } from '@/hubs/knowledge/services/flashcard-stats';
  import {
    getAnkiDecks,
    syncAnkiToVault,
    testAnkiConnection,
    type AnkiSyncResult,
  } from '@/hubs/knowledge/services/anki-sync-service';
  import {
    getDeckTree,
    getDueCardList,
    getScannedCards,
    getStats,
    gradeFlashcard,
    initFlashcardStore,
    scanMultipleNotes,
  } from '@/hubs/knowledge/stores/flashcard-store.svelte';
  import type { Flashcard, ReviewGrade } from '@/hubs/knowledge/types/flashcard-types';
  import FlashcardAnkiTab from '@/hubs/knowledge/components/FlashcardAnkiTab.svelte';
  import FlashcardBrowseView from '@/hubs/knowledge/components/FlashcardBrowseView.svelte';
  import FlashcardStatsTab from '@/hubs/knowledge/components/FlashcardStatsTab.svelte';
  import FlashcardStudyView from '@/hubs/knowledge/components/FlashcardStudyView.svelte';
  import { MetaTags } from 'svelte-meta-tags';
  import { onMount } from 'svelte';

  let { data } = $props();

  const settings = $derived(getSettings());
  let flashcardsEnabled = $derived(settings.integration.flashcardsEnabled);
  let autoScan = $derived(settings.integration.flashcardsAutoScan);
  let algorithm = $derived(settings.integration.schedulerAlgorithm);

  type Mode = 'browse' | 'study' | 'stats' | 'anki';

  let mode: Mode = $state('browse');
  let ankiConnected = $state(false);
  let ankiDecks = $state<string[]>([]);
  let ankiSyncing = $state(false);
  let ankiResult = $state<AnkiSyncResult | null>(null);
  let ankiError = $state<string | null>(null);

  async function checkAnkiConnection() {
    ankiError = null;
    ankiConnected = await testAnkiConnection();
    if (ankiConnected) {
      try {
        ankiDecks = await getAnkiDecks();
      } catch (e) {
        ankiError = (e as Error).message;
      }
    } else {
      ankiError =
        'Could not connect to AnkiConnect. Make sure Anki is running with the AnkiConnect add-on (port ' +
        settings.integration.ankiConnectPort +
        ').';
    }
  }

  async function doAnkiSync() {
    ankiSyncing = true;
    ankiResult = null;
    ankiError = null;
    try {
      ankiResult = await syncAnkiToVault(settings.integration.ankiBackupFolder);
      if (ankiResult.errors.length > 0) ankiError = ankiResult.errors.join('\n');
      rescanVault();
    } catch (e) {
      ankiError = (e as Error).message;
    } finally {
      ankiSyncing = false;
    }
  }
  let selectedDeck = $state('');

  onMount(() => {
    initFlashcardStore();
    rescanVault();

    const handleKeydown = (e: KeyboardEvent) => {
      if (mode !== 'study' || !currentCard) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        reveal();
        return;
      }
      if (revealed && e.key >= '0' && e.key <= '5') {
        e.preventDefault();
        grade(Number(e.key) as ReviewGrade);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });

  function rescanVault() {
    const notes = getNotes();
    const noteData = notes
      .map((n) => ({ path: n.path, content: getCachedContent(n.path) ?? '' }))
      .filter((n) => n.content.length > 0);
    scanMultipleNotes(noteData);
  }

  $effect(() => {
    if (autoScan) {
      const notes = getNotes();
      if (notes.length > 0) rescanVault();
    }
  });

  let allCards = $derived(getScannedCards());
  let deckTree = $derived(getDeckTree());
  let filteredCards = $derived(selectedDeck ? getCardsInDeck(allCards, selectedDeck) : allCards);
  let dueCards = $derived(getDueCardList());
  let stats = $derived(getStats());

  let queue: Flashcard[] = $state([]);
  let studyIndex = $state(0);
  let currentCard: Flashcard | null = $state(null);
  let revealed = $state(false);
  let sessionGrades: ReviewGrade[] = $state([]);

  const CLOZE_RE = /\{\{c\d+::([^}]+)\}\}/g;

  function renderClozeFront(text: string): string {
    return text.replace(CLOZE_RE, '<span class="cloze-blank">[___]</span>');
  }

  function renderClozeBack(text: string): string {
    return text.replace(CLOZE_RE, (_, content) => `<span class="cloze-answer">${content}</span>`);
  }

  function renderInline(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  function renderFace(card: Flashcard, side: 'front' | 'back'): string {
    const isReversed = card.type === 'basic-reversed' || card.type === 'multiline-reversed';
    const effectiveSide = isReversed ? (side === 'front' ? 'back' : 'front') : side;

    if (card.type === 'cloze') {
      const html = renderInline(card.front);
      return side === 'front' ? renderClozeFront(html) : renderClozeBack(html);
    }

    if (effectiveSide === 'front') {
      return renderInline(card.front);
    }
    return renderInline(card.back ?? '');
  }

  function startStudy() {
    const due = selectedDeck
      ? dueCards.filter((c) => c.deck === selectedDeck || c.deck.startsWith(selectedDeck + '::'))
      : dueCards;
    queue = [...due];
    studyIndex = 0;
    currentCard = queue[0] ?? null;
    revealed = false;
    sessionGrades = [];
    mode = 'study';
  }

  function reveal() {
    revealed = true;
  }

  function grade(g: ReviewGrade) {
    if (!currentCard) return;
    gradeFlashcard(currentCard.id, g, algorithm);
    sessionGrades = [...sessionGrades, g];
    if (g < 3 && queue.length < 30) queue = [...queue, currentCard];
    studyIndex++;
    if (studyIndex < queue.length) {
      currentCard = queue[studyIndex];
      revealed = false;
    } else {
      currentCard = null;
    }
  }

  function endSession() {
    if (sessionGrades.length > 0) awardFlashcardXp(sessionGrades.length);
    mode = 'browse';
  }
</script>

<MetaTags
  title={pageTitle(data.title ?? 'Flashcards')}
  description={data.description ?? 'Study your notes with spaced repetition flashcards.'}
  canonical="{SITE_URL}/flashcards"
  openGraph={{
    url: `${SITE_URL}/flashcards`,
    title: pageTitle(data.title ?? 'Flashcards'),
    description: data.description ?? '',
  }}
/>

{#if !flashcardsEnabled}
  <div class="fc-page">
    <div class="empty-state" style="padding:48px 24px;text-align:center">
      <h2 style="margin-bottom:8px">Flashcards Disabled</h2>
      <p style="color:var(--color-text-muted);font-size:0.85rem">
        Enable flashcards in Settings to use spaced repetition.
      </p>
    </div>
  </div>
{:else}
  <div class="fc-page">
    <header class="fc-header">
      <div class="fc-top">
        <h1 class="page-title">Flashcards</h1>
        <div class="mode-tabs">
          {#each [['browse', 'Browse'], ['study', 'Study'], ['stats', 'Stats'], ['anki', 'Anki Import']] as [id, label] (id)}
            <button
              class="mode-tab"
              class:active={mode === id}
              onclick={() => {
                if (id === 'anki') checkAnkiConnection();
                mode = id as Mode;
              }}>{label}</button
            >
          {/each}
        </div>
      </div>
      <div class="fc-deck-row">
        <select class="deck-select" bind:value={selectedDeck} aria-label="Filter by deck">
          <option value="">All Decks ({allCards.length})</option>
          {#each deckTree.children as node (node.fullPath)}
            <option value={node.fullPath}
              >{node.name} ({node.cardCount} / {node.dueCount} due)</option
            >
          {/each}
        </select>
        <span class="fc-count">{filteredCards.length} cards · {dueCards.length} due</span>
        <button class="rescan-btn" onclick={rescanVault}>Rescan</button>
      </div>
    </header>

    {#if mode === 'anki'}
      <FlashcardAnkiTab
        {ankiConnected}
        {ankiDecks}
        {ankiSyncing}
        {ankiResult}
        {ankiError}
        ankiConnectPort={settings.integration.ankiConnectPort}
        ankiBackupFolder={settings.integration.ankiBackupFolder}
        onCheckConnection={checkAnkiConnection}
        onSync={doAnkiSync}
      />
    {:else if mode === 'stats'}
      <FlashcardStatsTab {stats} />
    {:else if mode === 'study'}
      <FlashcardStudyView
        {dueCards}
        bind:currentCard
        bind:studyIndex
        bind:queue
        bind:revealed
        bind:sessionGrades
        {renderFace}
        onStartStudy={startStudy}
        onReveal={reveal}
        onGrade={grade}
        onEndSession={endSession}
      />
    {:else}
      <FlashcardBrowseView
        {filteredCards}
        {dueCards}
        {renderFace}
        {renderInline}
        onStudyDue={() => {
          mode = 'study';
          startStudy();
        }}
      />
    {/if}
  </div>
{/if}
