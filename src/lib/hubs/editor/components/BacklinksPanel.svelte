<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { getNotes, getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import { fileName, openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import { extractWikilinks } from '@/utils/wikilink';

  let notePath = $derived(getActiveNotePath() ?? '');

  interface BacklinkEntry {
    sourcePath: string;
    title: string;
  }

  let backlinks = $derived(computeBacklinks(notePath ?? ''));

  function computeBacklinks(path: string): BacklinkEntry[] {
    if (!path) return [];
    const notes = getNotes();
    const results: BacklinkEntry[] = [];
    const targetName = fileName(path, true).toLowerCase();

    for (const note of notes) {
      if (note.path === path) continue;
      const content = getCachedContent(note.path);
      if (!content) continue;

      const links = extractWikilinks(content, note.path);
      const linksToThis = links.some((l) => l.targetTitle.toLowerCase() === targetName);
      if (linksToThis) {
        results.push({ sourcePath: note.path, title: note.title });
      }
    }
    return results;
  }

  function handleOpen(entry: BacklinkEntry) {
    openNote(entry.sourcePath);
  }

  let ctxEntry: BacklinkEntry | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, entry: BacklinkEntry) {
    e.preventDefault();
    ctxEntry = entry;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxEntry = null;
  }
</script>

<Panel title="Backlinks">
  {#snippet badge()}<span class="panel-badge">{backlinks.length}</span>{/snippet}
  {#if !notePath}
    <div class="panel-empty">No note selected</div>
  {:else if backlinks.length === 0}
    <div class="panel-empty">No backlinks found</div>
  {:else}
    <ul class="backlinks-list">
      {#each backlinks as entry (entry.sourcePath)}
        <li>
          <button
            class="backlink-item"
            onclick={() => handleOpen(entry)}
            oncontextmenu={(e) => handleContext(e, entry)}
            title={entry.sourcePath}
          >
            <BIcon name="backlinks" size={14} class="backlink-icon" />
            <span class="backlink-title">{entry.title}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxEntry} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      handleOpen(ctxEntry!);
      closeCtx();
    }}
    role="menuitem">Open</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxEntry) navigator.clipboard.writeText(ctxEntry.sourcePath);
      closeCtx();
    }}
    role="menuitem">Copy Path</button
  >
</ContextMenu>

<style>
  .backlinks-list {
    list-style: none;
    padding: 4px;
    margin: 0;
  }
  .backlink-item {
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
    outline: none;
  }
  .backlink-item:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .backlink-item:hover {
    background: var(--color-surface-hover);
  }
  .backlink-item :global(.backlink-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .backlink-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
