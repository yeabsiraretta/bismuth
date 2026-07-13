<script lang="ts">
  import { getNotes, rescanVault } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent, updateCachedContent } from '@/hubs/editor/services/file-ops';
  import {
    buildTagHierarchy,
    getVaultTags,
    type TagCount,
    type TagNode,
  } from '@/hubs/knowledge/services/tag-extractor';
  import {
    detectMerge,
    findNotesWithTag,
    findTagPage,
    generateTagPageContent,
    renameTagsInContent,
  } from '@/hubs/knowledge/services/tag-wrangler-service';
  import { performSearch } from '@/hubs/navigator/stores/omnisearch-store.svelte';
  import { createNote, writeNote } from '@/sal/note-service';
  import { SvelteSet } from 'svelte/reactivity';
  import ContextMenu from '@/ui/context-menu.svelte';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';

  let filter = $state('');
  let hierarchyView = $state(false);
  let notes = $derived(getNotes());
  let renameDialog = $state<{ tag: string; newName: string } | null>(null);
  let renameInputEl: HTMLInputElement | undefined = $state();
  let tags = $state<TagCount[]>([]);

  let filtered = $derived(
    filter ? tags.filter((t) => t.tag.toLowerCase().includes(filter.toLowerCase())) : tags
  );
  let hierarchy = $derived(buildTagHierarchy(filtered));

  $effect(() => {
    let cancelled = false;
    const _notes = notes; // reactive dependency
    void _notes;

    getVaultTags().then((t) => {
      if (!cancelled) tags = t;
    });
    return () => {
      cancelled = true;
    };
  });

  function selectTag(tag: string) {
    window.dispatchEvent(new CustomEvent('filter-by-tag', { detail: { tag } }));
  }

  function searchTag(tag: string) {
    performSearch(`#${tag}`);
    window.dispatchEvent(new CustomEvent('filter-by-tag', { detail: { tag } }));
  }

  function handleTagClick(e: MouseEvent, tag: string) {
    if (e.altKey || e.metaKey) {
      e.preventDefault();
      openOrCreateTagPage(tag);
    } else {
      selectTag(tag);
    }
  }

  async function openOrCreateTagPage(tag: string) {
    const allNotes = notes.map((n) => ({
      path: n.path,
      title: n.title,
      content: getCachedContent(n.path) ?? '',
    }));
    const existing = findTagPage(allNotes, tag);
    if (existing) {
      openNote(existing.path);
      return;
    }
    const shouldCreate = confirm(`No tag page exists for #${tag}. Create one?`);
    if (!shouldCreate) return;
    try {
      const content = generateTagPageContent(tag);
      const title = tag.replace(/\//g, '-');
      const note = await createNote(title, undefined, content);
      await rescanVault();
      openNote(note.path);
    } catch {
      /* Tauri-only */
    }
  }

  function startRename(tag: string) {
    renameDialog = { tag, newName: tag };
    closeCtx();
    requestAnimationFrame(() => renameInputEl?.focus());
  }

  async function executeRename() {
    if (!renameDialog) return;
    const { tag: oldTag, newName: newTag } = renameDialog;
    if (!newTag.trim() || newTag === oldTag) {
      renameDialog = null;
      return;
    }

    // Check for merges
    const allTagNames = tags.map((t) => t.tag);
    const merges = detectMerge(allTagNames, oldTag, newTag);
    if (merges.length > 0) {
      const proceed = confirm(
        `Renaming #${oldTag} to #${newTag} will merge with existing tag(s): ${merges.map((m) => `#${m}`).join(', ')}.\n\nThis cannot be undone. Continue?`
      );
      if (!proceed) {
        renameDialog = null;
        return;
      }
    }

    // Perform vault-wide rename
    const affected = new SvelteSet<string>();
    for (const note of notes) {
      const content = getCachedContent(note.path);
      if (!content) continue;

      const result = renameTagsInContent(content, oldTag, newTag);
      if (result.totalReplacements > 0) {
        updateCachedContent(note.path, result.content);
        affected.add(note.path);
        try {
          await writeNote(note.path, result.content);
        } catch {
          /* Tauri-only */
        }
      }
    }

    renameDialog = null;
    if (affected.size > 0) {
      await rescanVault();
    }
  }

  function cancelRename() {
    renameDialog = null;
  }

  let ctxTag: string | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, tag: string) {
    e.preventDefault();
    ctxTag = tag;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxTag = null;
  }

  function getCtxNotesCount(): number {
    if (!ctxTag) return 0;
    const allNotes = notes.map((n) => ({
      path: n.path,
      title: n.title,
      content: getCachedContent(n.path) ?? '',
    }));
    return findNotesWithTag(allNotes, ctxTag).length;
  }

  function hasTagPage(): boolean {
    if (!ctxTag) return false;
    const allNotes = notes.map((n) => ({
      path: n.path,
      title: n.title,
      content: getCachedContent(n.path) ?? '',
    }));
    return findTagPage(allNotes, ctxTag) !== null;
  }
</script>

