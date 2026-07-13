<script lang="ts">
  import { getActiveNotePath, getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';

  interface EmbedRef {
    target: string;
    resolved: boolean;
    preview: string;
  }

  let embeds = $state<EmbedRef[]>([]);

  const EMBED_REGEX = /!\[\[([^\]]+)\]\]/g;

  $effect(() => {
    const path = getActiveNotePath();
    if (!path) {
      embeds = [];
      return;
    }

    const content = getCachedContent(path) ?? '';
    const notes = getNotes();
    const noteNames = new Set(notes.map((n) => n.title.toLowerCase()));
    const found: EmbedRef[] = [];

    const matches = content.matchAll(EMBED_REGEX);
    for (const m of matches) {
      const target = m[1].split('|')[0].trim();
      const resolved = noteNames.has(target.toLowerCase());
      const targetNote = notes.find((n) => n.title.toLowerCase() === target.toLowerCase());
      let preview = '';
      if (targetNote) {
        const tc = getCachedContent(targetNote.path) ?? '';
        preview = tc.slice(0, 120).replace(/\n/g, ' ');
      }
      found.push({ target, resolved, preview });
    }

    embeds = found;
  });

  function openEmbed(target: string) {
    const notes = getNotes();
    const note = notes.find((n) => n.title.toLowerCase() === target.toLowerCase());
    if (note) {
      openNote(note.path);
    }
  }

  let ctxEmbed: EmbedRef | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, embed: EmbedRef) {
    e.preventDefault();
    ctxEmbed = embed;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxEmbed = null;
  }
</script>

<Panel title="Embeds">
  {#snippet badge()}<span class="panel-badge">{embeds.length}</span>{/snippet}

  {#if embeds.length === 0}
    <div class="panel-empty">
      No embeds in current note
      <div class="panel-empty-hint">Use ![[note]] to embed content</div>
    </div>
  {:else}
    <ul class="embed-list">
      {#each embeds as embed (embed.target)}
        <li class="embed-item" class:unresolved={!embed.resolved}>
          <button
            class="embed-btn"
            onclick={() => openEmbed(embed.target)}
            oncontextmenu={(e) => handleContext(e, embed)}
            disabled={!embed.resolved}
          >
            <span class="embed-target">{embed.target}</span>
            {#if embed.resolved && embed.preview}
              <span class="embed-preview">{embed.preview}</span>
            {:else if !embed.resolved}
              <span class="embed-status">Not found</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxEmbed} onclose={closeCtx}>
  {#if ctxEmbed?.resolved}
    <button
      class="ctx-item"
      onclick={() => {
        openEmbed(ctxEmbed!.target);
        closeCtx();
      }}
      role="menuitem">Open</button
    >
  {/if}
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxEmbed) navigator.clipboard.writeText(ctxEmbed.target);
      closeCtx();
    }}
    role="menuitem">Copy Name</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxEmbed) navigator.clipboard.writeText(`![[${ctxEmbed.target}]]`);
      closeCtx();
    }}
    role="menuitem">Copy Embed Syntax</button
  >
</ContextMenu>

<style>
  .embed-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .embed-item {
    border-bottom: 1px solid var(--color-border);
  }
  .embed-item.unresolved {
    opacity: 0.6;
  }
  .embed-btn {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    min-width: 0;
  }
  .embed-btn:hover:not(:disabled) {
    background: var(--color-surface-hover);
  }
  .embed-target {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-accent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .embed-preview {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .embed-status {
    font-size: 0.65rem;
    color: var(--color-error);
  }
</style>
