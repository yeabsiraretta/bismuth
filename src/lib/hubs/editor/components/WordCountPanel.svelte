<script lang="ts">
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import Panel from '@/ui/panel.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';

  let notePath = $derived(getActiveNotePath());
  let content = $derived(notePath ? (getCachedContent(notePath) ?? '') : '');

  let words = $derived(content ? content.split(/\s+/).filter((w) => w.length > 0).length : 0);
  let chars = $derived(content.length);
  let charsNoSpaces = $derived(content.replace(/\s/g, '').length);
  let lines = $derived(content ? content.split('\n').length : 0);
  let paragraphs = $derived(
    content ? content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0
  );
  let readingTime = $derived(Math.max(1, Math.ceil(words / 200)));
  let headings = $derived(content ? (content.match(/^#{1,6}\s/gm) ?? []).length : 0);
  let links = $derived(content ? (content.match(/\[\[.+?\]\]/g) ?? []).length : 0);
</script>

<Panel title="Document Stats">
  {#if !notePath}
    <div class="panel-empty">No note open</div>
  {:else}
    <div class="wc-grid">
      <div class="wc-stat">
        <span class="wc-num">{words.toLocaleString()}</span>
        <span class="wc-label">words</span>
      </div>
      <div class="wc-stat">
        <span class="wc-num">{chars.toLocaleString()}</span>
        <span class="wc-label">characters</span>
      </div>
      <div class="wc-stat">
        <span class="wc-num">{charsNoSpaces.toLocaleString()}</span>
        <span class="wc-label">chars (no space)</span>
      </div>
      <div class="wc-stat">
        <span class="wc-num">{lines}</span>
        <span class="wc-label">lines</span>
      </div>
      <div class="wc-stat">
        <span class="wc-num">{paragraphs}</span>
        <span class="wc-label">paragraphs</span>
      </div>
      <div class="wc-stat">
        <span class="wc-num">~{readingTime} min</span>
        <span class="wc-label">reading time</span>
      </div>
    </div>

    <div class="wc-section">
      <h4 class="wc-section-title">Structure</h4>
      <div class="wc-row">
        <span class="wc-row-label">Headings</span>
        <span class="wc-row-value">{headings}</span>
      </div>
      <div class="wc-row">
        <span class="wc-row-label">Wikilinks</span>
        <span class="wc-row-value">{links}</span>
      </div>
    </div>
  {/if}
</Panel>

<style>
  .wc-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 12px;
  }
  .wc-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
  }
  .wc-num {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .wc-label {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    margin-top: 2px;
  }
  .wc-section {
    border-top: 1px solid var(--color-border);
    padding-top: 8px;
  }
  .wc-section-title {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    margin: 0 0 6px;
  }
  .wc-row {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 0.7rem;
  }
  .wc-row-label {
    color: var(--color-text-muted);
  }
  .wc-row-value {
    color: var(--color-text);
    font-weight: 500;
  }
</style>
