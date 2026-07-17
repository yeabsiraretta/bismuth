<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { SvelteSet } from 'svelte/reactivity';
  import { getNotes, rescanVault } from '@/hubs/core/stores/vault-store.svelte';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import { createNote, deleteNote, renameNote } from '@/sal/note-service';
  import {
    createCanvasFile,
    deleteCanvasFile,
    renameCanvasFile,
  } from '@/hubs/canvas/services/canvas-file-service';
  import { requestTextPrompt } from '@/utils/text-prompt';
  import { BOOKMARKS_KEY } from '@/constants/storage-keys';
  import { getGeneral } from '@/hubs/core/stores/settings-store.svelte';
  import BIcon from '@/ui/b-icon.svelte';

  let filter = $state('');

  let notes = $derived(getNotes());
  let tree = $derived(buildTree(notes, filter));

  interface TreeNode {
    name: string;
    path: string;
    isFolder: boolean;
    children: TreeNode[];
    expanded: boolean;
  }

  const expandedFolders = new SvelteSet<string>();

  // ── Context menu state ─────────────────────────────────────────
  let ctxVisible = $state(false);
  let ctxX = $state(0);
  let ctxY = $state(0);
  let ctxNode: TreeNode | null = $state(null);

  function buildTree(items: { path: string; title: string }[], query: string): TreeNode[] {
    const filtered = query
      ? items.filter((n) => n.title.toLowerCase().includes(query.toLowerCase()))
      : items;
    const root: TreeNode[] = [];
    const folderMap = new SvelteMap<string, TreeNode>();

    for (const item of filtered) {
      const parts = item.path.split('/');
      let parent = root;

      for (let i = 0; i < parts.length - 1; i++) {
        const folderPath = parts.slice(0, i + 1).join('/');
        let folder = folderMap.get(folderPath);
        if (!folder) {
          folder = {
            name: parts[i],
            path: folderPath,
            isFolder: true,
            children: [],
            expanded: expandedFolders.has(folderPath),
          };
          folderMap.set(folderPath, folder);
          parent.push(folder);
        }
        parent = folder.children;
      }

      parent.push({
        name: item.title || parts[parts.length - 1],
        path: item.path,
        isFolder: false,
        children: [],
        expanded: false,
      });
    }

    return sortNodes(root);
  }

  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    return [...nodes].sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  function toggleFolder(path: string) {
    if (expandedFolders.has(path)) expandedFolders.delete(path);
    else expandedFolders.add(path);
  }

  // ── Context menu actions ────────────────────────────────────────
  function showCtx(e: MouseEvent, node: TreeNode) {
    e.preventDefault();
    ctxX = e.clientX;
    ctxY = e.clientY;
    ctxNode = node;
    ctxVisible = true;
  }

  function hideCtx() {
    ctxVisible = false;
    ctxNode = null;
  }

  async function ctxNewFile() {
    const folder = ctxNode?.isFolder ? ctxNode.path : parentFolder(ctxNode?.path ?? '');
    const name = await requestTextPrompt({ title: 'New note title:' });
    if (!name?.trim()) {
      hideCtx();
      return;
    }
    try {
      await createNote(name.trim(), folder || undefined);
      await rescanVault();
    } catch {
      /* browser dev */
    }
    hideCtx();
  }

  async function ctxNewCanvas() {
    const folder = ctxNode?.isFolder ? ctxNode.path : parentFolder(ctxNode?.path ?? '');
    const name = await requestTextPrompt({ title: 'New canvas name:' });
    if (!name?.trim()) {
      hideCtx();
      return;
    }
    try {
      const entry = await createCanvasFile(name.trim(), folder || undefined);
      await rescanVault();
      openNote(entry.path);
    } catch {
      /* browser dev */
    }
    hideCtx();
  }

  async function ctxRename() {
    if (!ctxNode || ctxNode.isFolder) {
      hideCtx();
      return;
    }
    const node = ctxNode;
    const newTitle = await requestTextPrompt({ title: 'Rename to:', defaultValue: node.name });
    if (!newTitle?.trim() || newTitle.trim() === node.name) {
      hideCtx();
      return;
    }
    hideCtx();
    try {
      if (node.path.endsWith('.canvas')) {
        await renameCanvasFile(node.path, newTitle.trim());
      } else {
        await renameNote(node.path, newTitle.trim());
      }
      await rescanVault();
    } catch {
      /* browser dev */
    }
  }

  async function safeConfirm(message: string): Promise<boolean> {
    try {
      const { confirm } = await import('@tauri-apps/plugin-dialog');
      return await confirm(message, { title: 'Bismuth', kind: 'warning' });
    } catch {
      return window.confirm(message);
    }
  }

  async function ctxDelete() {
    if (!ctxNode || ctxNode.isFolder) {
      hideCtx();
      return;
    }
    const node = ctxNode;
    hideCtx();
    if (getGeneral().confirmBeforeDelete) {
      const ok = await safeConfirm(`Delete "${node.name}"?`);
      if (!ok) return;
    }
    try {
      if (node.path.endsWith('.canvas')) {
        await deleteCanvasFile(node.path);
      } else {
        await deleteNote(node.path);
      }
      await rescanVault();
    } catch {
      /* browser dev */
    }
  }

  function ctxBookmark() {
    if (!ctxNode || ctxNode.isFolder) {
      hideCtx();
      return;
    }
    try {
      const raw = localStorage.getItem(BOOKMARKS_KEY);
      const bm: string[] = raw ? JSON.parse(raw) : [];
      if (!bm.includes(ctxNode.path)) {
        bm.push(ctxNode.path);
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bm));
        window.dispatchEvent(new CustomEvent('bookmarks-changed'));
      }
    } catch {
      /* ignore */
    }
    hideCtx();
  }

  function parentFolder(path: string): string {
    const parts = path.split('/');
    return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
  }
