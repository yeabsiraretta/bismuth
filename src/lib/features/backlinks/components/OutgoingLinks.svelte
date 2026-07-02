<script lang="ts">
  import { onMount } from 'svelte';
  import { getOutgoingLinks, createLinkFromUnlinkedMention } from '@/features/graph';
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import { log } from '@/utils/logger';
  import { openNote as navOpenNote } from '@/appNavigation';

  export let noteId: string;

  interface Link {
    targetNoteId: string;
    targetNoteName: string;
    targetNotePath: string;
    lineNumber: number;
    isResolved: boolean;
  }

  interface UnlinkedMention {
    potentialTargetName: string;
    context: string;
    lineNumber: number;
    matchingNotes: Array<{ id: string; name: string; path: string }>;
  }

  interface OutgoingLinksData {
    links: Link[];
    unlinkedMentions: UnlinkedMention[];
  }

  let outgoingData: OutgoingLinksData = { links: [], unlinkedMentions: [] };
  let loading = true;
  let error: string | null = null;

  async function loadOutgoingLinks() {
    try {
      loading = true;
      error = null;
      const data = (await getOutgoingLinks(noteId)) as unknown as OutgoingLinksData;
      outgoingData = data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load outgoing links';
      log.error('Error loading outgoing links', err);
    } finally {
      loading = false;
    }
  }

  function openNote(targetId: string, _line?: number) {
    navOpenNote(targetId);
  }

  async function createLinkFromMention(
    mention: UnlinkedMention,
    targetNote: {
      id: string;
      name: string;
      path: string;
    }
  ) {
    try {
      await createLinkFromUnlinkedMention(noteId, targetNote.id, mention.lineNumber);
      await loadOutgoingLinks();
    } catch (err) {
      log.error('Failed to create link', err);
    }
  }

  onMount(() => {
    loadOutgoingLinks();
  });

  $: if (noteId) loadOutgoingLinks();
</script>

<div class="outgoing-links">
  <PanelHeader
    icon="external-link"
    title="Outgoing Links"
    count={outgoingData.links.length || undefined}
  />

  {#if loading}
    <div class="loading">
      <Icon name="loader" size={24} />
      <span>Loading outgoing links...</span>
    </div>
  {:else if error}
    <div class="error">
      <Icon name="alert-circle" size={24} />
      <span>{error}</span>
    </div>
  {:else}
    <!-- Links Section -->
    <div class="section">
      <div class="section-header">
        <h4>
          Links
          <span class="count">({outgoingData.links.length})</span>
        </h4>
      </div>
      {#if outgoingData.links.length === 0}
        <div class="empty-state">No outgoing links</div>
      {:else}
        <div class="links-list">
          {#each outgoingData.links as link}
            <button
              class="link-item"
              class:unresolved={!link.isResolved}
              on:click={() => openNote(link.targetNoteId, link.lineNumber)}
            >
              <Icon name="file" size={16} />
              <div class="link-info">
                <span class="link-name">{link.targetNoteName}</span>
                <span class="link-path">{link.targetNotePath}</span>
              </div>
              {#if !link.isResolved}
                <span class="unresolved-badge">Unresolved</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Unlinked Mentions Section -->
    <div class="section">
      <div class="section-header">
        <h4>
          Unlinked mentions
          <span class="count">({outgoingData.unlinkedMentions.length})</span>
        </h4>
      </div>
      {#if outgoingData.unlinkedMentions.length === 0}
        <div class="empty-state">No unlinked mentions</div>
      {:else}
        <div class="mentions-list">
          {#each outgoingData.unlinkedMentions as mention}
            <div class="mention-item">
              <div class="mention-text">{mention.potentialTargetName}</div>
              <div class="mention-context">{mention.context}</div>
              {#if mention.matchingNotes.length > 0}
                <div class="matching-notes">
                  <span class="matching-label">Possible matches:</span>
                  {#each mention.matchingNotes as note}
                    <button
                      class="match-btn"
                      on:click={() => createLinkFromMention(mention, note)}
                      title={note.path}
                    >
                      <Icon name="plus" size={12} />
                      <span>{note.name}</span>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .outgoing-links {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-bg);
    color: var(--color-text);
    overflow: hidden;
  }
  .loading,
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-6);
    color: var(--color-text-muted);
  }
  .error {
    color: var(--color-error, #ef4444);
  }
  .section {
    border-bottom: 1px solid var(--color-border);
  }
  .section-header {
    padding: var(--space-3);
    background: var(--color-surface);
  }
  .section-header h4 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }
  .count {
    font-weight: normal;
    color: var(--color-text-muted);
  }
  .empty-state {
    padding: var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }
  .links-list,
  .mentions-list {
    overflow-y: auto;
    max-height: 400px;
  }
  .link-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    text-align: left;
    color: var(--color-text);
    transition: background 0.15s;
  }
  .link-item:hover {
    background: var(--color-surface);
  }
  .link-item:last-child {
    border-bottom: none;
  }
  .link-item.unresolved {
    opacity: 0.6;
  }
  .link-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .link-name {
    font-weight: 500;
    font-size: 0.875rem;
  }
  .link-path {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  .unresolved-badge {
    padding: var(--space-1) var(--space-2);
    background: var(--color-error, #ef4444);
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 4px;
  }
  .mention-item {
    padding: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }
  .mention-item:last-child {
    border-bottom: none;
  }
  .mention-text {
    font-weight: 500;
    font-size: 0.875rem;
    margin-bottom: var(--space-2);
  }
  .mention-context {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-bottom: var(--space-2);
    max-height: 3em;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .matching-notes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }
  .matching-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  .match-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: var(--color-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: white;
    font-size: 0.75rem;
    transition: opacity 0.15s;
  }
  .match-btn:hover {
    opacity: 0.8;
  }
</style>
