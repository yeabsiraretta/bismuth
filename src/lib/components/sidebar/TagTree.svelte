<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import Icon from '@/components/icons/Icon.svelte';
  import TagNode from '@/components/sidebar/TagNode.svelte';
  import { currentVault } from '@/stores/vault/vault';
  import { IPC_PLACEHOLDERS } from '@/config/presets';

  interface TagNode {
    name: string;
    count: number;
    children: TagNode[];
    isExpanded: boolean;
  }

  let tagTree: TagNode[] = [];
  let selectedTag: string | null = null;
  let flatTags: Array<{ tag: string; count: number }> = [];

  $: if ($currentVault) {
    loadTags();
  }

  async function loadTags() {
    try {
      if (!$currentVault) return;

      // Try to get tags from backend
      const tags = await invoke<Array<{ name: string; count: number; notes: string[] }>>(
        'get_all_tags',
        { vaultPath: $currentVault.root_path }
      );

      flatTags = tags.map((tag) => ({
        tag: tag.name,
        count: tag.count,
      }));

      tagTree = buildTagTree(flatTags);
    } catch (error) {
      console.error('Failed to load tags, using placeholder data:', error);

      // Fallback to centralized placeholder data
      flatTags = IPC_PLACEHOLDERS.tagTree.tags.map((tag) => ({
        tag: tag.name,
        count: tag.count,
      }));

      tagTree = buildTagTree(flatTags);
    }
  }

  function buildTagTree(tags: Array<{ tag: string; count: number }>): TagNode[] {
    const root: TagNode[] = [];
    const nodeMap = new Map<string, TagNode>();

    for (const { tag, count } of tags) {
      const parts = tag.split('/');
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!nodeMap.has(currentPath)) {
          const node: TagNode = {
            name: part,
            count: currentPath === tag ? count : 0,
            children: [],
            isExpanded: false,
          };

          nodeMap.set(currentPath, node);

          if (parentPath) {
            const parent = nodeMap.get(parentPath);
            if (parent) {
              parent.children.push(node);
            }
          } else {
            root.push(node);
          }
        }
      }
    }

    return root;
  }

  function toggleExpand(node: TagNode) {
    node.isExpanded = !node.isExpanded;
    tagTree = tagTree; // Trigger reactivity
  }

  function handleTagClick(tag: string) {
    selectedTag = tag;
    // This would filter the file list by tag
    console.log('Filter by tag:', tag);
  }
</script>

<div class="tag-tree">
  {#if tagTree.length > 0}
    <div class="tag-list">
      {#each tagTree as node}
        <TagNode
          {node}
          parentPath=""
          {selectedTag}
          on:toggle={() => toggleExpand(node)}
          on:select={(e) => handleTagClick(e.detail)}
        />
      {/each}
    </div>
  {:else}
    <div class="placeholder">
      <Icon name="tag" size={48} />
      <p>No tags found</p>
      <span class="hint">Tags from frontmatter will appear here</span>
    </div>
  {/if}
</div>

<style>
  .tag-tree {
    height: 100%;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .tag-list {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--text-muted);
    gap: 0.75rem;
  }

  .placeholder p {
    font-size: var(--font-size-md);
    font-weight: var(--font-medium);
    margin: 0;
  }

  .hint {
    font-size: var(--font-size-sm);
    color: var(--text-faint);
  }
</style>
