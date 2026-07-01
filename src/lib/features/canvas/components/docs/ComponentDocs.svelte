<script lang="ts">
  import DOMPurify from 'dompurify';
  import type { ComponentDoc } from '@/features/canvas/types/design/documentation';

  export let doc: ComponentDoc | null = null;

  let activeTab: 'description' | 'usage' | 'accessibility' | 'history' = 'description';

  function sanitizeHtml(markdown: string): string {
    return DOMPurify.sanitize(markdown, {
      FORCE_BODY: true,
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    });
  }
</script>

<div class="component-docs">
  {#if !doc}
    <div class="empty">Select a component to view documentation</div>
  {:else}
    <div class="tabs">
      <button
        class:active={activeTab === 'description'}
        on:click={() => (activeTab = 'description')}>Description</button
      >
      <button class:active={activeTab === 'usage'} on:click={() => (activeTab = 'usage')}
        >Usage</button
      >
      <button
        class:active={activeTab === 'accessibility'}
        on:click={() => (activeTab = 'accessibility')}>A11y</button
      >
      <button class:active={activeTab === 'history'} on:click={() => (activeTab = 'history')}
        >History</button
      >
    </div>

    <div class="tab-content">
      {#if activeTab === 'description'}
        <div class="markdown-content">{@html sanitizeHtml(doc.description)}</div>
      {:else if activeTab === 'usage'}
        <div class="markdown-content">{@html sanitizeHtml(doc.usageGuidelines)}</div>
        {#if doc.doExamples.length > 0}
          <h5>Do</h5>
          <ul class="examples do">
            {#each doc.doExamples as ex}<li>{ex}</li>{/each}
          </ul>
        {/if}
        {#if doc.dontExamples.length > 0}
          <h5>Don't</h5>
          <ul class="examples dont">
            {#each doc.dontExamples as ex}<li>{ex}</li>{/each}
          </ul>
        {/if}
      {:else if activeTab === 'accessibility'}
        <div class="markdown-content">{@html sanitizeHtml(doc.accessibilityNotes)}</div>
      {:else if activeTab === 'history'}
        <div class="changelog">
          {#each doc.changeLog as entry}
            <div class="change-entry">
              <span class="change-date">{entry.date}</span>
              <span class="change-author">{entry.author}</span>
              <span class="change-desc">{entry.description}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .component-docs {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .empty {
    color: var(--text-muted);
    text-align: center;
    padding: var(--spacing-lg);
  }
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
  }
  .tabs button {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: none;
    background: none;
    cursor: pointer;
    font-size: var(--font-size-sm);
    border-bottom: 2px solid transparent;
  }
  .tabs button.active {
    border-bottom-color: var(--accent);
    color: var(--accent);
  }
  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
  }
  .markdown-content {
    line-height: 1.6;
    font-size: var(--font-size-sm);
  }
  .examples {
    padding-left: var(--spacing-md);
  }
  .examples.do li {
    color: var(--text-success);
  }
  .examples.dont li {
    color: var(--text-error);
  }
  h5 {
    margin: var(--spacing-sm) 0 var(--spacing-xs);
    font-size: var(--font-size-sm);
  }
  .changelog {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  .change-entry {
    display: grid;
    grid-template-columns: 80px 80px 1fr;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    padding: var(--spacing-xs) 0;
    border-bottom: 1px solid var(--border);
  }
  .change-date {
    color: var(--text-muted);
  }
  .change-author {
    font-weight: 500;
  }
</style>
