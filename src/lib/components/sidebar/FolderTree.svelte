<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import Icon from '@/components/icons/Icon.svelte';
  import { selectFolder, navigatorStore, activeProfile } from '@/stores/navigator/navigator';
  import { currentVault } from '@/stores/vault/vault';

  interface FolderNode {
    path: string;
    name: string;
    children: FolderNode[];
    isExpanded: boolean;
    noteCount: number;
  }

  let rootFolders: FolderNode[] = [];
  let selectedPath: string | null = null;
  let focusedIndex = 0;
  let flattenedNodes: FolderNode[] = [];

  $: selectedPath = $navigatorStore.selectedFolder;
  $: profile = $activeProfile;

  onMount(async () => {
    await loadFolderTree();
  });

  async function loadFolderTree() {
    if (!$currentVault) return;

    try {
      const folders = await invoke<string[]>('list_folders', {
        vaultPath: $currentVault.root_path,
      });

      rootFolders = buildTree(folders);
      updateFlattenedNodes();
    } catch (error) {
      console.error('Failed to load folder tree:', error);
    }
  }

  function buildTree(paths: string[]): FolderNode[] {
    const tree: FolderNode[] = [];
    const nodeMap = new Map<string, FolderNode>();

    // Filter hidden folders based on active profile
    const filteredPaths = paths.filter(path => {
      return !profile.hiddenFolderGlobs.some(glob => {
        const regex = new RegExp(glob.replace(/\*/g, '.*'));
        return regex.test(path);
      });
    });

    // Sort paths to ensure parents come before children
    filteredPaths.sort();

    for (const path of filteredPaths) {
      const parts = path.split('/').filter(Boolean);
      const name = parts[parts.length - 1];
      
      const node: FolderNode = {
        path,
        name,
        children: [],
        isExpanded: false,
        noteCount: 0,
      };

      nodeMap.set(path, node);

      if (parts.length === 1) {
        tree.push(node);
      } else {
        const parentPath = parts.slice(0, -1).join('/');
        const parent = nodeMap.get(parentPath);
        if (parent) {
          parent.children.push(node);
        }
      }
    }

    return tree;
  }

  function updateFlattenedNodes() {
    flattenedNodes = [];
    function flatten(nodes: FolderNode[], depth = 0) {
      for (const node of nodes) {
        flattenedNodes.push(node);
        if (node.isExpanded && node.children.length > 0) {
          flatten(node.children, depth + 1);
        }
      }
    }
    flatten(rootFolders);
  }

  function toggleExpand(node: FolderNode) {
    node.isExpanded = !node.isExpanded;
    rootFolders = rootFolders; // Trigger reactivity
    updateFlattenedNodes();
  }

  function handleSelect(node: FolderNode) {
    selectFolder(node.path);
    selectedPath = node.path;
  }

  function handleKeydown(event: KeyboardEvent) {
    const node = flattenedNodes[focusedIndex];
    
    switch (event.key) {
      case 'ArrowDown':
      case 'j':
        event.preventDefault();
        focusedIndex = Math.min(focusedIndex + 1, flattenedNodes.length - 1);
        break;
      
      case 'ArrowUp':
      case 'k':
        event.preventDefault();
        focusedIndex = Math.max(focusedIndex - 1, 0);
        break;
      
      case 'ArrowRight':
        event.preventDefault();
        if (node && !node.isExpanded && node.children.length > 0) {
          toggleExpand(node);
        }
        break;
      
      case 'ArrowLeft':
        event.preventDefault();
        if (node && node.isExpanded) {
          toggleExpand(node);
        }
        break;
      
      case 'Enter':
        event.preventDefault();
        if (node) {
          handleSelect(node);
        }
        break;
    }
  }

  function getDepth(node: FolderNode): number {
    return node.path.split('/').filter(Boolean).length - 1;
  }

  function getIcon(node: FolderNode): string {
    const customIcon = $navigatorStore.folderIcons[node.path];
    if (customIcon) return customIcon;
    return node.isExpanded ? 'folder-open' : 'folder';
  }

  function getColor(node: FolderNode): string {
    return $navigatorStore.folderColors[node.path] || 'var(--text-primary)';
  }
</script>

<div class="folder-tree" on:keydown={handleKeydown} role="tree" tabindex="0">
  {#each flattenedNodes as node, index}
    {@const depth = getDepth(node)}
    {@const isSelected = node.path === selectedPath}
    {@const isFocused = index === focusedIndex}
    
    <div
      class="folder-node"
      class:selected={isSelected}
      class:focused={isFocused}
      style="padding-left: {depth * 1.5}rem; color: {getColor(node)}"
      on:click={() => handleSelect(node)}
      on:dblclick={() => toggleExpand(node)}
      role="treeitem"
      aria-expanded={node.children.length > 0 ? node.isExpanded : undefined}
      aria-selected={isSelected}
    >
      {#if node.children.length > 0}
        <button
          class="expand-btn"
          on:click|stopPropagation={() => toggleExpand(node)}
          aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
        >
          <Icon name={node.isExpanded ? 'chevron-down' : 'chevron-right'} size={14} />
        </button>
      {:else}
        <span class="expand-spacer"></span>
      {/if}
      
      <Icon name={getIcon(node)} size={16} />
      <span class="folder-name">{node.name}</span>
      
      {#if node.noteCount > 0}
        <span class="note-count">{node.noteCount}</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .folder-tree {
    height: 100%;
    overflow-y: auto;
    padding: 0.5rem 0;
    outline: none;
  }

  .folder-node {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.15s ease;
  }

  .folder-node:hover {
    background-color: var(--background-modifier-hover);
  }

  .folder-node.selected {
    background-color: var(--background-modifier-active-hover);
  }

  .folder-node.focused {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }

  .expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
  }

  .expand-btn:hover {
    color: var(--text-primary);
  }

  .expand-spacer {
    width: 1rem;
  }

  .folder-name {
    flex: 1;
    font-size: var(--font-size-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .note-count {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    padding: 0.125rem 0.375rem;
    background-color: var(--background-modifier-border);
    border-radius: 0.75rem;
  }
</style>
