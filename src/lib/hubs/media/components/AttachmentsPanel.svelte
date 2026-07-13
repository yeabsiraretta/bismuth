<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import { fileName } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';

  interface Attachment {
    name: string;
    path: string;
    ext: string;
    referencedBy: string[];
  }

  let filter = $state('');
  let attachments = $state<Attachment[]>([]);

  const MEDIA_EXTS = new Set([
    'png',
    'jpg',
    'jpeg',
    'gif',
    'svg',
    'webp',
    'pdf',
    'mp3',
    'mp4',
    'wav',
    'ogg',
    'webm',
  ]);
  $effect(() => {
    const notes = getNotes();
    const mediaFiles: SvelteMap<string, Attachment> = new SvelteMap();

    for (const note of notes) {
      const ext = note.path.split('.').pop()?.toLowerCase() ?? '';
      if (MEDIA_EXTS.has(ext)) {
        const name = fileName(note.path);
        mediaFiles.set(note.path, { name, path: note.path, ext, referencedBy: [] });
      }
    }

    attachments = Array.from(mediaFiles.values()).sort((a, b) => a.name.localeCompare(b.name));
  });

  let filtered = $derived(
    filter
      ? attachments.filter((a) => a.name.toLowerCase().includes(filter.toLowerCase()))
      : attachments
  );

  function getTypeLabel(ext: string): string {
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'Image';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'Audio';
    if (['mp4', 'webm'].includes(ext)) return 'Video';
    if (ext === 'pdf') return 'PDF';
    return ext.toUpperCase();
  }

  let ctxAtt: Attachment | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, att: Attachment) {
    e.preventDefault();
    ctxAtt = att;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxAtt = null;
  }
</script>

<Panel title="Attachments">
  {#snippet badge()}<span class="panel-badge">{attachments.length}</span>{/snippet}
  <div class="attachments-panel">
    <div class="search-row">
      <input
        type="text"
        class="filter-input"
        placeholder="Filter attachments…"
        bind:value={filter}
      />
    </div>

    {#if filtered.length === 0}
      <div class="panel-empty">
        No attachments found
        <div class="panel-empty-hint">Media files in your vault will appear here</div>
      </div>
    {:else}
      <ul class="attachment-list">
        {#each filtered as att (att.path)}
          <li class="attachment-item" oncontextmenu={(e) => handleContext(e, att)}>
            <div class="att-info">
              <span class="att-name">{att.name}</span>
              <span class="att-type">{getTypeLabel(att.ext)}</span>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxAtt} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxAtt) navigator.clipboard.writeText(ctxAtt.path);
      closeCtx();
    }}
    role="menuitem">Copy Path</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxAtt) navigator.clipboard.writeText(ctxAtt.name);
      closeCtx();
    }}
    role="menuitem">Copy Name</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxAtt) navigator.clipboard.writeText(`![[${ctxAtt.name}]]`);
      closeCtx();
    }}
    role="menuitem">Copy Embed Link</button
  >
</ContextMenu>

<style>
  .attachments-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .search-row {
    padding: 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .filter-input {
    width: 100%;
    padding: 4px 8px;
    font-size: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
  }
  .attachment-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .attachment-item {
    padding: 6px 12px;
    border-bottom: 1px solid var(--color-border);
  }
  .attachment-item:hover {
    background: var(--color-surface-hover);
  }
  .att-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .att-name {
    font-size: 0.75rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .att-type {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    flex-shrink: 0;
    margin-left: 8px;
  }
</style>