<Panel title="Tags">
  {#snippet badge()}<span class="panel-badge">{tags.length}</span>{/snippet}
  <div class="tags-filter">
    <div class="tags-filter-row">
      <input type="text" class="tags-input" placeholder="Filter tags..." bind:value={filter} />
      <button
        class="view-toggle"
        onclick={() => {
          hierarchyView = !hierarchyView;
        }}
        title={hierarchyView ? 'Flat view' : 'Hierarchy view'}
      >
        {hierarchyView ? '⊟' : '⊞'}
      </button>
    </div>
  </div>
  <div class="tags-body">
    {#if filtered.length === 0}
      <div class="panel-empty">
        {filter ? `No tags match "${filter}"` : 'No tags found'}
      </div>
    {:else if hierarchyView}
      <ul class="tag-list">
        {#each hierarchy as node (node.name)}
          {@render tagNode(node, 0)}
        {/each}
      </ul>
    {:else}
      <ul class="tag-list">
        {#each filtered as entry (entry.tag)}
          <li>
            <button
              class="tag-item"
              onclick={(e) => handleTagClick(e, entry.tag)}
              oncontextmenu={(e) => handleContext(e, entry.tag)}
            >
              <span class="tag-name">#{entry.tag}</span>
              <span class="tag-count">{entry.count}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Panel>

{#snippet tagNode(node: TagNode, depth: number)}
  <li>
    <button
      class="tag-item"
      style="padding-left:{8 + depth * 14}px"
      onclick={(e) => handleTagClick(e, node.name)}
      oncontextmenu={(e) => handleContext(e, node.name)}
    >
      <span class="tag-name">#{node.name.split('/').pop()}</span>
      <span class="tag-count">{node.count}</span>
    </button>
    {#if node.children.length > 0}
      <ul class="tag-children">
        {#each node.children as child (child.name)}
          {@render tagNode(child, depth + 1)}
        {/each}
      </ul>
    {/if}
  </li>
{/snippet}

<ContextMenu x={ctxX} y={ctxY} show={!!ctxTag} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTag) openOrCreateTagPage(ctxTag);
      closeCtx();
    }}
    role="menuitem"
  >
    {hasTagPage() ? 'Open Tag Page' : 'Create Tag Page'}
  </button>
  <div class="ctx-sep"></div>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTag) startRename(ctxTag);
    }}
    role="menuitem">Rename Tag…</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTag) searchTag(ctxTag);
      closeCtx();
    }}
    role="menuitem">Search for Tag</button
  >
  <div class="ctx-sep"></div>
  <button
    class="ctx-item"
    onclick={() => {
      selectTag(ctxTag!);
      closeCtx();
    }}
    role="menuitem">Filter by Tag</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTag) navigator.clipboard.writeText(`#${ctxTag}`);
      closeCtx();
    }}
    role="menuitem">Copy Tag</button
  >
  <div class="ctx-sep"></div>
  <span class="ctx-info">{getCtxNotesCount()} note{getCtxNotesCount() !== 1 ? 's' : ''}</span>
</ContextMenu>

{#if renameDialog}
  <div class="rename-overlay" role="dialog" aria-modal="true" aria-label="Rename tag" tabindex="-1">
    <div class="rename-dialog">
      <div class="rename-title">Rename #{renameDialog.tag}</div>
      <input
        bind:this={renameInputEl}
        type="text"
        class="rename-input"
        bind:value={renameDialog.newName}
        onkeydown={(e) => {
          if (e.key === 'Enter') executeRename();
          if (e.key === 'Escape') cancelRename();
        }}
        placeholder="New tag name"
      />
      <div class="rename-actions">
        <button class="rename-cancel" onclick={cancelRename}>Cancel</button>
        <button class="rename-confirm" onclick={executeRename}>Rename</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .tags-filter {
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .tags-input {
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.75rem;
    font-family: inherit;
    padding: 4px 8px;
    outline: none;
  }
  .tags-input:focus {
    border-color: var(--color-accent);
  }
  .tag-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .tag-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 4px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-s);
    font-family: inherit;
    color: var(--color-text);
  }
  .tag-item:hover {
    background: var(--color-surface-hover);
  }
  .tag-name {
    font-size: 0.75rem;
    color: var(--color-accent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .tag-count {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    background: var(--color-surface);
    padding: 0 5px;
    border-radius: var(--radius-m);
    flex-shrink: 0;
  }
  .tags-filter-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .view-toggle {
    padding: 3px 6px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.7rem;
    cursor: pointer;
    flex-shrink: 0;
  }
  .view-toggle:hover {
    background: var(--color-surface-hover);
    color: var(--color-accent);
  }
  .tag-children {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  :global(.ctx-info) {
    display: block;
    padding: 3px 10px;
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    font-style: italic;
  }
  .rename-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .rename-dialog {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    padding: 16px;
    min-width: 300px;
    box-shadow: var(--shadow-l);
  }
  .rename-title {
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--color-text);
  }
  .rename-input {
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.8rem;
    font-family: inherit;
    padding: 6px 10px;
    outline: none;
    margin-bottom: 12px;
  }
  .rename-input:focus {
    border-color: var(--color-accent);
  }
  .rename-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .rename-cancel,
  .rename-confirm {
    padding: 5px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    font-size: 0.75rem;
    cursor: pointer;
    font-family: inherit;
  }
  .rename-cancel {
    background: transparent;
    color: var(--color-text);
  }
  .rename-confirm {
    background: var(--color-accent);
    color: var(--color-on-accent, #fff);
    border-color: var(--color-accent);
  }
  .rename-confirm:hover {
    opacity: 0.9;
  }
</style>
