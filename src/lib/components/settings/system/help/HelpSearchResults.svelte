<script lang="ts">
  import type { HelpTopic } from './helpIndex';
  import { assertHelpUrl } from '@/utils/settings/helpUrls';
  import { openExternalUrl } from '@/services/system/shell';
  import { log } from '@/utils/logger';

  export let topics: HelpTopic[] = [];

  async function openTopic(url: string) {
    try {
      assertHelpUrl(url);
      await openExternalUrl(url);
    } catch (error) {
      log.error('Help URL rejected or failed to open', error as Error, { url });
    }
  }
</script>

{#if topics.length === 0}
  <p class="no-results">No topics found. Try different keywords.</p>
{:else}
  <ul class="topic-list" role="list">
    {#each topics as topic (topic.url)}
      <li class="topic-item">
        <span class="topic-name">{topic.topic}</span>
        <button
          class="open-btn"
          on:click={() => openTopic(topic.url)}
          aria-label="Open {topic.topic} in browser"
        >
          Open &rarr;
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .topic-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .topic-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--radius-s);
    background: var(--background-secondary);
  }

  .topic-item:hover {
    background: var(--background-modifier-hover);
  }

  .topic-name {
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }

  .open-btn {
    font-size: var(--font-ui-small);
    color: var(--interactive-accent);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--radius-s);
    min-height: 28px;
  }

  .open-btn:hover {
    background: var(--background-modifier-hover);
  }

  .open-btn:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .no-results {
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    text-align: center;
    padding: var(--spacing-l);
  }
</style>
