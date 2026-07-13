<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { BOOKMARKS_KEY } from '@/constants/storage-keys';
  import ContextMenu from '@/ui/context-menu.svelte';
  import { openNote, fileName } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import { onMount } from 'svelte';

  let bookmarks = $state<string[]>(loadBookmarks());

  onMount(() => {
    function refresh() {
      bookmarks = loadBookmarks();
    }
    function onStorage(e: Event) {
      if ((e as StorageEvent).key === BOOKMARKS_KEY) refresh();
    }
    window.addEventListener('bookmarks-changed', refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('bookmarks-changed', refresh);
      window.removeEventListener('storage', onStorage);
    };
  });

  function loadBookmarks(): string[] {
    try {
      const raw = localStorage.getItem(BOOKMARKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save(items: string[]) {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items));
  }

  function removeBookmark(path: string) {
    bookmarks = bookmarks.filter((b) => b !== path);
    save(bookmarks);
    window.dispatchEvent(new CustomEvent('bookmarks-changed'));
  }

  let ctxPath: string | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, path: string) {
    e.preventDefault();
    ctxPath = path;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxPath = null;
  }

  function ctxCopyPath() {
    if (ctxPath) navigator.clipboard.writeText(ctxPath);
    closeCtx();
  }
</script>

<Panel title="Bookmarks">
  {#snippet badge()}<span class="panel-badge">{bookmarks.length}</span>{/snippet}
  {#if bookmarks.length === 0}
    <div class="panel-empty">
      <p>No bookmarks yet</p>
      <p class="panel-empty-hint">Right-click a note to bookmark it</p>
    </div>
  {:else}
    <ul class="bm-list">
      {#each bookmarks as path (path)}
        <li class="bm-item">
          <button
            class="bm-link"
            onclick={() => openNote(path)}
            oncontextmenu={(e) => handleContext(e, path)}
            title={path}
          >
            <BIcon name="bookmarks" size={14} class="bm-icon" />
            <span class="bm-name">{fileName(path, true)}</span>
          </button>
          <button
            class="bm-remove"
            onclick={() => removeBookmark(path)}
            aria-label="Remove bookmark"
            title="Remove"
          >
            &times;
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxPath} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      openNote(ctxPath!);
      closeCtx();
    }}
    role="menuitem">Open</button
  >
  <button class="ctx-item" onclick={ctxCopyPath} role="menuitem">Copy Path</button>
  <div class="ctx-sep"></div>
  <button
    class="ctx-item ctx-danger"
    onclick={() => {
      removeBookmark(ctxPath!);
      closeCtx();
    }}
    role="menuitem">Remove Bookmark</button
  >
</ContextMenu>

<style>
  .bm-list {
    list-style: none;
    padding: 4px;
    margin: 0;
  }
  .bm-item {
    display: flex;
    align-items: center;
    border-radius: var(--radius-s);
  }
  .bm-item:hover {
    background: var(--color-surface-hover);
  }
  .bm-link {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    padding: 4px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.75rem;
    color: var(--color-text);
    text-align: left;
    font-family: inherit;
  }
  .bm-link :global(.bm-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .bm-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bm-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--color-text-subtle);
    padding: 0 6px;
    opacity: 0;
  }
  .bm-item:hover .bm-remove {
    opacity: 1;
  }
  .bm-remove:hover {
    color: var(--color-error);
  }
</style>
