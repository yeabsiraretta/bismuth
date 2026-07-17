<script lang="ts">
  import './+page.css';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import { awardFlashcardXp } from '@/hubs/core/stores/gamification-store.svelte';
  import { getSettings } from '@/hubs/core/stores/settings-store.svelte';
  import {
    getNotes,
    rescanVault as refreshVaultNotes,
  } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent, updateCachedContent } from '@/hubs/editor/services/file-ops';
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
  import { createNote, readNote, writeNote } from '@/sal/note-service';
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
      rescanFlashcards();
    } catch (e) {
      ankiError = (e as Error).message;
    } finally {
      ankiSyncing = false;
    }
  }
  let selectedDeck = $state('');
  let createDeckInput = $state('');
  let createCardDeckInput = $state('');
  let createCardFront = $state('');
  let createCardBack = $state('');
  let createCardType = $state<'basic' | 'basic-reversed' | 'cloze'>('basic');
  let createStatus = $state<string | null>(null);
  let createError = $state<string | null>(null);

  const DECK_SEGMENT_SAFE_RE = /[^a-zA-Z0-9 _-]/g;

  onMount(() => {
    initFlashcardStore();
    rescanFlashcards();

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

  function rescanFlashcards() {
    const notes = getNotes();
    const noteData = notes
      .map((n) => ({ path: n.path, content: getCachedContent(n.path) ?? '' }))
      .filter((n) => n.content.length > 0);
    scanMultipleNotes(noteData);
  }

  $effect(() => {
    if (autoScan) {
      const notes = getNotes();
      if (notes.length > 0) rescanFlashcards();
    }
  });

  function normalizeDeckSegments(raw: string): string[] {
    const normalized = raw
      .trim()
      .replace(/^Bismuth::/i, '')
      .replaceAll('/', '::');
    if (!normalized) return [];
    return normalized
      .split('::')
      .map((part) => part.trim().replace(DECK_SEGMENT_SAFE_RE, ''))
      .filter((part) => part.length > 0);
  }

  function deckPathFromSegments(segments: string[]): string {
    return segments.length > 0 ? `Bismuth::${segments.join('::')}` : 'Bismuth';
  }

  function cardLine(
    front: string,
    back: string,
    type: 'basic' | 'basic-reversed' | 'cloze'
  ): string {
    if (type === 'cloze') return front.trim();
    if (type === 'basic-reversed') return `${front.trim()} ::: ${back.trim()}`;
    return `${front.trim()} :: ${back.trim()}`;
  }

  async function ensureDeckNote(deckInput: string): Promise<{
    notePath: string;
    deckPath: string;
    noteContent: string;
  }> {
    const segments = normalizeDeckSegments(deckInput);
    if (segments.length === 0) {
      throw new Error('Deck name is required.');
    }
    const deckPath = deckPathFromSegments(segments);
    const deckFolder = `flashcards/${segments.join('/')}`;
    const notePath = `${deckFolder}/cards.md`;
    const existing = getNotes().find((n) => n.path === notePath);

    if (!existing) {
      const header = `# ${segments[segments.length - 1]} Flashcards\n\n#flashcards/${segments.join('/')}\n`;
      await createNote('cards', deckFolder, header);
      updateCachedContent(notePath, header);
      return { notePath, deckPath, noteContent: header };
    }

    const cached = getCachedContent(notePath);
    if (cached !== undefined) {
      return { notePath, deckPath, noteContent: cached };
    }
    const note = await readNote(notePath);
    updateCachedContent(notePath, note.content);
    return { notePath, deckPath, noteContent: note.content };
  }

  async function handleCreateDeck() {
    createStatus = null;
    createError = null;
    try {
      const { deckPath } = await ensureDeckNote(createDeckInput);
      await refreshVaultNotes();
      rescanFlashcards();
      selectedDeck = deckPath;
      createCardDeckInput = deckPath;
      createStatus = `Deck ready: ${deckPath}`;
      createDeckInput = '';
    } catch (e) {
      createError = e instanceof Error ? e.message : String(e);
    }
  }

  async function handleCreateCard() {
    createStatus = null;
    createError = null;
    const front = createCardFront.trim();
    const back = createCardBack.trim();
    if (!front) {
      createError = 'Front text is required.';
      return;
    }
    if (createCardType !== 'cloze' && !back) {
      createError = 'Back text is required for non-cloze cards.';
      return;
    }

    try {
      const { notePath, deckPath, noteContent } = await ensureDeckNote(
        createCardDeckInput || selectedDeck
      );
      const line = cardLine(front, back, createCardType);
      const spacer = noteContent.trimEnd().length === 0 ? '' : '\n\n';
      const updated = `${noteContent.trimEnd()}${spacer}${line}\n`;
      await writeNote(notePath, updated);
      updateCachedContent(notePath, updated);
      await refreshVaultNotes();
      rescanFlashcards();
      selectedDeck = deckPath;
      createCardDeckInput = deckPath;
      createCardFront = '';
      createCardBack = '';
      createStatus = `Card added to ${deckPath}`;
    } catch (e) {
      createError = e instanceof Error ? e.message : String(e);
    }
  }

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
        <button class="rescan-btn" onclick={rescanFlashcards}>Rescan</button>
      </div>
      <div class="fc-create-row">
        <div class="fc-create-block">
          <h3>Create Deck</h3>
          <div class="fc-create-fields">
            <input
              class="fc-input"
              type="text"
              placeholder="Deck name (e.g. CS::Algorithms)"
              bind:value={createDeckInput}
              aria-label="New deck name"
            />
            <button class="create-btn" onclick={handleCreateDeck}>Create Deck</button>
          </div>
        </div>
        <div class="fc-create-block">
          <h3>Create Card</h3>
          <div class="fc-create-fields fc-create-grid">
            <input
              class="fc-input"
              type="text"
              placeholder="Deck (defaults to selected deck)"
              bind:value={createCardDeckInput}
              aria-label="Card deck"
            />
            <select class="deck-select" bind:value={createCardType} aria-label="Card type">
              <option value="basic">Basic (::)</option>
              <option value="basic-reversed">Basic Reversed (:::) </option>
              <option value="cloze">Cloze</option>
            </select>
            <input
              class="fc-input"
              type="text"
              placeholder={createCardType === 'cloze'
                ? 'Front text with {{c1::...}} or ==...=='
                : 'Front'}
              bind:value={createCardFront}
              aria-label="Card front"
            />
            {#if createCardType !== 'cloze'}
              <input
                class="fc-input"
                type="text"
                placeholder="Back"
                bind:value={createCardBack}
                aria-label="Card back"
              />
            {/if}
            <button class="create-btn" onclick={handleCreateCard}>Create Card</button>
          </div>
        </div>
      </div>
      {#if createStatus}
        <p class="fc-status">{createStatus}</p>
      {/if}
      {#if createError}
        <p class="fc-error">{createError}</p>
      {/if}
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
