<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { getActiveNotePath, getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import { extractWikilinks, resolveWikilink } from '@/utils/wikilink';

  let notePath = $derived(getActiveNotePath());
  let content = $derived(notePath ? (getCachedContent(notePath) ?? '') : '');
  let allPaths = $derived(getNotes().map((n) => n.path));

  interface ResolvedLink {
    title: string;
    path: string | null;
    resolved: boolean;
  }

  let links = $derived(computeLinks(content, notePath ?? '', allPaths));

  function computeLinks(src: string, srcPath: string, paths: string[]): ResolvedLink[] {
    if (!src || !srcPath) return [];
    const raw = extractWikilinks(src, srcPath);
    const seen: Record<string, boolean> = {};
    const result: ResolvedLink[] = [];
    for (const link of raw) {
      if (seen[link.targetTitle]) continue;
      seen[link.targetTitle] = true;
      const resolved = resolveWikilink(link.targetTitle, paths);
      result.push({
        title: link.targetTitle,
        path: resolved,
        resolved: !!resolved,
      });
    }
    return result;
  }

  function handleOpen(link: ResolvedLink) {
    if (link.path) {
      openNote(link.path);
    }
  }

  let ctxLink: ResolvedLink | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, link: ResolvedLink) {
    e.preventDefault();
    ctxLink = link;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxLink = null;
  }
</script>

<Panel title="Outgoing Links">
  {#snippet badge()}<span class="panel-badge">{links.length}</span>{/snippet}
  {#if !notePath}
    <div class="panel-empty">No note selected</div>
  {:else if links.length === 0}
    <div class="panel-empty">No outgoing links</div>
  {:else}
    <ul class="ol-list">
      {#each links as link (link.title)}
        <li>
          <button
            class="ol-item"
            class:unresolved={!link.resolved}
            onclick={() => handleOpen(link)}
            oncontextmenu={(e) => handleContext(e, link)}
            disabled={!link.resolved}
            title={link.path ?? `${link.title} (unresolved)`}
          >
            <BIcon name={link.resolved ? 'links' : 'unresolved'} size={14} class="ol-icon" />
            <span class="ol-name">{link.title}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxLink} onclose={closeCtx}>
  {#if ctxLink?.resolved}
    <button
      class="ctx-item"
      onclick={() => {
        handleOpen(ctxLink!);
        closeCtx();
      }}
      role="menuitem">Open</button
    >
    <button
      class="ctx-item"
      onclick={() => {
        if (ctxLink?.path) navigator.clipboard.writeText(ctxLink.path);
        closeCtx();
      }}
      role="menuitem">Copy Path</button
    >
  {/if}
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxLink) navigator.clipboard.writeText(ctxLink.title);
      closeCtx();
    }}
    role="menuitem">Copy Title</button
  >
</ContextMenu>

<style>
  .ol-list {
    list-style: none;
    padding: 4px;
    margin: 0;
  }
  .ol-item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-s);
    font-size: 0.75rem;
    color: var(--color-text);
    text-align: left;
    font-family: inherit;
  }
  .ol-item:hover:not(:disabled) {
    background: var(--color-surface-hover);
  }
  .ol-item.unresolved {
    opacity: 0.5;
    cursor: default;
  }
  .ol-item :global(.ol-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .ol-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