</script>

<svelte:window onclick={hideCtx} />

{#snippet treeNodes(nodes: TreeNode[], depth: number)}
  {#each nodes as node (node.path)}
    {#if node.isFolder}
      <button
        class="tree-folder"
        style="padding-left:{8 + depth * 16}px"
        onclick={() => toggleFolder(node.path)}
        oncontextmenu={(e) => showCtx(e, node)}
      >
        <BIcon
          name="chevronRight"
          size={12}
          class="tree-chevron {node.expanded ? 'tree-expanded' : ''}"
        />
        <BIcon name="files" size={14} class="tree-icon" />
        <span class="tree-name">{node.name}</span>
      </button>
      {#if node.expanded}
        {@render treeNodes(node.children, depth + 1)}
      {/if}
    {:else}
      <button
        class="tree-file"
        style="padding-left:{8 + depth * 16}px"
        onclick={() => openNote(node.path)}
        oncontextmenu={(e) => showCtx(e, node)}
      >
        <BIcon
          name={node.path.endsWith('.canvas') ? 'canvas' : 'document'}
          size={14}
          class="tree-icon"
        />
        <span class="tree-name">{node.name}</span>
      </button>
    {/if}
  {/each}
{/snippet}

<Panel title="Files">
  {#snippet badge()}<span class="panel-badge">{notes.length}</span>{/snippet}
  <div class="tree-filter-wrap">
    <input type="text" class="tree-filter" placeholder="Filter files..." bind:value={filter} />
  </div>
  <div class="tree-body">
    {#if notes.length === 0}
      <div class="panel-empty">
        <p>No notes in vault</p>
        <p class="panel-empty-hint">Open a vault to see files</p>
      </div>
    {:else}
      {@render treeNodes(tree, 0)}
    {/if}
  </div>
</Panel>

{#if ctxVisible}
  <div class="ctx-menu" style="left:{ctxX}px;top:{ctxY}px" role="menu">
    <button class="ctx-item" onclick={ctxNewFile} role="menuitem">New Note</button>
    <button class="ctx-item" onclick={ctxNewCanvas} role="menuitem">New Canvas</button>
    {#if ctxNode && !ctxNode.isFolder}
      <button class="ctx-item" onclick={ctxRename} role="menuitem">Rename</button>
      <button class="ctx-item" onclick={ctxBookmark} role="menuitem">Bookmark</button>
      <div class="ctx-sep"></div>
      <button class="ctx-item ctx-danger" onclick={ctxDelete} role="menuitem">Delete</button>
    {/if}
  </div>
{/if}

<style>
  .tree-filter-wrap {
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .tree-filter {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.75rem;
    font-family: inherit;
    outline: none;
  }
  .tree-filter:focus {
    border-color: var(--color-accent);
  }
  .tree-body {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
  }
  .tree-folder,
  .tree-file {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 3px 8px;
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
  .tree-folder:focus-visible,
  .tree-file:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .tree-folder:hover,
  .tree-file:hover {
    background: var(--color-surface-hover);
  }
  .tree-folder :global(.tree-icon),
  .tree-file :global(.tree-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .tree-folder :global(.tree-chevron) {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    color: var(--color-text-subtle);
    transition: transform var(--transition-fast);
  }
  .tree-folder :global(.tree-expanded) {
    transform: rotate(90deg);
  }
  .tree-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ctx-menu {
    position: fixed;
    z-index: var(--z-context-menu);
    min-width: 140px;
    padding: 4px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-m);
  }
  .ctx-item {
    display: block;
    width: 100%;
    padding: 5px 10px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.7rem;
    color: var(--color-text);
    text-align: left;
    font-family: inherit;
    border-radius: var(--radius-s);
  }
  .ctx-item:hover {
    background: var(--color-surface-hover);
  }
  .ctx-danger {
    color: var(--color-error);
  }
  .ctx-sep {
    height: 1px;
    margin: 3px 4px;
    background: var(--color-border);
  }
</style>
