<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import Panel from '@/ui/panel.svelte';
  import {
    applyLink,
    applyLinkAll,
    computeMentionsForActiveNote,
    ignoreMention,
    getIgnoreList,
    removeFromIgnoreList,
    clearIgnoreList,
  } from '@/hubs/knowledge/stores/topic-link-store.svelte';
  import type { UnlinkedMention } from '@/hubs/knowledge/services/topic-linking-service';

  let notePath = $derived(getActiveNotePath() ?? '');
  let mentions = $state<UnlinkedMention[]>([]);
  let showIgnoreList = $state(false);

  $effect(() => {
    if (notePath) {
      mentions = computeMentionsForActiveNote();
    } else {
      mentions = [];
    }
  });

  function refresh() {
    mentions = computeMentionsForActiveNote();
  }

  async function handleLink(mention: UnlinkedMention) {
    await applyLink(mention);
    refresh();
  }

  async function handleLinkAll() {
    if (mentions.length === 0) return;
    await applyLinkAll(mentions);
    refresh();
  }

  function handleIgnore(mention: UnlinkedMention) {
    ignoreMention(mention);
    refresh();
  }

  function handleUnignore(title: string) {
    removeFromIgnoreList(title);
    refresh();
  }

  function handleClearIgnoreList() {
    clearIgnoreList();
    refresh();
  }

  let ctxMention: UnlinkedMention | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, mention: UnlinkedMention) {
    e.preventDefault();
    ctxMention = mention;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxMention = null;
  }

  function highlightMatch(
    context: string,
    column: number,
    length: number
  ): { before: string; match: string; after: string } {
    return {
      before: context.slice(0, column),
      match: context.slice(column, column + length),
      after: context.slice(column + length),
    };
  }
</script>

<Panel title="Topic Links">
  {#snippet badge()}<span class="panel-badge">{mentions.length}</span>{/snippet}
  {#snippet actions()}
    <button class="panel-action" onclick={refresh} title="Refresh">
      <BIcon name="refresh" size={14} />
    </button>
    {#if mentions.length > 0}
      <button class="panel-action" onclick={handleLinkAll} title="Link All">
        <BIcon name="chainLink" size={14} />
      </button>
    {/if}
    <button
      class="panel-action"
      class:active={showIgnoreList}
      onclick={() => (showIgnoreList = !showIgnoreList)}
      title="Toggle Ignore List"
    >
      <BIcon name="eye" size={14} />
    </button>
  {/snippet}

  {#if showIgnoreList}
    <div class="tl-section">
      <div class="tl-section-header">
        <span class="tl-section-title">Ignored Titles</span>
        {#if getIgnoreList().length > 0}
          <button class="tl-clear-btn" onclick={handleClearIgnoreList}>Clear All</button>
        {/if}
      </div>
      {#if getIgnoreList().length === 0}
        <div class="panel-empty">No ignored titles</div>
      {:else}
        <ul class="tl-list">
          {#each getIgnoreList() as title (title)}
            <li class="tl-ignore-item">
              <span class="tl-ignore-title">{title}</span>
              <button class="tl-action-btn" onclick={() => handleUnignore(title)} title="Restore">
                <BIcon name="undo" size={12} />
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else if !notePath}
    <div class="panel-empty">No note selected</div>
  {:else if mentions.length === 0}
    <div class="panel-empty">No unlinked mentions found</div>
  {:else}
    <ul class="tl-list">
      {#each mentions as mention, idx (`${mention.line}:${mention.column}:${idx}`)}
        {@const parts = highlightMatch(mention.context, mention.column, mention.length)}
        <li>
          <div class="tl-item" role="listitem" oncontextmenu={(e) => handleContext(e, mention)}>
            <div class="tl-item-header">
              <BIcon name="links" size={14} class="tl-icon" />
              <span class="tl-target">{mention.targetTitle}</span>
              <span class="tl-line">L{mention.line + 1}</span>
            </div>
            <div class="tl-context">
              <span class="tl-ctx-text">{parts.before}</span><mark class="tl-highlight"
                >{parts.match}</mark
              ><span class="tl-ctx-text">{parts.after}</span>
            </div>
            <div class="tl-actions">
              <button
                class="tl-action-btn tl-link-btn"
                onclick={() => handleLink(mention)}
                title="Link"
              >
                <BIcon name="chainLink" size={12} />
                <span>Link</span>
              </button>
              <button
                class="tl-action-btn tl-ignore-btn"
                onclick={() => handleIgnore(mention)}
                title="Ignore"
              >
                <BIcon name="eyeOff" size={12} />
                <span>Ignore</span>
              </button>
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxMention} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxMention) handleLink(ctxMention);
      closeCtx();
    }}
    role="menuitem">Link</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxMention) handleIgnore(ctxMention);
      closeCtx();
    }}
    role="menuitem">Ignore</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxMention) navigator.clipboard.writeText(ctxMention.targetTitle);
      closeCtx();
    }}
    role="menuitem">Copy Title</button
  >
</ContextMenu>

<style>
  .tl-list {
    list-style: none;
    padding: 4px;
    margin: 0;
  }
  .tl-item {
    padding: 6px 8px;
    border-radius: var(--radius-s);
    cursor: default;
    font-size: 0.75rem;
  }
  .tl-item:hover {
    background: var(--color-surface-hover);
  }
  .tl-item-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
  }
  .tl-item-header :global(.tl-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--color-accent);
  }
  .tl-target {
    font-weight: 600;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .tl-line {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
  .tl-context {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    margin: 2px 0 4px 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tl-ctx-text {
    color: var(--color-text-subtle);
  }
  .tl-highlight {
    background: oklch(from var(--color-accent) l c h / 0.2);
    color: var(--color-accent);
    border-radius: 2px;
    padding: 0 2px;
    font-weight: 600;
  }
  .tl-actions {
    display: flex;
    gap: 6px;
    margin-left: 20px;
  }
  .tl-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.65rem;
    cursor: pointer;
    font-family: inherit;
  }
  .tl-action-btn:hover {
    background: var(--color-surface);
    color: var(--color-text);
  }
  .tl-link-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .tl-ignore-btn:hover {
    border-color: var(--color-text-muted);
  }
  .tl-section {
    padding: 4px;
  }
  .tl-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
  }
  .tl-section-title {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .tl-clear-btn {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    font-family: inherit;
  }
  .tl-clear-btn:hover {
    color: var(--color-text);
  }
  .tl-ignore-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 8px;
    font-size: 0.75rem;
    border-radius: var(--radius-s);
  }
  .tl-ignore-item:hover {
    background: var(--color-surface-hover);
  }
  .tl-ignore-title {
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .panel-action.active {
    color: var(--color-accent);
  }
</style>
