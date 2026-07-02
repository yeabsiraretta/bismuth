<script lang="ts">
  import type { CanvasElement } from '@/features/canvas/types/elements';
  import type { FeatureCardData } from '@/features/canvas/types/elements';
  import { log } from '@/utils/logger';

  export let elements: CanvasElement[] = [];

  let activeTab: 'markdown' | 'json' = 'markdown';
  let copyFeedback = '';

  $: featureCards = elements.filter(
    (el) => el.element_type === 'feature_card' && el.properties.featureCardData
  );

  $: cardData = featureCards.map((el) => el.properties.featureCardData as FeatureCardData);

  export function buildMarkdownTable(cards: FeatureCardData[]): string {
    const header = '| Feature | Status | Priority | Milestone | Owner |';
    const divider = '|---------|--------|----------|-----------|-------|';
    const rows = cards.map((c) => {
      const spec = c.specPath ? `[spec](${c.specPath})` : '';
      const title = spec ? `${c.title} ${spec}` : c.title;
      return `| ${title} | ${c.status} | ${c.priority} | ${c.milestone ?? ''} | ${c.owner ?? ''} |`;
    });
    return [header, divider, ...rows].join('\n');
  }

  export function buildJsonExport(cards: FeatureCardData[]): string {
    return JSON.stringify(cards, null, 2);
  }

  $: markdownContent = buildMarkdownTable(cardData);
  $: jsonContent = buildJsonExport(cardData);

  $: activeContent = activeTab === 'markdown' ? markdownContent : jsonContent;
  $: fileName = activeTab === 'markdown' ? 'roadmap.md' : 'roadmap.json';

  function handleCopy() {
    navigator.clipboard
      .writeText(activeContent)
      .then(() => {
        copyFeedback = 'Copied!';
        setTimeout(() => {
          copyFeedback = '';
        }, 2000);
      })
      .catch((err) => {
        log.error('RoadmapExport: clipboard write failed', err as Error);
      });
  }

  function handleDownload() {
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log.info('RoadmapExport: downloaded', { fileName, cards: cardData.length });
  }
</script>

<div class="roadmap-export" role="region" aria-label="Roadmap export">
  <div class="export-tabs" role="tablist">
    <button
      class="tab-btn {activeTab === 'markdown' ? 'tab-btn--active' : ''}"
      role="tab"
      aria-selected={activeTab === 'markdown'}
      on:click={() => (activeTab = 'markdown')}
    >
      Markdown Table
    </button>
    <button
      class="tab-btn {activeTab === 'json' ? 'tab-btn--active' : ''}"
      role="tab"
      aria-selected={activeTab === 'json'}
      on:click={() => (activeTab = 'json')}
    >
      JSON
    </button>
  </div>

  <pre class="export-preview" aria-label="{activeTab} preview">{activeContent}</pre>

  <div class="export-actions">
    <button class="action-btn" on:click={handleCopy} aria-label="Copy to clipboard">
      {copyFeedback || 'Copy to Clipboard'}
    </button>
    <button
      class="action-btn action-btn--primary"
      on:click={handleDownload}
      aria-label="Download {fileName}"
    >
      Download {fileName}
    </button>
  </div>

  {#if featureCards.length === 0}
    <p class="empty-hint">No feature cards found in this canvas.</p>
  {/if}
</div>

<style>
  .roadmap-export {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
    padding: var(--spacing-m);
    background: var(--background-primary);
    border-radius: var(--radius-m);
    border: 1px solid var(--border-color);
    min-width: 400px;
  }

  .export-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 6px;
  }

  .tab-btn {
    padding: 4px 12px;
    border-radius: var(--radius-s) var(--radius-s) 0 0;
    border: 1px solid transparent;
    background: none;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    cursor: pointer;
  }

  .tab-btn--active {
    border-color: var(--border-color);
    border-bottom-color: var(--background-primary);
    background: var(--background-primary);
    color: var(--text-primary);
    font-weight: 600;
  }

  .export-preview {
    background: var(--background-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    padding: var(--spacing-s);
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    overflow: auto;
    max-height: 200px;
    white-space: pre;
    margin: 0;
    color: var(--text-primary);
  }

  .export-actions {
    display: flex;
    gap: var(--spacing-s);
    justify-content: flex-end;
  }

  .action-btn {
    padding: var(--spacing-xs) var(--spacing-m);
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
    background: none;
    color: var(--text-primary);
    font-size: var(--font-ui-small);
    cursor: pointer;
    min-height: 32px;
  }

  .action-btn--primary {
    border-color: var(--interactive-accent);
    color: var(--interactive-accent);
  }

  .action-btn--primary:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
  }

  .empty-hint {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    text-align: center;
    margin: 0;
  }
</style>
