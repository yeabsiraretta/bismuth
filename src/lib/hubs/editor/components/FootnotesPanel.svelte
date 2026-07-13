<script lang="ts">
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import Panel from '@/ui/panel.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import { extractFootnotes, type FootnoteInfo } from '@/hubs/editor/services/footnote-service';

  interface Footnote {
    id: string;
    content: string;
    line: number;
    refs: number;
    hasDetail: boolean;
  }

  let footnotes = $state<Footnote[]>([]);

  $effect(() => {
    const path = getActiveNotePath();
    if (!path) {
      footnotes = [];
      return;
    }

    const content = getCachedContent(path) ?? '';
    const infos: FootnoteInfo[] = extractFootnotes(content);
    const lines = content.split('\n');
    const found: Footnote[] = [];

    for (const info of infos) {
      let detailContent = '';
      if (info.detailLine !== null && info.detailLine < lines.length) {
        const raw = lines[info.detailLine];
        const colonIdx = raw.indexOf(']:');
        detailContent = colonIdx > 0 ? raw.slice(colonIdx + 2).trim() : '';
      }
      found.push({
        id: info.id,
        content: detailContent,
        line: info.detailLine !== null ? info.detailLine + 1 : -1,
        refs: info.refPositions.length,
        hasDetail: info.detailLine !== null,
      });
    }

    footnotes = found;
  });

  function scrollToLine(line: number) {
    if (line < 1) return;
    window.dispatchEvent(new CustomEvent('editor-scroll-to-line', { detail: { line: line - 1 } }));
  }

  let ctxFn: Footnote | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, fn: Footnote) {
    e.preventDefault();
    ctxFn = fn;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxFn = null;
  }
</script>

<Panel title="Footnotes">
  {#snippet badge()}<span class="panel-badge">{footnotes.length}</span>{/snippet}

  {#if footnotes.length === 0}
    <div class="panel-empty">
      No footnotes
      <div class="panel-empty-hint">
        Use [^id]: content syntax<br />Alt+0 to insert numbered, Alt+- for named
      </div>
    </div>
  {:else}
    <ul class="fn-list">
      {#each footnotes as fn (fn.id)}
        <button
          class="fn-item"
          onclick={() => scrollToLine(fn.line)}
          oncontextmenu={(e) => handleContext(e, fn)}
        >
          <span class="fn-id">[^{fn.id}]</span>
          <span class="fn-content">{fn.content || '(no definition)'}</span>
          <span class="fn-meta">
            {#if fn.refs > 0}<span class="fn-refs">{fn.refs}×</span>{/if}
            {#if fn.line > 0}<span class="fn-line">L{fn.line}</span>{/if}
          </span>
        </button>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxFn} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxFn) scrollToLine(ctxFn.line);
      closeCtx();
    }}
    role="menuitem">Go to Line</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxFn) navigator.clipboard.writeText(`[^${ctxFn.id}]`);
      closeCtx();
    }}
    role="menuitem">Copy Reference</button
  >
  {#if ctxFn?.content}
    <button
      class="ctx-item"
      onclick={() => {
        if (ctxFn) navigator.clipboard.writeText(ctxFn.content);
        closeCtx();
      }}
      role="menuitem">Copy Content</button
    >
  {/if}
</ContextMenu>

<style>
  .fn-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .fn-item {
    display: flex;
    gap: 6px;
    align-items: baseline;
    padding: 6px 12px;
    border: none;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.7rem;
    background: none;
    color: inherit;
    width: 100%;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }
  .fn-item:hover {
    background: var(--color-surface-hover);
  }
  .fn-id {
    font-weight: 600;
    color: var(--color-accent);
    white-space: nowrap;
  }
  .fn-content {
    flex: 1;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fn-meta {
    display: flex;
    gap: 4px;
    align-items: baseline;
    flex-shrink: 0;
  }
  .fn-refs {
    color: var(--color-text-subtle);
    font-size: 0.6rem;
  }
  .fn-line {
    color: var(--color-text-muted);
    font-size: 0.6rem;
    flex-shrink: 0;
  }
</style>
