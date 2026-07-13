<script lang="ts">
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import {
    lintMarkdown,
    lintSummary,
    type LintDiagnostic,
  } from '@/hubs/editor/services/lint-service';
  import ContextMenu from '@/ui/context-menu.svelte';
  import Panel from '@/ui/panel.svelte';

  let notePath = $derived(getActiveNotePath());
  let content = $derived(notePath ? getCachedContent(notePath) : undefined);

  let diagnostics: LintDiagnostic[] = $derived(
    content ? lintMarkdown(content, notePath ?? undefined) : []
  );

  let summary = $derived(lintSummary(diagnostics));

  function severityIcon(s: LintDiagnostic['severity']): string {
    if (s === 'error') return '⊘';
    if (s === 'warning') return '△';
    return 'ℹ';
  }

  function scrollToLine(line: number) {
    window.dispatchEvent(new CustomEvent('editor-scroll-to-line', { detail: { line } }));
  }

  let ctxDiag: LintDiagnostic | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, d: LintDiagnostic) {
    e.preventDefault();
    ctxDiag = d;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxDiag = null;
  }
</script>

<Panel title="Lint">
  {#snippet badge()}<span class="panel-badge">{diagnostics.length}</span>{/snippet}

  {#if !notePath}
    <div class="panel-empty">No note selected</div>
  {:else if diagnostics.length === 0}
    <div class="panel-empty">
      <p>No issues found</p>
      <p class="panel-empty-hint">Your markdown looks clean</p>
    </div>
  {:else}
    <div class="lint-summary">{summary}</div>
    <ul class="lint-list">
      {#each diagnostics as d, i (i)}
        <li class="lint-item lint-{d.severity}">
          <button
            class="lint-btn"
            onclick={() => scrollToLine(d.line)}
            oncontextmenu={(e) => handleContext(e, d)}
          >
            <span class="lint-icon">{severityIcon(d.severity)}</span>
            <span class="lint-msg">{d.message}</span>
            <span class="lint-loc">L{d.line}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxDiag} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxDiag) scrollToLine(ctxDiag.line);
      closeCtx();
    }}
    role="menuitem">Go to Line</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxDiag) navigator.clipboard.writeText(ctxDiag.message);
      closeCtx();
    }}
    role="menuitem">Copy Message</button
  >
</ContextMenu>

<style>
  .lint-summary {
    padding: 6px 10px;
    font-size: 0.7rem;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
  }
  .lint-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .lint-item {
    border-bottom: 1px solid var(--color-border);
  }
  .lint-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 6px 10px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.7rem;
    color: var(--color-text);
    text-align: left;
    outline: none;
  }
  .lint-btn:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .lint-btn:hover {
    background: var(--color-surface-hover);
  }
  .lint-icon {
    flex-shrink: 0;
    width: 14px;
    text-align: center;
  }
  .lint-error .lint-icon {
    color: var(--color-error);
  }
  .lint-warning .lint-icon {
    color: var(--color-warning);
  }
  .lint-info .lint-icon {
    color: var(--color-text-muted);
  }
  .lint-msg {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lint-loc {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 0.6rem;
    color: var(--color-text-muted);
  }
</style>
