<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import { activeNote } from '@/stores/vault/vault';

  let allExpanded = true;

  function expandAll() {
    allExpanded = true;
  }
  function collapseAll() {
    allExpanded = false;
  }

  function scrollToHeading(line: number) {
    window.dispatchEvent(new CustomEvent('editor-scroll-to-line', { detail: { line } }));
  }

  interface HeadingItem {
    level: number;
    text: string;
    line: number;
  }

  $: allHeadings = extractHeadings($activeNote?.content || '');
  $: headings = allExpanded ? allHeadings : allHeadings.filter((h) => h.level === 1);

  function extractHeadings(content: string): HeadingItem[] {
    const lines = content.split('\n');
    const items: HeadingItem[] = [];
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)/);
      if (match) {
        items.push({ level: match[1].length, text: match[2], line: i });
      }
    }
    return items;
  }
</script>

<div class="outline-panel" role="tabpanel" aria-label="Outline">
  <PanelHeader count={allHeadings.length || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton icon="chevrons-down" title="Expand all" on:click={expandAll} />
      <ActionButton icon="chevrons-up" title="Collapse all" on:click={collapseAll} />
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    {#if !$activeNote}
      <EmptyState
        icon="file-text"
        title="No note open"
        description="Open a note to see its outline"
      />
    {:else if headings.length === 0}
      <EmptyState
        icon="list"
        title="No headings"
        description="Add headings with # to build an outline"
      />
    {:else}
      <ul class="heading-list">
        {#each headings as heading}
          <li class="heading-item level-{heading.level}">
            <div class="guide-line"></div>
            <button
              class="heading-btn"
              title="Jump to heading"
              on:click={() => scrollToHeading(heading.line)}
            >
              <span class="level-indicator">H{heading.level}</span>
              <span class="heading-text">{heading.text}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .outline-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-m);
  }

  .heading-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .heading-item {
    margin: 0;
    position: relative;
    display: flex;
    align-items: stretch;
  }

  .heading-item.level-1 {
    padding-left: 0;
  }
  .heading-item.level-2 {
    padding-left: 12px;
  }
  .heading-item.level-3 {
    padding-left: 24px;
  }
  .heading-item.level-4 {
    padding-left: 36px;
  }
  .heading-item.level-5 {
    padding-left: 48px;
  }
  .heading-item.level-6 {
    padding-left: 60px;
  }

  .guide-line {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--border-color);
    opacity: 0.5;
  }

  .heading-item.level-1 .guide-line {
    display: none;
  }
  .heading-item.level-2 .guide-line {
    left: 6px;
  }
  .heading-item.level-3 .guide-line {
    left: 18px;
  }
  .heading-item.level-4 .guide-line {
    left: 30px;
  }
  .heading-item.level-5 .guide-line {
    left: 42px;
  }
  .heading-item.level-6 .guide-line {
    left: 54px;
  }

  .level-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 16px;
    font-size: var(--font-ui-xs);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    background: var(--background-secondary);
    border-radius: var(--radius-xs);
    margin-right: var(--sidebar-item-gap);
    flex-shrink: 0;
  }

  .heading-btn {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 22px;
    padding: 0 var(--sidebar-item-padding-x);
    border: none;
    background: none;
    cursor: pointer;
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    text-align: left;
  }

  .heading-btn:hover {
    background: var(--background-modifier-hover);
  }

  .heading-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
